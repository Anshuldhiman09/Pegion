import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  Animated,
  StatusBar,
  SafeAreaView,
  Platform,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  PanResponder,
} from 'react-native';
import { RTCView } from 'react-native-webrtc';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCall } from '../../context/CallContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme, getNeumorphicStyles } from '../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const defaultUser = require('../../assets/icons/user.png');

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const CallModal: React.FC = () => {
  const {
    callState,
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
  } = useCall();

  const { user: currentUser } = useAuth();
  const { colors, isDark } = useTheme();
  const neu = getNeumorphicStyles(isDark);

  const [chatInputText, setChatInputText] = useState('');
  const [showChatOverlay, setShowChatOverlay] = useState(true);
  const [showDropdownMenu, setShowDropdownMenu] = useState(false);
  const [isSwappedStreams, setIsSwappedStreams] = useState(false);

  const chatScrollRef = useRef<ScrollView>(null);

  // Movable/Draggable PiP PanResponder
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const isDraggingRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.dy) > 6;
      },
      onPanResponderGrant: () => {
        isDraggingRef.current = true;
        pan.setOffset({
          x: (pan.x as any)._value || 0,
          y: (pan.y as any)._value || 0,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 120);
      },
      onPanResponderTerminate: () => {
        pan.flattenOffset();
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 120);
      },
    }),
  ).current;

  // Pulsing animation for calling / ringing states
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (
      callState === 'INCOMING' ||
      callState === 'CALLING' ||
      callState === 'RINGING'
    ) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.18,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [callState, pulseAnim]);

  // Auto-scroll chat when new in-call message arrives
  useEffect(() => {
    if (inCallMessages.length > 0) {
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [inCallMessages]);

  if (callState === 'IDLE') {
    return null;
  }

  // -------------------------------------------------------------
  // Minimized Floating Widget
  // -------------------------------------------------------------
  if (isMinimized && callState !== 'INCOMING') {
    return (
      <TouchableOpacity
        style={[
          styles.minimizedContainer,
          { backgroundColor: isDark ? '#1e293b' : '#ffffff' },
        ]}
        onPress={openCallModal}
        activeOpacity={0.9}
      >
        <Image
          source={
            otherUser?.avatarUrl ? { uri: otherUser.avatarUrl } : defaultUser
          }
          style={styles.minimizedAvatar}
        />
        <View style={styles.minimizedInfo}>
          <Text
            style={[
              styles.minimizedName,
              { color: isDark ? '#ffffff' : '#0f172a' },
            ]}
            numberOfLines={1}
          >
            {otherUser?.name || 'In Call'}
          </Text>
          <Text style={styles.minimizedTimer}>
            {callState === 'CONNECTED'
              ? formatDuration(callDuration)
              : callState === 'CALLING'
              ? 'Calling...'
              : 'Ringing...'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.minimizedEndBtn}
          onPress={endCall}
          activeOpacity={0.7}
        >
          <Ionicons name="call" size={16} color="#ffffff" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  // -------------------------------------------------------------
  // Full-Screen Call Modal
  // -------------------------------------------------------------
  const isVideo = callType === 'VIDEO' || callType === 'VIDEO_CHAT';
  const isVideoChat = callType === 'VIDEO_CHAT';
  const isIncoming = callState === 'INCOMING';
  const isCalling = callState === 'CALLING';
  const isRinging = callState === 'RINGING';
  const isConnected = callState === 'CONNECTED';
  const isEnded = callState === 'ENDED';

  const localStreamUrl = localStream ? (localStream as any).toURL?.() : null;
  const remoteStreamUrl = remoteStream ? (remoteStream as any).toURL?.() : null;

  // Stream assignments based on isSwappedStreams (WhatsApp style)
  const mainStreamUrl = isSwappedStreams ? localStreamUrl : remoteStreamUrl;
  const isMainVideoOff = isSwappedStreams ? isVideoOff : isRemoteVideoOff;
  const isMainMirror = isSwappedStreams ? isFrontCamera : false;

  const pipStreamUrl = isSwappedStreams ? remoteStreamUrl : localStreamUrl;
  const isPipVideoOff = isSwappedStreams ? isRemoteVideoOff : isVideoOff;
  const isPipMirror = isSwappedStreams ? false : isFrontCamera;

  const handleSendMessage = () => {
    const text = chatInputText.trim();
    if (!text) return;
    sendInCallMessage(text);
    setChatInputText('');
  };

  const handlePipPress = () => {
    if (!isDraggingRef.current) {
      console.log('🔄 [CallModal] Swapping main and PiP video feeds');
      setIsSwappedStreams(prev => !prev);
    }
  };

  return (
    <Modal
      visible={!isMinimized}
      animationType="slide"
      transparent={false}
      onRequestClose={() => {
        if (isConnected) {
          setIsMinimized(true);
        } else if (isCalling || isRinging) {
          endCall();
        } else if (isIncoming) {
          rejectCall();
        }
      }}
    >
      <StatusBar
        backgroundColor={isVideo && isConnected ? '#000000' : colors.background}
        barStyle={isVideo && isConnected ? 'light-content' : colors.statusBar}
      />

      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor:
              isVideo && isConnected ? '#000000' : colors.background,
          },
        ]}
      >
        {/* ========================================================= */}
        {/* VIDEO CALL / VIDEO CHAT CONNECTED VIEW                    */}
        {/* ========================================================= */}
        {isVideo && isConnected ? (
          <KeyboardAvoidingView
            style={styles.videoContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Main Full Screen Video Feed */}
            {mainStreamUrl && !isMainVideoOff ? (
              <RTCView
                streamURL={mainStreamUrl}
                style={styles.remoteVideo}
                objectFit="cover"
                mirror={isMainMirror}
                zOrder={0}
              />
            ) : (
              <View style={styles.videoPlaceholder}>
                <View style={styles.remoteVideoAvatarRing}>
                  <Image
                    source={
                      (isSwappedStreams
                        ? currentUser?.profileImageUrl || (currentUser as any)?.photo
                        : otherUser?.avatarUrl)
                        ? { uri: isSwappedStreams ? currentUser?.profileImageUrl || (currentUser as any)?.photo : otherUser?.avatarUrl }
                        : defaultUser
                    }
                    style={styles.videoPlaceholderAvatar}
                  />
                </View>
                <Text style={styles.videoPlaceholderName}>
                  {isSwappedStreams ? (currentUser?.name || currentUser?.username || 'You') : (otherUser?.name || 'Pegion User')}
                </Text>
                <Text style={styles.videoPlaceholderText}>
                  {isMainVideoOff ? 'Camera is turned off' : 'Connecting video feed...'}
                </Text>
              </View>
            )}

            {/* Top Bar for Video Call */}
            <View style={styles.videoTopBar}>
              {/* Minimize Call Button */}
              <TouchableOpacity
                style={styles.videoMinimizeBtn}
                onPress={() => {
                  console.log('📱 [CallModal] User clicked minimize video call button');
                  setIsMinimized(true);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-down" size={26} color="#ffffff" />
              </TouchableOpacity>

              {/* Center Caller Info */}
              <View style={styles.videoCallerInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.videoCallerName} numberOfLines={1}>
                    {otherUser?.name || 'Pegion User'}
                  </Text>
                  {isVideoChat && (
                    <View style={styles.videoChatBadgePill}>
                      <Text style={styles.videoChatBadgeText}>Chat</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.videoDuration}>
                  {formatDuration(callDuration)}
                </Text>
              </View>

              {/* Top Right More Options Sliders Button */}
              <TouchableOpacity
                style={[
                  styles.videoMinimizeBtn,
                  showDropdownMenu && { backgroundColor: '#6366f1' },
                ]}
                onPress={() => setShowDropdownMenu(prev => !prev)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={showDropdownMenu ? 'options' : 'options-outline'}
                  size={22}
                  color="#ffffff"
                />
              </TouchableOpacity>
            </View>

            {/* Top Right Floating Dropdown Menu Panel */}
            {showDropdownMenu && (
              <View style={styles.topRightDropdownMenu}>
                {/* Switch Camera */}
                <TouchableOpacity
                  style={styles.dropdownMenuItem}
                  onPress={() => {
                    console.log('🔄 [CallModal] Flip camera from dropdown');
                    switchCamera();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.dropdownIconCircle, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                    <Ionicons name="camera-reverse" size={18} color="#ffffff" />
                  </View>
                  <Text style={styles.dropdownMenuText}>Flip Camera</Text>
                </TouchableOpacity>

                {/* Toggle Camera On/Off */}
                <TouchableOpacity
                  style={styles.dropdownMenuItem}
                  onPress={() => {
                    console.log('📹 [CallModal] Toggle camera from dropdown');
                    toggleVideo();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.dropdownIconCircle, isVideoOff ? { backgroundColor: '#ef4444' } : { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                    <Ionicons
                      name={isVideoOff ? 'videocam-off' : 'videocam'}
                      size={18}
                      color="#ffffff"
                    />
                  </View>
                  <Text style={[styles.dropdownMenuText, isVideoOff && { color: '#ef4444' }]}>
                    {isVideoOff ? 'Camera Off' : 'Camera On'}
                  </Text>
                </TouchableOpacity>

                {/* Toggle Microphone Mute */}
                <TouchableOpacity
                  style={styles.dropdownMenuItem}
                  onPress={() => {
                    console.log('🎙️ [CallModal] Toggle mic mute from dropdown');
                    toggleMute();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.dropdownIconCircle, isMuted ? { backgroundColor: '#ef4444' } : { backgroundColor: '#22c55e' }]}>
                    <Ionicons
                      name={isMuted ? 'mic-off' : 'mic'}
                      size={18}
                      color="#ffffff"
                    />
                  </View>
                  <Text style={[styles.dropdownMenuText, isMuted ? { color: '#ef4444' } : { color: '#22c55e' }]}>
                    {isMuted ? 'Mic Muted' : 'Mic On'}
                  </Text>
                </TouchableOpacity>

                {/* Toggle Speaker */}
                <TouchableOpacity
                  style={styles.dropdownMenuItem}
                  onPress={() => {
                    console.log('🔊 [CallModal] Toggle speaker from dropdown');
                    toggleSpeaker();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.dropdownIconCircle, isSpeakerOn ? { backgroundColor: '#3b82f6' } : { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                    <Ionicons
                      name={isSpeakerOn ? 'volume-high' : 'volume-mute'}
                      size={18}
                      color="#ffffff"
                    />
                  </View>
                  <Text style={[styles.dropdownMenuText, isSpeakerOn && { color: '#3b82f6' }]}>
                    {isSpeakerOn ? 'Speaker On' : 'Speaker Off'}
                  </Text>
                </TouchableOpacity>

                {/* Toggle Chat Overlay */}
                <TouchableOpacity
                  style={styles.dropdownMenuItem}
                  onPress={() => {
                    setShowChatOverlay(prev => !prev);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.dropdownIconCircle, { backgroundColor: '#6366f1' }]}>
                    <Ionicons
                      name={showChatOverlay ? 'chatbubbles' : 'chatbubbles-outline'}
                      size={18}
                      color="#ffffff"
                    />
                  </View>
                  <Text style={[styles.dropdownMenuText, { color: '#a5b4fc' }]}>
                    {showChatOverlay ? 'Hide Chat' : 'Show Chat'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Draggable & Switchable Floating PiP Video Frame */}
            <Animated.View
              style={[
                styles.localVideoPip,
                isPipVideoOff && styles.localVideoPipOff,
                {
                  transform: [
                    { translateX: pan.x },
                    { translateY: pan.y },
                  ],
                },
              ]}
              {...panResponder.panHandlers}
            >
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={handlePipPress}
                activeOpacity={0.9}
              >
                {pipStreamUrl && !isPipVideoOff ? (
                  <RTCView
                    streamURL={pipStreamUrl}
                    style={styles.localVideo}
                    objectFit="cover"
                    mirror={isPipMirror}
                    zOrder={1}
                  />
                ) : (
                  <View style={styles.localVideoOffContent}>
                    <Image
                      source={
                        (!isSwappedStreams
                          ? currentUser?.profileImageUrl || (currentUser as any)?.photo
                          : otherUser?.avatarUrl)
                          ? { uri: !isSwappedStreams ? currentUser?.profileImageUrl || (currentUser as any)?.photo : otherUser?.avatarUrl }
                          : defaultUser
                      }
                      style={styles.localVideoOffAvatar}
                    />
                    <View style={styles.cameraOffPill}>
                      <Ionicons name="videocam-off" size={11} color="#ffffff" />
                      <Text style={styles.cameraOffPillText}>Off</Text>
                    </View>
                  </View>
                )}
                {/* Switch indicator badge */}
                <View style={styles.pipSwitchHint}>
                  <Ionicons name="swap-horizontal" size={12} color="#ffffff" />
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* In-Call 1-on-1 Floating Chat Overlay */}
            {showChatOverlay && (
              <View style={styles.inCallChatContainer} pointerEvents="box-none">
                <ScrollView
                  ref={chatScrollRef}
                  style={styles.inCallMessageScroll}
                  contentContainerStyle={styles.inCallMessageScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {inCallMessages.length === 0 ? (
                    <View style={styles.inCallChatHintBox}>
                      <Ionicons name="chatbubble-ellipses-outline" size={16} color="rgba(255,255,255,0.7)" />
                      <Text style={styles.inCallChatHintText}>
                        Video chat started. Send a message to {otherUser?.name || 'peer'}!
                      </Text>
                    </View>
                  ) : (
                    inCallMessages.map(msg => (
                      <View
                        key={String(msg.id)}
                        style={[
                          styles.inCallMessageBubble,
                          msg.isSelf
                            ? styles.inCallMessageSelf
                            : styles.inCallMessageOther,
                        ]}
                      >
                        <Text style={styles.inCallMessageText}>{msg.text}</Text>
                        <Text style={styles.inCallMessageTime}>{msg.time}</Text>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
            )}

            {/* Bottom Bar: Call End Button (Left) + Full Size Chat Input (Right) */}
            <View style={styles.bottomBarRow}>
              {/* End Call Button (Left Side) */}
              <TouchableOpacity
                style={styles.endCallBtnCircle}
                onPress={() => {
                  console.log('🛑 [CallModal] User clicked End Video Call button');
                  endCall();
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="call"
                  size={24}
                  color="#ffffff"
                  style={{ transform: [{ rotate: '135deg' }] }}
                />
              </TouchableOpacity>

              {/* Full Size Chat Input Bar (Right Side) */}
              <View style={styles.bottomChatInputContainer}>
                <TextInput
                  style={styles.inCallTextInput}
                  placeholder="Type a message..."
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={chatInputText}
                  onChangeText={setChatInputText}
                  returnKeyType="send"
                  onSubmitEditing={handleSendMessage}
                />
                <TouchableOpacity
                  style={[
                    styles.inCallSendBtn,
                    !chatInputText.trim() && { opacity: 0.4 },
                  ]}
                  onPress={handleSendMessage}
                  disabled={!chatInputText.trim()}
                  activeOpacity={0.8}
                >
                  <Ionicons name="send" size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        ) : (
          /* ========================================================= */
          /* AUDIO CALL & CALLING/RINGING/INCOMING VIEW                 */
          /* ========================================================= */
          <View style={styles.audioCallContainer}>
            {/* Top Navigation Bar */}
            <View style={styles.topBar}>
              {isConnected ? (
                <TouchableOpacity
                  style={[
                    styles.topActionBtn,
                    neu.circleButton(44, { depth: 'low' }),
                  ]}
                  onPress={() => {
                    console.log('📱 [CallModal] User clicked minimize audio call button');
                    setIsMinimized(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="chevron-down"
                    size={24}
                    color={colors.text}
                  />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 44 }} />
              )}

              {/* Call Type Pill */}
              <View
                style={[
                  styles.callTypeBadge,
                  neu.fieldSunken({ radius: 16 }),
                  {
                    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                  },
                ]}
              >
                <Ionicons
                  name={isVideo ? 'videocam' : 'call'}
                  size={14}
                  color={colors.primary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.callTypeBadgeText, { color: colors.text }]}>
                  {isVideo ? 'Pegion Video' : 'Pegion Voice'}
                </Text>
              </View>

              <View style={{ width: 44 }} />
            </View>

            {/* Caller / Recipient Profile & Waves */}
            <View style={styles.centerProfileSection}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    transform: [{ scale: pulseAnim }],
                    borderColor: isEnded
                      ? colors.danger
                      : isConnected
                      ? colors.success
                      : colors.primary,
                  },
                ]}
              >
                <View
                  style={[
                    styles.avatarWell,
                    neu.sunkenWell(140),
                    {
                      borderColor: isDark
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(0,0,0,0.08)',
                    },
                  ]}
                >
                  <Image
                    source={
                      otherUser?.avatarUrl
                        ? { uri: otherUser.avatarUrl }
                        : defaultUser
                    }
                    style={styles.avatarLarge}
                  />
                </View>
              </Animated.View>

              <Text
                style={[styles.recipientLargeName, { color: colors.text }]}
                numberOfLines={1}
              >
                {otherUser?.name || 'Pegion User'}
              </Text>

              {otherUser?.username && (
                <Text
                  style={[
                    styles.recipientUsername,
                    { color: colors.textSecondary },
                  ]}
                >
                  @{otherUser.username}
                </Text>
              )}

              {/* Call State Text / Duration */}
              <View style={styles.callStateWrapper}>
                {isEnded ? (
                  <Text style={[styles.statusTextEnded, { color: colors.danger }]}>
                    Call Ended
                  </Text>
                ) : isConnected ? (
                  <View style={styles.timerRow}>
                    <View style={styles.connectedDot} />
                    <Text
                      style={[styles.timerText, { color: colors.primary }]}
                    >
                      {formatDuration(callDuration)}
                    </Text>
                  </View>
                ) : isIncoming ? (
                  <Text
                    style={[styles.statusTextRinging, { color: colors.primary }]}
                  >
                    Incoming {isVideo ? 'Video' : 'Voice'} Call...
                  </Text>
                ) : isRinging ? (
                  <Text
                    style={[styles.statusTextRinging, { color: colors.primary }]}
                  >
                    Ringing...
                  </Text>
                ) : isCalling ? (
                  <Text
                    style={[styles.statusTextCalling, { color: colors.textSecondary }]}
                  >
                    Calling...
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Bottom Actions Section */}
            <View style={styles.bottomActionsSection}>
              {isIncoming ? (
                /* Incoming Call Accept / Decline Buttons */
                <View style={styles.incomingButtonsRow}>
                  {/* Decline */}
                  <TouchableOpacity
                    style={styles.declineBtn}
                    onPress={() => {
                      console.log('🚫 [CallModal] User clicked Decline Incoming Call button');
                      rejectCall();
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="call"
                      size={28}
                      color="#ffffff"
                      style={{ transform: [{ rotate: '135deg' }] }}
                    />
                    <Text style={styles.incomingBtnLabel}>Decline</Text>
                  </TouchableOpacity>

                  {/* Accept */}
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => {
                      console.log('✅ [CallModal] User clicked Accept Incoming Call button');
                      acceptCall();
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="call" size={28} color="#ffffff" />
                    <Text style={styles.incomingBtnLabel}>Accept</Text>
                  </TouchableOpacity>
                </View>
              ) : isConnected ? (
                /* Connected Audio Controls */
                <View style={styles.connectedControlsRow}>
                  {/* Mute */}
                  <TouchableOpacity
                    style={[
                      styles.neumorphicControlBtn,
                      neu.circleButton(58, { depth: 'medium' }),
                      isMuted && { backgroundColor: '#fee2e2' },
                    ]}
                    onPress={() => {
                      console.log('🎙️ [CallModal] User clicked audio mic mute toggle button');
                      toggleMute();
                    }}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={isMuted ? 'mic-off' : 'mic'}
                      size={24}
                      color={isMuted ? '#ef4444' : colors.text}
                    />
                  </TouchableOpacity>

                  {/* Speaker */}
                  <TouchableOpacity
                    style={[
                      styles.neumorphicControlBtn,
                      neu.circleButton(58, { depth: 'medium' }),
                      isSpeakerOn && { backgroundColor: '#e0e7ff' },
                    ]}
                    onPress={() => {
                      console.log('🔊 [CallModal] User clicked audio speaker toggle button');
                      toggleSpeaker();
                    }}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={isSpeakerOn ? 'volume-high' : 'volume-medium'}
                      size={24}
                      color={isSpeakerOn ? colors.primary : colors.text}
                    />
                  </TouchableOpacity>

                  {/* End Call */}
                  <TouchableOpacity
                    style={styles.audioEndCallBtn}
                    onPress={() => {
                      console.log('🛑 [CallModal] User clicked End Audio Call button');
                      endCall();
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="call"
                      size={26}
                      color="#ffffff"
                      style={{ transform: [{ rotate: '135deg' }] }}
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                /* Outgoing / Ringing Actions */
                <View style={styles.outgoingControlsRow}>
                  {/* Mute while calling */}
                  <TouchableOpacity
                    style={[
                      styles.neumorphicControlBtn,
                      neu.circleButton(54, { depth: 'low' }),
                      isMuted && { backgroundColor: '#fee2e2' },
                    ]}
                    onPress={() => {
                      console.log('🎙️ [CallModal] User clicked mic mute while calling/ringing');
                      toggleMute();
                    }}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={isMuted ? 'mic-off' : 'mic'}
                      size={22}
                      color={isMuted ? '#ef4444' : colors.text}
                    />
                  </TouchableOpacity>

                  {/* End Call */}
                  <TouchableOpacity
                    style={styles.audioEndCallBtn}
                    onPress={() => {
                      console.log('🛑 [CallModal] User clicked End Outgoing Call button');
                      endCall();
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="call"
                      size={26}
                      color="#ffffff"
                      style={{ transform: [{ rotate: '135deg' }] }}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default CallModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  audioCallContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Platform.OS === 'android' ? 10 : 0,
  },
  topActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  callTypeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  centerProfileSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWell: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarLarge: {
    width: 132,
    height: 132,
    borderRadius: 66,
  },
  recipientLargeName: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  recipientUsername: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 16,
  },
  callStateWrapper: {
    marginTop: 12,
    alignItems: 'center',
  },
  statusTextCalling: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusTextRinging: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusTextEnded: {
    fontSize: 18,
    fontWeight: '700',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginRight: 8,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  bottomActionsSection: {
    paddingBottom: 30,
  },
  incomingButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  declineBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#ef4444',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  acceptBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#22c55e',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  incomingBtnLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  connectedControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  outgoingControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  neumorphicControlBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioEndCallBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#ef4444',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },

  // -------------------------------------------------------------
  // Video Call Styles
  // -------------------------------------------------------------
  videoContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  remoteVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  videoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  remoteVideoAvatarRing: {
    width: 144,
    height: 144,
    borderRadius: 72,
    borderWidth: 3,
    borderColor: 'rgba(99, 102, 241, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
  },
  videoPlaceholderAvatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  videoPlaceholderName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  videoPlaceholderText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  videoTopBar: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 20 : 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  videoMinimizeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoCallerInfo: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
  },
  videoCallerName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  videoChatBadgePill: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  videoChatBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  videoDuration: {
    color: '#22c55e',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },

  // -------------------------------------------------------------
  // Top-Right Dropdown Options Menu Styles
  // -------------------------------------------------------------
  topRightDropdownMenu: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 75 : 105,
    right: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    elevation: 15,
    shadowColor: '#000000',
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    zIndex: 999,
    minWidth: 175,
  },
  dropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  dropdownIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dropdownMenuText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },

  // -------------------------------------------------------------
  // In-Call 1-on-1 Floating Chat Styles
  // -------------------------------------------------------------
  inCallChatContainer: {
    position: 'absolute',
    bottom: 95,
    left: 16,
    right: 16,
    maxHeight: 280,
    zIndex: 15,
  },
  inCallMessageScroll: {
    maxHeight: 220,
  },
  inCallMessageScrollContent: {
    paddingVertical: 6,
    justifyContent: 'flex-end',
  },
  inCallChatHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  inCallChatHintText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  inCallMessageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    marginVertical: 4,
  },
  inCallMessageSelf: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    borderBottomRightRadius: 4,
  },
  inCallMessageOther: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  inCallMessageText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
  },
  inCallMessageTime: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    marginTop: 3,
    alignSelf: 'flex-end',
  },

  // -------------------------------------------------------------
  // Bottom Bar: Chat Input + End Call Row
  // -------------------------------------------------------------
  bottomBarRow: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 24 : 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 20,
  },
  bottomChatInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 26,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inCallTextInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  inCallSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  endCallBtnCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#ef4444',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  // -------------------------------------------------------------
  // Draggable PiP Styles
  // -------------------------------------------------------------
  localVideoPip: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 85 : 115,
    right: 20,
    width: 110,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ffffff',
    elevation: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 10,
  },
  localVideoPipOff: {
    backgroundColor: '#1e293b',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  localVideoOffContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 8,
  },
  localVideoOffAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginBottom: 8,
  },
  cameraOffPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  cameraOffPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 3,
  },
  pipSwitchHint: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  localVideo: {
    flex: 1,
  },

  // -------------------------------------------------------------
  // Minimized Widget Styles
  // -------------------------------------------------------------
  minimizedContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 60,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 28,
    elevation: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 9999,
  },
  minimizedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  minimizedInfo: {
    marginRight: 12,
  },
  minimizedName: {
    fontSize: 13,
    fontWeight: '700',
    maxWidth: 100,
  },
  minimizedTimer: {
    fontSize: 11,
    color: '#22c55e',
    fontWeight: '600',
  },
  minimizedEndBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '135deg' }],
  },
});
