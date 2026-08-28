// src/services/CallService.ts

import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';
import { Platform, PermissionsAndroid } from 'react-native';
import SocketService from './SocketService';

export type CallType = 'AUDIO' | 'VIDEO' | 'VIDEO_CHAT';

export interface InitiateCallPayload {
  receiverId: number | string;
  callType: CallType;
}

export interface IncomingCallPayload {
  callId?: number | string | null;
  callerId?: number | string | null;
  callType: CallType;
}

export interface CallStatusPayload {
  callId?: number | string | null;
}

export interface WebRtcOfferPayload {
  callId: number | string;
  targetUserId: number | string;
  callerId?: number | string;
  senderId?: number | string;
  offer: {
    type: string;
    sdp: string;
  };
}

export interface WebRtcAnswerPayload {
  callId: number | string;
  targetUserId: number | string;
  senderId?: number | string;
  answer: {
    type: string;
    sdp: string;
  };
}

export interface WebRtcIceCandidatePayload {
  callId: number | string;
  targetUserId: number | string;
  senderId?: number | string;
  candidate: {
    candidate: string;
    sdpMid?: string | null;
    sdpMLineIndex?: number | null;
  };
}

export interface CallCallbacks {
  onIncomingCall?: (data: IncomingCallPayload) => void;
  onCallRinging?: (data: CallStatusPayload) => void;
  onCallAccepted?: (data: CallStatusPayload) => void;
  onCallRejected?: (data: CallStatusPayload) => void;
  onCallEnded?: (data: CallStatusPayload) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteVideoToggle?: (isVideoOff: boolean) => void;
  onError?: (error: any) => void;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
  iceCandidatePoolSize: 10,
};

const RTC_CONFIG = ICE_SERVERS;

const extractCallId = (data: any): number | string | null => {
  if (!data) return null;
  if (typeof data === 'number' || typeof data === 'string') return data;
  return data.callId ?? data.id ?? data.data?.callId ?? data.data?.id ?? null;
};

