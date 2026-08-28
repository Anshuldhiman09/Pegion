// src/context/CallContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { Vibration, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { CallService, AudioRoutingService, ChatSocketService, SocketService, IncomingCallPayload, CallStatusPayload, CallType } from '../services';
import { userService } from '../api';
import { AuthContext } from './AuthContext';
import { MediaStream } from 'react-native-webrtc';

export type CallState =
  | 'IDLE'
  | 'CALLING'
  | 'RINGING'
  | 'INCOMING'
  | 'CONNECTED'
  | 'ENDED';

export interface CallUserInfo {
  id: number | string;
  name?: string;
  username?: string;
  avatarUrl?: string | null;
}

export interface InitiateCallParams {
  receiverId: number | string;
  receiverName?: string;
  receiverAvatar?: string | null;
  callType: CallType;
}

export interface InCallChatMessage {
  id: string | number;
  senderId: string | number;
  text: string;
  time: string;
  isSelf: boolean;
}

export interface CallContextType {
  callState: CallState;
  callId: number | string | null;
  callType: CallType;
  isCaller: boolean;
  otherUser: CallUserInfo | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isRemoteVideoOff: boolean;
  isSpeakerOn: boolean;
  isFrontCamera: boolean;
  callDuration: number;
  isMinimized: boolean;
  inCallMessages: InCallChatMessage[];
  initiateCall: (params: InitiateCallParams) => Promise<boolean>;
  acceptCall: () => Promise<boolean>;
  rejectCall: () => boolean;
  endCall: () => boolean;
  toggleMute: () => void;
  toggleVideo: () => void;
  switchCamera: () => void;
  toggleSpeaker: () => void;
  sendInCallMessage: (text: string) => boolean;
  setIsMinimized: (val: boolean) => void;
  openCallModal: () => void;
}

export const CallContext = createContext<CallContextType>({
  callState: 'IDLE',
  callId: null,
  callType: 'AUDIO',
  isCaller: false,
  otherUser: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isVideoOff: false,
  isRemoteVideoOff: false,
  isSpeakerOn: false,
  isFrontCamera: true,
  callDuration: 0,
  isMinimized: false,
  inCallMessages: [],
  initiateCall: async () => false,
  acceptCall: async () => false,
  rejectCall: () => false,
  endCall: () => false,
  toggleMute: () => {},
  toggleVideo: () => {},
  switchCamera: () => {},
  toggleSpeaker: () => {},
  sendInCallMessage: () => false,
  setIsMinimized: () => {},
  openCallModal: () => {},
});

export const useCall = (): CallContextType => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