class CallService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private iceCandidatesQueue: RTCIceCandidate[] = [];
  private hasRemoteDescriptionSet = false;

  private currentCallId: number | string | null = null;
  private targetUserId: number | string | null = null;
  private currentCallType: CallType = 'AUDIO';
  private isCaller = false;

  private callbacks: CallCallbacks = {};

  /**
   * Request Camera, Audio, and Bluetooth Handsfree permissions on Android
   */
  async requestPermissions(callType: CallType): Promise<boolean> {
    console.log(`🔒 [CallService] Requesting permissions for callType: ${callType} on ${Platform.OS}`);
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const audioGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'Pegion needs access to your microphone for voice and video calls.',
          buttonPositive: 'Grant',
        },
      ) === PermissionsAndroid.RESULTS.GRANTED;

      let videoGranted = true;
      if (callType === 'VIDEO' || callType === 'VIDEO_CHAT') {
        videoGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'Pegion needs access to your camera for video calls.',
            buttonPositive: 'Grant',
          },
        ) === PermissionsAndroid.RESULTS.GRANTED;
      }

      if (Platform.Version >= 31) {
        try {
          await PermissionsAndroid.request(
            (PermissionsAndroid.PERMISSIONS as any).BLUETOOTH_CONNECT,
          );
        } catch (e) {}
      }

      console.log(`🔒 [CallService] Permissions result -> Audio: ${audioGranted}, Video: ${videoGranted}`);
      return audioGranted && videoGranted;
    } catch (err) {
      console.warn('❌ [CallService] Permission request failed:', err);
      return false;
    }
  }

  /**
   * Initialize socket listeners for calling events
   */
  init(callbacks: CallCallbacks): void {
    console.log('📡 [CallService] Initializing CallService socket listeners...');
    this.callbacks = callbacks;
    this.detachSocketListeners();

    // Call signaling events
    SocketService.on('call:incoming', this.handleIncomingCall);
    SocketService.on('call:ringing', this.handleCallRinging);
    SocketService.on('call:accepted', this.handleCallAccepted);
    SocketService.on('call:rejected', this.handleCallRejected);
    SocketService.on('call:ended', this.handleCallEnded);
    SocketService.on('call:video-toggle', this.handleRemoteVideoToggle);
    SocketService.on('call:media-state', this.handleRemoteVideoToggle);
    SocketService.on('webrtc:video-toggle', this.handleRemoteVideoToggle);

    // WebRTC signaling events
    SocketService.on('webrtc:offer', this.handleWebRtcOffer);
    SocketService.on('webrtc:answer', this.handleWebRtcAnswer);
    SocketService.on('webrtc:ice-candidate', this.handleWebRtcIceCandidate);
    console.log('✅ [CallService] Socket listeners registered successfully');
  }

  detachSocketListeners(): void {
    console.log('🔌 [CallService] Detaching CallService socket listeners');
    SocketService.off('call:incoming', this.handleIncomingCall);
    SocketService.off('call:ringing', this.handleCallRinging);
    SocketService.off('call:accepted', this.handleCallAccepted);
    SocketService.off('call:rejected', this.handleCallRejected);
    SocketService.off('call:ended', this.handleCallEnded);
    SocketService.off('call:video-toggle', this.handleRemoteVideoToggle);
    SocketService.off('call:media-state', this.handleRemoteVideoToggle);
    SocketService.off('webrtc:video-toggle', this.handleRemoteVideoToggle);

    SocketService.off('webrtc:offer', this.handleWebRtcOffer);
    SocketService.off('webrtc:answer', this.handleWebRtcAnswer);
    SocketService.off('webrtc:ice-candidate', this.handleWebRtcIceCandidate);
  }

  // -------------------------------------------------------------
  // Call Control Actions (Caller & Receiver)
  // -------------------------------------------------------------

  /**
   * 1. Initiate call (Caller -> Server)
   * Event: call:initiate
   * Payload: { receiverId: number, callType: 'AUDIO' | 'VIDEO' }
   */
  async initiateCall(
    receiverId: number | string,
    callType: CallType,
  ): Promise<boolean> {
    console.log(`📞 [CallService] initiateCall called -> receiverId: ${receiverId}, callType: ${callType}`);
    const hasPerm = await this.requestPermissions(callType);
    if (!hasPerm) {
      console.warn('❌ [CallService] initiateCall aborted: Missing permissions');
      this.callbacks.onError?.('Required audio/video permissions were not granted.');
      return false;
    }

    this.pendingEndCall = false;
    this.currentCallId = null;
    this.isCaller = true;
    this.targetUserId = receiverId;
    this.currentCallType = callType;

    const backendCallType = callType === 'VIDEO_CHAT' ? 'VIDEO' : callType;
    const payload: any = {
      receiverId: Number(receiverId) || receiverId,
      callType: backendCallType,
      type: backendCallType,
      subType: callType,
      isSilentVideo: callType === 'VIDEO_CHAT',
    };
    console.log('🚀 [CallService] Emitting "call:initiate" with payload:', JSON.stringify(payload, null, 2));
    const emitted = SocketService.emit('call:initiate', payload);
    console.log(`📡 [CallService] "call:initiate" emit result: ${emitted}`);
    return emitted;
  }

  /**
   * 2. Accept call (Receiver -> Server)
   * Event: call:accept
   * Payload: { callId, callerId, targetUserId, receiverId }
   */
  async acceptCall(callId: number | string): Promise<boolean> {
    const cid = callId ?? this.currentCallId;
    const tid = this.targetUserId;
    console.log(`📞 [CallService] acceptCall called -> callId: ${cid}, targetCallerId: ${tid}`);
    const hasPerm = await this.requestPermissions(this.currentCallType);
    if (!hasPerm) {
      console.warn('❌ [CallService] acceptCall aborted: Missing permissions');
      this.callbacks.onError?.('Required audio/video permissions were not granted.');
      return false;
    }

    this.currentCallId = cid;
    this.isCaller = false;

    const safeCallId = cid !== null && cid !== undefined ? Number(cid) || cid : 0;
    const safeTargetId = tid !== null && tid !== undefined ? Number(tid) || tid : undefined;

    const payload: any = {
      callId: safeCallId,
    };
    if (safeTargetId !== undefined) {
      payload.callerId = safeTargetId;
      payload.targetUserId = safeTargetId;
      payload.receiverId = safeTargetId;
      payload.to = safeTargetId;
    }

    console.log('🚀 [CallService] Emitting "call:accept" with payload:', JSON.stringify(payload, null, 2));
    const emitted = SocketService.emit('call:accept', payload);
    console.log(`📡 [CallService] "call:accept" emit result: ${emitted}`);

    console.log(`🎥 [CallService] Receiver setting up local media stream for callType: ${this.currentCallType}`);
    await this.setupLocalMediaStream(this.currentCallType);

    return emitted;
  }

  /**
   * 3. Reject call (Receiver -> Server)
   * Event: call:reject
   * Payload: { callId, callerId, targetUserId, receiverId }
   */
  rejectCall(callId?: number | string): boolean {
    const cid = callId ?? this.currentCallId;
    const tid = this.targetUserId;
    console.log(`🚫 [CallService] rejectCall called -> callId: ${cid}, targetUserId: ${tid}`);

    const safeCallId = cid !== null && cid !== undefined ? Number(cid) || cid : 0;
    const safeTargetId = tid !== null && tid !== undefined ? Number(tid) || tid : undefined;

    const payload: any = {
      callId: safeCallId,
    };
    if (safeTargetId !== undefined) {
      payload.callerId = safeTargetId;
      payload.targetUserId = safeTargetId;
      payload.receiverId = safeTargetId;
      payload.to = safeTargetId;
    }

    console.log('🚀 [CallService] Emitting "call:reject" with payload:', JSON.stringify(payload, null, 2));
    const success = SocketService.emit('call:reject', payload);

    this.cleanup();
    return success;
  }

  private pendingEndCall = false;

  /**
   * 4. End call (Caller or Receiver -> Server)
   * Event: call:end
   * Payload: { callId, targetUserId, receiverId, callerId }
   */
  endCall(callId?: number | string): boolean {
    const cid = callId ?? this.currentCallId;
    const tid = this.targetUserId;
    console.log(`🛑 [CallService] endCall called -> callId: ${cid}, targetUserId: ${tid}`);

    if (!cid) {
      if (this.isCaller && tid) {
        console.log('⏳ [CallService] endCall called before callId was confirmed; emitting call:end with targetUserId');
        const payload: any = {
          targetUserId: Number(tid) || tid,
          receiverId: Number(tid) || tid,
          callerId: Number(tid) || tid,
          to: Number(tid) || tid,
        };
        SocketService.emit('call:end', payload);
      }
      this.pendingEndCall = false;
      this.cleanup();
      return true;
    }

    const safeCallId = Number(cid) || cid;
    const safeTargetId = tid !== null && tid !== undefined ? Number(tid) || tid : undefined;

    const payload: any = {
      callId: safeCallId,
    };
    if (safeTargetId !== undefined) {
      payload.targetUserId = safeTargetId;
      payload.receiverId = safeTargetId;
      payload.callerId = safeTargetId;
      payload.to = safeTargetId;
    }

    this.currentCallId = null;
    this.targetUserId = null;

    console.log('🚀 [CallService] Emitting "call:end" with payload:', JSON.stringify(payload, null, 2));
    const success = SocketService.emit('call:end', payload);

    this.cleanup();
    return success;
  }

  // -------------------------------------------------------------
  // Socket Event Handlers
  // -------------------------------------------------------------

  private handleIncomingCall = (data: any) => {
    console.log('📲 [CallService] EVENT "call:incoming" RECEIVED:', JSON.stringify(data, null, 2));
    const cid = extractCallId(data);
    const callerId =
      data.callerId ?? data.targetUserId ?? data.senderId ?? data.userId ?? data.from;

    const isVideoChat =
      data.callType === 'VIDEO_CHAT' ||
      data.subType === 'VIDEO_CHAT' ||
      data.isSilentVideo === true;
    const cType: CallType = isVideoChat
      ? 'VIDEO_CHAT'
      : ((data.callType || data.type || 'AUDIO').toUpperCase() as CallType);

    this.currentCallId = cid;
    this.targetUserId = callerId;
    this.currentCallType = cType;
    this.isCaller = false;
    this.pendingEndCall = false;

    this.callbacks.onIncomingCall?.({
      callId: cid ?? this.currentCallId ?? 0,
      callerId: callerId ?? 0,
      callType: cType,
    });
  };

  private handleCallRinging = (data: any) => {
    console.log('🔔 [CallService] EVENT "call:ringing" RECEIVED:', JSON.stringify(data, null, 2));
    const cid = extractCallId(data);
    if (cid) {
      this.currentCallId = cid;
    }

    // If caller requested to end before server responded with ringing
    if (this.pendingEndCall) {
      console.log('🛑 [CallService] Fulfilling pendingEndCall for callId:', this.currentCallId);
      this.pendingEndCall = false;
      if (this.currentCallId) {
        SocketService.emit('call:end', { callId: Number(this.currentCallId) || this.currentCallId });
      }
      this.cleanup();
      return;
    }

    this.callbacks.onCallRinging?.({ callId: this.currentCallId ?? cid ?? 0 });
  };

  private handleCallAccepted = async (data: any) => {
    console.log('🎉 [CallService] EVENT "call:accepted" RECEIVED:', JSON.stringify(data, null, 2));
    const cid = extractCallId(data);
    if (cid) {
      this.currentCallId = cid;
    }

    if (this.pendingEndCall) {
      console.log('🛑 [CallService] Fulfilling pendingEndCall on accepted event for callId:', this.currentCallId);
      this.pendingEndCall = false;
      if (this.currentCallId) {
        SocketService.emit('call:end', { callId: Number(this.currentCallId) || this.currentCallId });
      }
      this.cleanup();
      return;
    }

    this.callbacks.onCallAccepted?.({ callId: this.currentCallId ?? cid ?? 0 });

    // If caller, establish WebRTC offer
    if (this.isCaller) {
      console.log('🚀 [CallService] Caller starting WebRTC negotiation sequence');
      await this.startWebRtcNegotiation();
    }
  };

  private handleCallRejected = (data: any) => {
    console.log('❌ [CallService] EVENT "call:rejected" RECEIVED:', JSON.stringify(data, null, 2));
    const cid = extractCallId(data);
    this.callbacks.onCallRejected?.({ callId: cid ?? this.currentCallId ?? 0 });
    this.cleanup();
  };

  private handleCallEnded = (data: any) => {
    console.log('🛑 [CallService] EVENT "call:ended" RECEIVED:', JSON.stringify(data, null, 2));
    const cid = extractCallId(data);
    this.callbacks.onCallEnded?.({ callId: cid ?? this.currentCallId ?? 0 });
    this.cleanup();
  };

  private handleRemoteVideoToggle = (data: any) => {
    console.log('📹 [CallService] EVENT "call:video-toggle" RECEIVED:', JSON.stringify(data, null, 2));
    const isOff = Boolean(data?.isVideoOff ?? data?.isCameraOff ?? data?.videoOff ?? (data?.enabled === false));
    this.callbacks.onRemoteVideoToggle?.(isOff);
  };

  // -------------------------------------------------------------
  // WebRTC Signaling & Connection
  // -------------------------------------------------------------

  /**
   * Set up local camera/mic stream
   */
  private async setupLocalMediaStream(callType: CallType): Promise<MediaStream | null> {
    try {
      if (this.localStream) {
        console.log('ℹ️ [CallService] Reusing existing local MediaStream');
        const isMutedDefault = callType === 'VIDEO_CHAT';
        this.localStream.getAudioTracks().forEach(track => {
          track.enabled = !isMutedDefault;
        });
        this.localStream.getVideoTracks().forEach(track => {
          track.enabled = true;
        });
        return this.localStream;
      }

      const isVideo = callType === 'VIDEO' || callType === 'VIDEO_CHAT';
      const constraints: any = {
        audio: true,
        video: isVideo
          ? {
              facingMode: 'user',
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 30 },
            }
          : false,
      };

      console.log('🎙️ [CallService] Requesting getUserMedia with constraints:', JSON.stringify(constraints, null, 2));
      const stream = (await mediaDevices.getUserMedia(constraints)) as MediaStream;
      this.localStream = stream;

      // Enable video tracks; for VIDEO_CHAT, audio track is muted (enabled = false) by default
      const isMutedDefault = callType === 'VIDEO_CHAT';
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isMutedDefault;
      });
      stream.getVideoTracks().forEach(track => {
        track.enabled = true;
      });

      console.log(`✅ [CallService] Local MediaStream obtained! Audio tracks: ${stream.getAudioTracks().length} (enabled: ${!isMutedDefault}), Video tracks: ${stream.getVideoTracks().length}`);
      this.callbacks.onLocalStream?.(stream);
      return stream;
    } catch (error) {
      console.warn('❌ [CallService] getUserMedia error:', error);
      this.callbacks.onError?.(error);
      return null;
    }
  }

  /**
   * Create RTCPeerConnection instance and attach event listeners
   */
  private createPeerConnection(): RTCPeerConnection {
    if (this.peerConnection) {
      console.log('ℹ️ [CallService] Reusing existing RTCPeerConnection');
      return this.peerConnection;
    }

    console.log('⚡ [CallService] Creating new RTCPeerConnection with ICE servers:', JSON.stringify(ICE_SERVERS, null, 2));
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event: any) => {
      if (event.candidate && this.currentCallId && this.targetUserId) {
        console.log('❄️ [CallService] RTCPeerConnection generated ICE Candidate, target:', this.targetUserId, event.candidate.candidate);
        const payload: WebRtcIceCandidatePayload = {
          callId: Number(this.currentCallId) || this.currentCallId,
          targetUserId: Number(this.targetUserId) || this.targetUserId,
          candidate: {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
          },
        };
        SocketService.emit('webrtc:ice-candidate', payload);
      }
    };

    pc.ontrack = (event: any) => {
      console.log('🎬 [CallService] RTCPeerConnection "ontrack" event received, track kind:', event.track?.kind);

      const attachMuteListeners = (track: any) => {
        if (!track || track.kind !== 'video') return;
        console.log(`📹 [CallService] Attaching mute/unmute listeners to remote video track: ${track.id}`);

        track.onmute = () => {
          console.log('📹 [CallService] Remote video track MUTED (camera off)');
          this.callbacks.onRemoteVideoToggle?.(true);
        };
        track.onunmute = () => {
          console.log('📹 [CallService] Remote video track UNMUTED (camera on)');
          this.callbacks.onRemoteVideoToggle?.(false);
        };

        if (track.muted) {
          this.callbacks.onRemoteVideoToggle?.(true);
        }
      };

      const stream: MediaStream | undefined = event.streams?.[0];
      if (stream) {
        this.remoteStream = stream;
        const audioTracks = stream.getAudioTracks ? stream.getAudioTracks() : [];
        const videoTracks = stream.getVideoTracks ? stream.getVideoTracks() : [];
        console.log(`✅ [CallService] Remote MediaStream attached via ontrack! Audio: ${audioTracks.length}, Video: ${videoTracks.length}`);
        videoTracks.forEach((t: any) => attachMuteListeners(t));
        this.callbacks.onRemoteStream?.(stream);
      } else if (event.track) {
        if (!this.remoteStream) {
          this.remoteStream = new MediaStream();
        }
        this.remoteStream.addTrack(event.track);
        attachMuteListeners(event.track);
        console.log(`✅ [CallService] Added single track (${event.track.kind}) to remoteStream`);
        this.callbacks.onRemoteStream?.(this.remoteStream);
      }

      if (event.track) {
        attachMuteListeners(event.track);
      }
    };

    (pc as any).onaddstream = (event: any) => {
      console.log('🎬 [CallService] RTCPeerConnection "onaddstream" event received:', event);
      const stream: MediaStream | undefined = event.stream;
      if (stream) {
        this.remoteStream = stream;
        const audioTracks = stream.getAudioTracks ? stream.getAudioTracks() : [];
        const videoTracks = stream.getVideoTracks ? stream.getVideoTracks() : [];
        console.log(`✅ [CallService] Remote MediaStream attached via onaddstream! Audio: ${audioTracks.length}, Video: ${videoTracks.length}`);
        this.callbacks.onRemoteStream?.(stream);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`🔄 [CallService] RTCPeerConnection state changed to: "${pc.connectionState}"`);
      if (pc.connectionState === 'connected') {
        console.log('🎉 [CallService] WebRTC Peer Connection ESTABLISHED successfully!');
      } else if (pc.connectionState === 'closed') {
        console.log('🛑 [CallService] RTCPeerConnection closed -> ending call locally');
        this.callbacks.onCallEnded?.({ callId: this.currentCallId || 0 });
        this.cleanup();
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        console.warn('⚠️ [CallService] RTCPeerConnection disconnected or failed');
        setTimeout(() => {
          if (
            this.peerConnection &&
            (this.peerConnection.connectionState === 'disconnected' ||
              this.peerConnection.connectionState === 'failed' ||
              this.peerConnection.connectionState === 'closed')
          ) {
            console.log('🛑 [CallService] PeerConnection remained disconnected -> ending call');
            this.callbacks.onCallEnded?.({ callId: this.currentCallId || 0 });
            this.cleanup();
          }
        }, 1200);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`🧊 [CallService] ICE Connection state changed to: "${pc.iceConnectionState}"`);
      if (pc.iceConnectionState === 'closed') {
        console.log('🛑 [CallService] ICE connection closed -> ending call');
        this.callbacks.onCallEnded?.({ callId: this.currentCallId || 0 });
        this.cleanup();
      } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setTimeout(() => {
          if (
            this.peerConnection &&
            (this.peerConnection.iceConnectionState === 'disconnected' ||
              this.peerConnection.iceConnectionState === 'failed' ||
              this.peerConnection.iceConnectionState === 'closed')
          ) {
            console.log('🛑 [CallService] ICE remained disconnected -> ending call');
            this.callbacks.onCallEnded?.({ callId: this.currentCallId || 0 });
            this.cleanup();
          }
        }, 1200);
      }
    };

    pc.onsignalingstatechange = () => {
      console.log(`📡 [CallService] Signaling state changed to: "${pc.signalingState}"`);
      if (pc.signalingState === 'closed') {
        this.callbacks.onCallEnded?.({ callId: this.currentCallId || 0 });
        this.cleanup();
      }
    };

    this.peerConnection = pc;
    return pc;
  }

  /**
   * Start negotiation as Caller: Get stream -> Add tracks -> Create Offer -> Send webrtc:offer
   */
  private async startWebRtcNegotiation(): Promise<void> {
    try {
      console.log('🚀 [CallService] Starting WebRTC Negotiation (Role: CALLER)');
      const stream = await this.setupLocalMediaStream(this.currentCallType);
      const pc = this.createPeerConnection();

      if (stream) {
        console.log(`➕ [CallService] Adding ${stream.getTracks().length} local track(s) to PeerConnection`);
        const senders = (pc as any).getSenders ? (pc as any).getSenders() : [];
        const isMutedDefault = this.currentCallType === 'VIDEO_CHAT';
        stream.getTracks().forEach(track => {
          if (track.kind === 'audio') {
            track.enabled = !isMutedDefault;
          } else {
            track.enabled = true;
          }
          const alreadyAdded = senders.some((s: any) => s.track && s.track.id === track.id);
          if (!alreadyAdded) {
            pc.addTrack(track, stream);
          }
        });
      }

      console.log('📝 [CallService] Creating SDP Offer...');
      const offerDescription = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: this.currentCallType === 'VIDEO' || this.currentCallType === 'VIDEO_CHAT',
      });

      console.log('📌 [CallService] Setting local description (SDP Offer)...');
      await pc.setLocalDescription(offerDescription);

      if (this.currentCallId && this.targetUserId) {
        const payload: WebRtcOfferPayload = {
          callId: Number(this.currentCallId) || this.currentCallId,
          targetUserId: Number(this.targetUserId) || this.targetUserId,
          offer: {
            type: offerDescription.type,
            sdp: offerDescription.sdp,
          },
        };
        console.log('🚀 [CallService] Emitting "webrtc:offer" to server for targetUserId:', this.targetUserId);
        SocketService.emit('webrtc:offer', payload);
      }
    } catch (err) {
      console.warn('❌ [CallService] WebRTC negotiation error:', err);
      this.callbacks.onError?.(err);
    }
  }

  /**
   * 5. Handle incoming SDP Offer (Receiver)
   * Event: webrtc:offer
   */
  private handleWebRtcOffer = async (data: any) => {
    console.log('📥 [CallService] EVENT "webrtc:offer" RECEIVED:', JSON.stringify(data, null, 2));
    const offer = data?.offer;
    if (!offer?.sdp) {
      console.warn('⚠️ [CallService] Invalid webrtc:offer received - sdp is empty');
      return;
    }

    try {
      const cid = extractCallId(data);
      if (cid) {
        this.currentCallId = cid;
      }
      if (data.callerId) {
        this.targetUserId = data.callerId;
      } else if (data.senderId) {
        this.targetUserId = data.senderId;
      }

      // Check if offer contains video stream while preserving VIDEO_CHAT if set
      if (offer.sdp.includes('m=video') && !offer.sdp.includes('m=video 0') && this.currentCallType !== 'VIDEO_CHAT') {
        this.currentCallType = 'VIDEO';
      }

      console.log(`🎙️ [CallService] Receiver setting up local media stream for caller: ${this.targetUserId}...`);
      const stream = await this.setupLocalMediaStream(this.currentCallType);
      const pc = this.createPeerConnection();

      if (stream) {
        console.log(`➕ [CallService] Receiver adding ${stream.getTracks().length} local track(s) to PeerConnection`);
        const senders = (pc as any).getSenders ? (pc as any).getSenders() : [];
        const isMutedDefault = this.currentCallType === 'VIDEO_CHAT';
        stream.getTracks().forEach(track => {
          if (track.kind === 'audio') {
            track.enabled = !isMutedDefault;
          } else {
            track.enabled = true;
          }
          const alreadyAdded = senders.some((s: any) => s.track && s.track.id === track.id);
          if (!alreadyAdded) {
            pc.addTrack(track, stream);
          }
        });
      }

      const rtcSessionDesc = new RTCSessionDescription({
        type: (offer.type || 'offer') as any,
        sdp: offer.sdp,
      });

      console.log('📌 [CallService] Receiver setting remote description (SDP Offer)...');
      await pc.setRemoteDescription(rtcSessionDesc);
      this.hasRemoteDescriptionSet = true;
      await this.processQueuedIceCandidates();

      console.log('📝 [CallService] Receiver creating SDP Answer...');
      const answerDescription = await pc.createAnswer();
      console.log('📌 [CallService] Receiver setting local description (SDP Answer)...');
      await pc.setLocalDescription(answerDescription);

      // 6. Send SDP Answer (Receiver -> Server)
      if (this.currentCallId && this.targetUserId) {
        const payload: WebRtcAnswerPayload = {
          callId: Number(this.currentCallId) || this.currentCallId,
          targetUserId: Number(this.targetUserId) || this.targetUserId,
          answer: {
            type: answerDescription.type,
            sdp: answerDescription.sdp,
          },
        };
        console.log('🚀 [CallService] Emitting "webrtc:answer" to server for targetUserId:', this.targetUserId);
        SocketService.emit('webrtc:answer', payload);
      }
    } catch (err) {
      console.warn('❌ [CallService] handleWebRtcOffer error:', err);
      this.callbacks.onError?.(err);
    }
  };

  /**
   * 6. Handle incoming SDP Answer (Caller)
   * Event: webrtc:answer
   */
  private handleWebRtcAnswer = async (data: any) => {
    console.log('📥 [CallService] EVENT "webrtc:answer" RECEIVED:', JSON.stringify(data, null, 2));
    const answer = data?.answer;
    if (!answer?.sdp || !this.peerConnection) {
      console.warn('⚠️ [CallService] Cannot process webrtc:answer - peer connection or sdp missing');
      return;
    }

    try {
      const rtcSessionDesc = new RTCSessionDescription({
        type: (answer.type || 'answer') as any,
        sdp: answer.sdp,
      });

      console.log('📌 [CallService] Caller setting remote description (SDP Answer)...');
      await this.peerConnection.setRemoteDescription(rtcSessionDesc);
      this.hasRemoteDescriptionSet = true;
      await this.processQueuedIceCandidates();
      console.log('✅ [CallService] Caller remote description set & ICE candidates processed');
    } catch (err) {
      console.warn('❌ [CallService] handleWebRtcAnswer error:', err);
      this.callbacks.onError?.(err);
    }
  };

  /**
   * 7. Handle incoming ICE Candidate (Caller or Receiver)
   * Event: webrtc:ice-candidate
   */
  private handleWebRtcIceCandidate = async (data: any) => {
    console.log('📥 [CallService] EVENT "webrtc:ice-candidate" RECEIVED:', JSON.stringify(data, null, 2));
    const candidateData = data?.candidate ?? data;
    const candidateStr = candidateData?.candidate ?? (typeof candidateData === 'string' ? candidateData : null);
    if (!candidateStr) return;

    try {
      const candidate = new RTCIceCandidate({
        candidate: candidateStr,
        sdpMid: candidateData.sdpMid !== undefined && candidateData.sdpMid !== null ? String(candidateData.sdpMid) : undefined,
        sdpMLineIndex: candidateData.sdpMLineIndex !== undefined && candidateData.sdpMLineIndex !== null ? Number(candidateData.sdpMLineIndex) : undefined,
      });

      if (this.peerConnection && this.hasRemoteDescriptionSet) {
        console.log('❄️ [CallService] Adding ICE candidate directly to PeerConnection');
        await this.peerConnection.addIceCandidate(candidate);
      } else {
        console.log('⏳ [CallService] Buffering ICE candidate (remote description not set yet)');
        this.iceCandidatesQueue.push(candidate);
      }
    } catch (err) {
      console.warn('❌ [CallService] handleWebRtcIceCandidate error:', err);
    }
  };

  private async processQueuedIceCandidates(): Promise<void> {
    if (!this.peerConnection || !this.hasRemoteDescriptionSet) return;
    console.log(`🧊 [CallService] Processing ${this.iceCandidatesQueue.length} queued ICE candidate(s)...`);

    while (this.iceCandidatesQueue.length > 0) {
      const candidate = this.iceCandidatesQueue.shift();
      if (candidate) {
        try {
          await this.peerConnection.addIceCandidate(candidate);
          console.log('✅ [CallService] Queued ICE candidate added successfully');
        } catch (e) {
          console.warn('❌ [CallService] Error adding queued ICE candidate:', e);
        }
      }
    }
  }

  // -------------------------------------------------------------
  // In-Call Media Controls
  // -------------------------------------------------------------

  toggleMuteAudio(isMuted: boolean): void {
    console.log(`🎙️ [CallService] toggleMuteAudio -> isMuted: ${isMuted}`);
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
        console.log(`🎙️ [CallService] Audio track ${track.id} enabled state set to: ${!isMuted}`);
      });
    }
  }

  toggleVideo(isVideoOff: boolean): void {
    console.log(`📹 [CallService] toggleVideo -> isVideoOff: ${isVideoOff}`);
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOff;
        console.log(`📹 [CallService] Video track ${track.id} enabled state set to: ${!isVideoOff}`);
      });
    }

    const tid = this.targetUserId;
    if (tid) {
      const payload: any = {
        callId: this.currentCallId,
        targetUserId: Number(tid) || tid,
        receiverId: Number(tid) || tid,
        callerId: Number(tid) || tid,
        to: Number(tid) || tid,
        isVideoOff,
        isCameraOff: isVideoOff,
      };
      console.log('🚀 [CallService] Emitting "call:video-toggle" with payload:', JSON.stringify(payload, null, 2));
      SocketService.emit('call:video-toggle', payload);
      SocketService.emit('call:media-state', payload);
    }
  }

  switchCamera(): void {
    console.log('🔄 [CallService] switchCamera called');
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack && typeof (videoTrack as any)._switchCamera === 'function') {
        (videoTrack as any)._switchCamera();
        console.log('✅ [CallService] Camera flipped successfully via _switchCamera');
      } else {
        console.warn('⚠️ [CallService] Video track does not support _switchCamera');
      }
    }
  }

  // -------------------------------------------------------------
  // Teardown & Reset
  // -------------------------------------------------------------

  cleanup(): void {
    console.log('🧹 [CallService] Cleaning up call resources...');

    if (this.localStream) {
      console.log(`🛑 [CallService] Stopping ${this.localStream.getTracks().length} local tracks`);
      this.localStream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {}
      });
      this.localStream = null;
    }

    if (this.remoteStream) {
      console.log(`🛑 [CallService] Stopping ${this.remoteStream.getTracks().length} remote tracks`);
      this.remoteStream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {}
      });
      this.remoteStream = null;
    }

    if (this.peerConnection) {
      console.log('🛑 [CallService] Closing PeerConnection');
      try {
        this.peerConnection.close();
      } catch (e) {}
      this.peerConnection = null;
    }

    this.iceCandidatesQueue = [];
    this.hasRemoteDescriptionSet = false;
    this.currentCallId = null;
    this.targetUserId = null;
    this.isCaller = false;
    this.pendingEndCall = false;
    console.log('✅ [CallService] Cleanup complete');
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }
}

const CallServiceInstance = new CallService();
export default CallServiceInstance;