const VIBRATION_PATTERN = [0, 1000, 1000];

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useContext(AuthContext);

  const [callState, setCallState] = useState<CallState>('IDLE');
  const [callId, setCallId] = useState<number | string | null>(null);
  const [callType, setCallType] = useState<CallType>('AUDIO');
  // Keep ref in sync so callbacks always see the latest value
  useEffect(() => { callTypeRef.current = callType; }, [callType]);
  const [isCaller, setIsCaller] = useState<boolean>(false);
  const [otherUser, setOtherUser] = useState<CallUserInfo | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [isRemoteVideoOff, setIsRemoteVideoOff] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(false);
  const [isFrontCamera, setIsFrontCamera] = useState<boolean>(true);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [inCallMessages, setInCallMessages] = useState<InCallChatMessage[]>([]);

  const timerRef = useRef<any>(null);
  const vibrationActiveRef = useRef<boolean>(false);
  // Always-current ref for callType — avoids stale closure in CallService callbacks
  const callTypeRef = useRef<CallType>('AUDIO');

  const startVibration = useCallback(() => {
    if (!vibrationActiveRef.current) {
      console.log('📳 [CallContext] Starting incoming call vibration');
      vibrationActiveRef.current = true;
      try {
        Vibration.vibrate(VIBRATION_PATTERN, true);
      } catch (e) {
        console.warn('⚠️ [CallContext] Vibration failed:', e);
      }
    }
  }, []);

  const stopVibration = useCallback(() => {
    if (vibrationActiveRef.current) {
      console.log('📳 [CallContext] Stopping incoming call vibration');
      vibrationActiveRef.current = false;
      try {
        Vibration.cancel();
      } catch (e) {
        console.warn('⚠️ [CallContext] Vibration cancel failed:', e);
      }
    }
  }, []);

  const startDurationTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    console.log('⏱️ [CallContext] Starting in-call duration timer (00:00)');
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration(prev => {
        const next = prev + 1;
        if (next % 30 === 0) {
          console.log(`⏱️ [CallContext] In-call elapsed duration: ${next}s`);
        }
        return next;
      });
    }, 1000);
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (timerRef.current) {
      console.log('⏱️ [CallContext] Stopping in-call duration timer');
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetCallState = useCallback((endedStatusText?: string) => {
    console.log(`🔄 [CallContext] resetCallState called with status: "${endedStatusText || 'Reset'}"`);
    stopVibration();
    stopDurationTimer();
    AudioRoutingService.stopCallAudio();
    setInCallMessages([]);

    if (endedStatusText) {
      setCallState('ENDED');
      setTimeout(() => {
        console.log('🔄 [CallContext] Resetting call state back to IDLE');
        setCallState('IDLE');
        setCallId(null);
        setOtherUser(null);
        setLocalStream(null);
        setRemoteStream(null);
        setIsMuted(false);
        setIsVideoOff(false);
        setIsRemoteVideoOff(false);
        setIsSpeakerOn(false);
        setIsFrontCamera(true);
        setCallDuration(0);
        setIsMinimized(false);
        setInCallMessages([]);
      }, 1500);
    } else {
      setCallState('IDLE');
      setCallId(null);
      setOtherUser(null);
      setLocalStream(null);
      setRemoteStream(null);
      setIsMuted(false);
      setIsVideoOff(false);
      setIsRemoteVideoOff(false);
      setIsSpeakerOn(false);
      setIsFrontCamera(true);
      setCallDuration(0);
      setIsMinimized(false);
      setInCallMessages([]);
    }
  }, [stopVibration, stopDurationTimer]);

  // Fetch caller details if incoming call doesn't have name
  const fetchCallerInfo = useCallback(async (callerId: number | string) => {
    console.log(`🔍 [CallContext] Fetching caller profile for callerId: ${callerId}`);
    try {
      const res = await userService.getUserById(Number(callerId) || callerId);
      if (res?.success && res.data) {
        console.log(`✅ [CallContext] Resolved caller profile: "${res.data.name || res.data.username}"`);
        setOtherUser({
          id: res.data.id ?? callerId,
          name: res.data.name || res.data.username || `User ${callerId}`,
          username: res.data.username || undefined,
          avatarUrl: res.data.profileImageUrl || res.data.photo || undefined,
        });
      }
    } catch (e) {
      console.warn('⚠️ [CallContext] Failed to fetch caller profile:', e);
    }
  }, []);

  // Listen for in-call 1-on-1 chat messages from the other user
  useEffect(() => {
    if (!isAuthenticated || callState !== 'CONNECTED' || !otherUser?.id) return;

    const handleIncomingChatMessage = (data: any) => {
      if (!data) return;
      let raw = data;
      if (data.message && typeof data.message === 'object') raw = data.message;
      else if (data.data && typeof data.data === 'object') raw = data.data;

      const senderId = raw.senderId ?? raw.sender_id ?? raw.sender ?? raw.from ?? raw.userId;
      const content = raw.content ?? raw.message ?? raw.text ?? raw.msg;

      if (!content || senderId === undefined || senderId === null) return;
      if (String(content).startsWith('__THEME_CHANGE__:')) return;

      if (String(senderId) === String(otherUser.id)) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newMsg: InCallChatMessage = {
          id: raw.id ?? `incall_${Date.now()}_${Math.random()}`,
          senderId: senderId,
          text: String(content),
          time: timeStr,
          isSelf: false,
        };
        setInCallMessages(prev => [...prev, newMsg]);
      }
    };

    SocketService.on('messages', handleIncomingChatMessage);
    SocketService.on('message', handleIncomingChatMessage);
    SocketService.on('chat.send', handleIncomingChatMessage);
    SocketService.on('chat.receive', handleIncomingChatMessage);

    return () => {
      SocketService.off('messages', handleIncomingChatMessage);
      SocketService.off('message', handleIncomingChatMessage);
      SocketService.off('chat.send', handleIncomingChatMessage);
      SocketService.off('chat.receive', handleIncomingChatMessage);
    };
  }, [isAuthenticated, callState, otherUser?.id]);

  // Initialize CallService listeners
  useEffect(() => {
    if (!isAuthenticated) return;
    console.log('📡 [CallContext] Setting up CallService callbacks...');

    CallService.init({
      onIncomingCall: async (data: IncomingCallPayload) => {
        console.log('📲 [CallContext] onIncomingCall callback received:', JSON.stringify(data, null, 2));
        setCallId(data.callId ?? 0);
        setCallType(data.callType);
        setIsCaller(false);
        setCallState('INCOMING');
        startVibration();

        const isVideoChat = data.callType === 'VIDEO_CHAT';
        setIsMuted(isVideoChat);
        setIsSpeakerOn(isVideoChat ? false : data.callType === 'VIDEO');

        setOtherUser({
          id: data.callerId ?? 0,
          name: `User ${data.callerId ?? 0}`,
        });

        if (data.callerId) {
          fetchCallerInfo(data.callerId);
        }
      },

      onCallRinging: (data: CallStatusPayload) => {
        console.log('🔔 [CallContext] onCallRinging callback received:', JSON.stringify(data, null, 2));
        setCallId(data.callId ?? 0);
        setCallState('RINGING');
      },

      onCallAccepted: (data: CallStatusPayload) => {
        console.log('🎉 [CallContext] onCallAccepted callback received:', JSON.stringify(data, null, 2));
        stopVibration();
        setCallId(data.callId ?? 0);
        setCallState('CONNECTED');
        // Use ref to avoid stale callType closure
        const isVideo = callTypeRef.current === 'VIDEO';
        const isVideoChat = callTypeRef.current === 'VIDEO_CHAT';
        if (!isVideoChat) {
          AudioRoutingService.startCallAudio(isVideo);
          setIsSpeakerOn(isVideo);
        } else {
          AudioRoutingService.startCallAudio(false);
          setIsMuted(true);
          setIsSpeakerOn(false);
          CallService.toggleMuteAudio(true);
          AudioRoutingService.setSpeakerphoneOn(false);
        }
        startDurationTimer();
      },

      onCallRejected: (data: CallStatusPayload) => {
        console.log('❌ [CallContext] onCallRejected callback received:', JSON.stringify(data, null, 2));
        stopVibration();
        Toast.show({
          type: 'error',
          text1: 'Call Declined',
          text2: 'The user declined the call',
        });
        resetCallState('Call Declined');
      },

      onCallEnded: (data: CallStatusPayload) => {
        console.log('🛑 [CallContext] onCallEnded callback received:', JSON.stringify(data, null, 2));
        stopVibration();
        resetCallState('Call Ended');
      },

      onLocalStream: (stream: MediaStream) => {
        console.log('🎥 [CallContext] onLocalStream attached to context state');
        setLocalStream(stream);
      },

      onRemoteStream: (stream: MediaStream) => {
        console.log('🎬 [CallContext] onRemoteStream attached to context state');
        setRemoteStream(stream);
        setCallState('CONNECTED');
        startDurationTimer();
        // Re-apply audio routing when remote audio actually starts flowing
        const isVideo = callTypeRef.current === 'VIDEO';
        const isVideoChat = callTypeRef.current === 'VIDEO_CHAT';
        if (!isVideoChat) {
          console.log(`🔊 [CallContext] onRemoteStream -> applying audio routing (isVideo: ${isVideo})`);
          AudioRoutingService.startCallAudio(isVideo);
          setIsSpeakerOn(isVideo);
        } else {
          AudioRoutingService.startCallAudio(false);
          setIsMuted(true);
          setIsSpeakerOn(false);
          CallService.toggleMuteAudio(true);
          AudioRoutingService.setSpeakerphoneOn(false);
        }
      },

      onRemoteVideoToggle: (isOff: boolean) => {
        console.log('📹 [CallContext] onRemoteVideoToggle received:', isOff);
        setIsRemoteVideoOff(isOff);
      },

      onError: (err: any) => {
        console.warn('❌ [CallContext] onError received:', err);
        Toast.show({
          type: 'error',
          text1: 'Call Error',
          text2: String(err?.message || err || 'An error occurred during the call'),
        });
      },
    });

    return () => {
      console.log('🔌 [CallContext] Cleaning up CallService callbacks on unmount');
      CallService.detachSocketListeners();
    };
  }, [isAuthenticated, fetchCallerInfo, startVibration, stopVibration, startDurationTimer, resetCallState]);

  // -------------------------------------------------------------
  // Public actions
  // -------------------------------------------------------------

  const initiateCall = useCallback(
    async ({
      receiverId,
      receiverName,
      receiverAvatar,
      callType: reqCallType,
    }: InitiateCallParams): Promise<boolean> => {
      console.log(`🚀 [CallContext] initiateCall triggered -> Target: "${receiverName || receiverId}", Type: ${reqCallType}`);
      const isVideoChat = reqCallType === 'VIDEO_CHAT';
      setCallType(reqCallType);
      setIsCaller(true);
      setOtherUser({
        id: receiverId,
        name: receiverName || `User #${receiverId}`,
        avatarUrl: receiverAvatar,
      });
      setCallState('CALLING');
      setIsMinimized(false);
      setIsMuted(isVideoChat);
      setIsVideoOff(false);
      setIsSpeakerOn(isVideoChat ? false : reqCallType === 'VIDEO');
      setIsFrontCamera(true);
      setInCallMessages([]);

      if (isVideoChat) {
        CallService.toggleMuteAudio(true);
        AudioRoutingService.setSpeakerphoneOn(false);
      }

      const success = await CallService.initiateCall(receiverId, reqCallType);
      console.log(`📡 [CallContext] CallService.initiateCall result: ${success}`);
      if (!success) {
        console.warn('❌ [CallContext] initiateCall failed, resetting state');
        resetCallState();
      }
      return success;
    },
    [resetCallState],
  );

  const acceptCall = useCallback(async (): Promise<boolean> => {
    console.log(`✅ [CallContext] acceptCall triggered for callId: ${callId}`);
    stopVibration();
    if (!callId) {
      console.warn('⚠️ [CallContext] Cannot accept call - callId is null');
      return false;
    }

    setCallState('CONNECTED');
    startDurationTimer();
    const isVideo = callTypeRef.current === 'VIDEO';
    const isVideoChat = callTypeRef.current === 'VIDEO_CHAT';
    setIsMuted(isVideoChat);
    setIsSpeakerOn(isVideoChat ? false : isVideo);
    if (!isVideoChat) {
      AudioRoutingService.startCallAudio(isVideo);
    } else {
      AudioRoutingService.startCallAudio(false);
      CallService.toggleMuteAudio(true);
      AudioRoutingService.setSpeakerphoneOn(false);
    }
    const success = await CallService.acceptCall(callId);
    console.log(`📡 [CallContext] CallService.acceptCall result: ${success}`);
    if (!success) {
      console.warn('⚠️ [CallContext] acceptCall failed, resetting state');
      resetCallState();
    }
    return success;
  }, [callId, stopVibration, startDurationTimer, resetCallState]);

  const rejectCall = useCallback((): boolean => {
    console.log(`🚫 [CallContext] rejectCall triggered for callId: ${callId}`);
    stopVibration();
    const success = CallService.rejectCall(callId ?? undefined);
    console.log(`📡 [CallContext] CallService.rejectCall result: ${success}`);
    resetCallState();
    return success;
  }, [callId, stopVibration, resetCallState]);

  const endCall = useCallback((): boolean => {
    console.log(`🛑 [CallContext] endCall triggered for callId: ${callId}`);
    stopVibration();
    const success = CallService.endCall(callId ?? undefined);
    console.log(`📡 [CallContext] CallService.endCall result: ${success}`);
    resetCallState('Call Ended');
    return success;
  }, [callId, stopVibration, resetCallState]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      console.log(`🎙️ [CallContext] User toggled mute -> isMuted: ${next}`);
      CallService.toggleMuteAudio(next);
      return next;
    });
  }, []);

  const toggleVideo = useCallback(() => {
    setIsVideoOff(prev => {
      const next = !prev;
      console.log(`📹 [CallContext] User toggled video -> isVideoOff: ${next}`);
      CallService.toggleVideo(next);
      return next;
    });
  }, []);

  const switchCamera = useCallback(() => {
    console.log('🔄 [CallContext] User toggled switchCamera');
    CallService.switchCamera();
    setIsFrontCamera(prev => !prev);
  }, []);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn(prev => {
      const next = !prev;
      console.log(`🔊 [CallContext] User toggled speaker -> isSpeakerOn: ${next}`);
      AudioRoutingService.setSpeakerphoneOn(next);
      return next;
    });
  }, []);

  const sendInCallMessage = useCallback(
    (text: string): boolean => {
      const clean = text.trim();
      if (!clean || !otherUser?.id) return false;
      const otherId = otherUser.id;
      const success = ChatSocketService.sendMessage(otherId, clean);
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newMsg: InCallChatMessage = {
        id: `incall_${Date.now()}_${Math.random()}`,
        senderId: 'me',
        text: clean,
        time: timeStr,
        isSelf: true,
      };
      setInCallMessages(prev => [...prev, newMsg]);
      return success;
    },
    [otherUser?.id],
  );

  const openCallModal = useCallback(() => {
    console.log('📱 [CallContext] User expanded minimized call modal');
    setIsMinimized(false);
  }, []);

  return (
    <CallContext.Provider
      value={{
        callState,
        callId,
        callType,
        isCaller,
        otherUser,
        localStream,
        remoteStream,
        isMuted,
        isVideoOff,
        isRemoteVideoOff,
        isSpeakerOn,
        isFrontCamera,
        callDuration,
        isMinimized,
        inCallMessages,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        switchCamera,
        toggleSpeaker,
        sendInCallMessage,
        setIsMinimized,
        openCallModal,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};
export default CallContext;
