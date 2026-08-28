import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { userService, connectionService, ProfileData } from '../../api';
import { useTheme, getNeumorphicStyles } from '../../theme';
import { useCall } from '../../context/CallContext';
import FocusAwareStatusBar from '../../components/FocusAwareStatusBar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const defaultUser = require('../../assets/icons/user.png');

type RequestStatus = 'CONNECT' | 'REQUESTED' | 'CONNECTED' | 'RECEIVED';

const UserProfileScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors, isDark } = useTheme();
  const neu = getNeumorphicStyles(isDark);
  const { initiateCall } = useCall();

  const initialUser = route.params?.user;
  const userId = route.params?.userId || initialUser?.id;

  const [requestStatus, setRequestStatus] = useState<RequestStatus>('CONNECT');
  const [incomingReqId, setIncomingReqId] = useState<number | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(
    initialUser || null,
  );
  const [loading, setLoading] = useState(!initialUser);

  // Check connection & request status
  const checkExistingRequest = useCallback(
    async (
      targetEmail?: string,
      targetUsername?: string,
      targetId?: number,
    ) => {
      try {
        // 1. Check local connected list
        const connectedRaw = await AsyncStorage.getItem('connected_emails');
        if (connectedRaw && targetEmail) {
          const connectedList: string[] = JSON.parse(connectedRaw);
          if (connectedList.includes(targetEmail.toLowerCase())) {
            setRequestStatus('CONNECTED');
            return;
          }
        }

        // 2. Check sent requests
        const sentRes = await connectionService.getSentRequests(0, 50);
        if (sentRes?.success && sentRes.data?.content) {
          const matchingSent = sentRes.data.content.find(
            req =>
              (targetId && req.reciever?.id === targetId) ||
              (targetEmail &&
                req.reciever?.email?.toLowerCase() ===
                  targetEmail.toLowerCase()) ||
              (targetUsername && req.reciever?.username === targetUsername),
          );
          if (matchingSent) {
            setRequestStatus('REQUESTED');
            return;
          }
        }

        // 3. Check received requests
        const recvRes = await connectionService.getReceivedRequests(0, 50);
        if (recvRes?.success && recvRes.data?.content) {
          const matchingRecv = recvRes.data.content.find(
            req =>
              (targetId && req.sender?.id === targetId) ||
              (targetEmail &&
                req.sender?.email?.toLowerCase() ===
                  targetEmail.toLowerCase()) ||
              (targetUsername && req.sender?.username === targetUsername),
          );
          if (matchingRecv) {
            setRequestStatus('RECEIVED');
            setIncomingReqId(matchingRecv.id);
            return;
          }
        }
      } catch (err) {
        console.log('Error checking requests status:', err);
      }
    },
    [],
  );

  const fetchUserDetails = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await userService.getUserById(userId);
      if (result?.success && result.data) {
        setProfile(result.data);
        checkExistingRequest(
          result.data.email,
          result.data.username || undefined,
          result.data.id,
        );
      }
    } catch (err) {
      console.log('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, checkExistingRequest]);

  useFocusEffect(
    useCallback(() => {
      fetchUserDetails();
      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(true);
        StatusBar.setBackgroundColor('transparent', true);
      }
      return () => {
        if (Platform.OS === 'android') {
          StatusBar.setTranslucent(false);
          StatusBar.setBackgroundColor(colors.statusBg, true);
        }
      };
    }, [fetchUserDetails, colors.statusBg]),
  );

  const saveConnectedEmail = async (email: string) => {
    try {
      const raw = await AsyncStorage.getItem('connected_emails');
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(email.toLowerCase())) {
        list.push(email.toLowerCase());
        await AsyncStorage.setItem('connected_emails', JSON.stringify(list));
      }
    } catch (e) {
      console.log('Error saving connected email:', e);
    }
  };

  const handleSendRequest = async () => {
    const email = profile?.email;
    if (!email) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'User email not found',
      });
      return;
    }

    if (requestStatus === 'CONNECTED' || requestStatus === 'REQUESTED') {
      return;
    }

    // If incoming request exists, accept it
    if (requestStatus === 'RECEIVED' && incomingReqId) {
      try {
        setSendingRequest(true);
        const res = await connectionService.respondToConnectionRequest(
          incomingReqId,
          'ACCEPT',
        );
        if (res?.success || res?.statusCodes === 200) {
          setRequestStatus('CONNECTED');
          saveConnectedEmail(email);
          Toast.show({
            type: 'success',
            text1: 'Connected',
            text2: 'Connection request accepted!!',
          });
        }
      } catch (err: any) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: err?.message || 'Could not accept request',
        });
      } finally {
        setSendingRequest(false);
      }
      return;
    }

    try {
      setSendingRequest(true);
      const res = await connectionService.sendConnectionRequest(email);
      if (res?.success || res?.statusCodes === 200) {
        setRequestStatus('REQUESTED');
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: res?.statusMsg || 'Request Sent!!',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed',
          text2: res?.statusMsg || 'Could not send request',
        });
      }
    } catch (err: any) {
      const msg = (err?.statusMsg || err?.message || '').toLowerCase();

      if (msg.includes('already connected') || err?.statusCodes === 409) {
        setRequestStatus('CONNECTED');
        saveConnectedEmail(email);
        Toast.show({
          type: 'info',
          text1: 'Connected',
          text2: 'You are connected with this user.',
        });
      } else if (
        msg.includes('already requested') ||
        msg.includes('already sent')
      ) {
        setRequestStatus('REQUESTED');
        Toast.show({
          type: 'info',
          text1: 'Pending',
          text2: 'Connection request already sent.',
        });
      } else {
        console.log('Send request error:', err);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: err?.statusMsg || err?.message || 'Failed to send request',
        });
      }
    } finally {
      setSendingRequest(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) {
      return 'Not set';
    }
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleMessagePress = () => {
    navigation.navigate('ChatScreen', {
      recipient: profile,
      otherUserId: profile?.id,
      otherUserName: profile?.name || profile?.username,
      otherUserProfileImage: profile?.profileImageUrl,
    });
  };

  const photoUri = profile?.profileImageUrl || (profile as any)?.photo;

  return (
    <View style={styles.screenContainer}>
      <FocusAwareStatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Hero Portrait Photo Background */}
      <View style={styles.heroBackground}>
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.fallbackHero,
              { backgroundColor: isDark ? '#0f172a' : '#1e293b' },
            ]}
          >
            <View style={[styles.fallbackAvatarCircle, neu.sunkenWell(130)]}>
              <Image source={defaultUser} style={styles.fallbackAvatar} />
            </View>
          </View>
        )}

        {/* Soft Vignette Overlay */}
        <View style={styles.vignetteOverlay} />
      </View>

      {/* Floating Back Navigation Button */}
      <TouchableOpacity
        style={[
          styles.floatingBackBtn,
          neu.circleButton(42, { depth: 'high' }),
          { backgroundColor: 'rgba(18, 21, 26, 0.65)' },
        ]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Ionicons
          name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
          size={22}
          color="#ffffff"
        />
      </TouchableOpacity>

      {/* Loading Indicator if fetching */}
      {loading && !profile && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}

      {/* Bottom Floating Glass Profile Card */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={{ flex: 1, minHeight: SCREEN_HEIGHT * 0.42 }} />

        <View
          style={[
            styles.cardContainer,
            neu.cardElevated({ radius: 32, depth: 'high' }),
            {
              backgroundColor: isDark
                ? 'rgba(18, 22, 28, 0.95)'
                : 'rgba(255, 255, 255, 0.96)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.14)'
                : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          {/* Top Row: Name + @handle */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.nameBlock}>
              <Text
                style={[
                  styles.displayName,
                  { color: isDark ? '#ffffff' : '#0f172a' },
                ]}
                numberOfLines={2}
              >
                {profile?.name || 'Pegion User'}
              </Text>
              <Text
                style={[
                  styles.handleText,
                  { color: isDark ? '#94a3b8' : colors.textSecondary },
                ]}
              >
                @{profile?.username || 'username'}
              </Text>
            </View>
          </View>

          {/* Bio / Quote Section */}
          <View style={styles.bioContainer}>
            <Text
              style={[
                styles.bioQuote,
                { color: isDark ? '#e2e8f0' : '#334155' },
              ]}
            >
              {profile?.description
                ? `“${profile.description}”`
                : '“Connecting moments, seamless conversations.”'}
            </Text>
          </View>

          {/* 3-Column Stats Row with real app data and spacious alignment */}
          <View style={styles.statsThreeColRow}>
            <View style={[styles.statCol, styles.statColLeft]}>
              <Text
                style={[
                  styles.statColNumber,
                  { color: isDark ? '#ffffff' : '#0f172a' },
                ]}
                numberOfLines={1}
              >
                {profile?.gender || 'Not set'}
              </Text>
              <Text
                style={[
                  styles.statColLabel,
                  { color: isDark ? '#94a3b8' : colors.textMuted },
                ]}
              >
                Gender
              </Text>
            </View>

            <View style={[styles.statCol, styles.statColCenter]}>
              <Text
                style={[
                  styles.statColNumber,
                  { color: isDark ? '#ffffff' : '#0f172a' },
                ]}
                numberOfLines={1}
              >
                {formatDate(profile?.dateOfBirth)}
              </Text>
              <Text
                style={[
                  styles.statColLabel,
                  { color: isDark ? '#94a3b8' : colors.textMuted },
                ]}
              >
                Birthday
              </Text>
            </View>

            <View style={[styles.statCol, styles.statColRight]}>
              <Text
                style={[
                  styles.statColNumber,
                  {
                    color:
                      requestStatus === 'CONNECTED'
                        ? '#22c55e'
                        : isDark
                        ? '#ffffff'
                        : '#0f172a',
                  },
                ]}
                numberOfLines={1}
              >
                {requestStatus === 'CONNECTED'
                  ? 'Connected'
                  : profile?.accountActiveStatus !== false
                  ? 'Active'
                  : 'Member'}
              </Text>
              <Text
                style={[
                  styles.statColLabel,
                  { color: isDark ? '#94a3b8' : colors.textMuted },
                ]}
              >
                Status
              </Text>
            </View>
          </View>

          {/* Bottom Primary Action Button */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                neu.circleButton(52, { depth: 'high' }),
                {
                  flex: 1,
                  borderRadius: 26,
                  backgroundColor:
                    requestStatus === 'REQUESTED'
                      ? isDark
                        ? '#334155'
                        : '#e2e8f0'
                      : requestStatus === 'CONNECTED'
                      ? '#10b981'
                      : requestStatus === 'RECEIVED'
                      ? '#059669'
                      : '#ffffff',
                },
              ]}
              onPress={handleSendRequest}
              disabled={
                sendingRequest ||
                requestStatus === 'CONNECTED' ||
                requestStatus === 'REQUESTED'
              }
              activeOpacity={0.85}
            >
              {sendingRequest ? (
                <ActivityIndicator
                  size="small"
                  color={requestStatus === 'CONNECT' ? '#0f172a' : '#ffffff'}
                />
              ) : (
                <Text
                  style={[
                    styles.primaryBtnText,
                    {
                      color:
                        requestStatus === 'REQUESTED'
                          ? colors.textSecondary
                          : requestStatus === 'CONNECTED' || requestStatus === 'RECEIVED'
                          ? '#ffffff'
                          : '#000000',
                    },
                  ]}
                >
                  {requestStatus === 'REQUESTED'
                    ? 'Requested'
                    : requestStatus === 'CONNECTED'
                    ? 'Connected'
                    : requestStatus === 'RECEIVED'
                    ? 'Accept Request'
                    : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Companion Message Button */}
            <TouchableOpacity
              style={[
                styles.messageCircleBtn,
                neu.circleButton(52, { depth: 'high' }),
                {
                  backgroundColor: isDark ? '#262c36' : colors.primary,
                },
              ]}
              onPress={handleMessagePress}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubble-ellipses" size={22} color="#ffffff" />
            </TouchableOpacity>

            {/* Audio Call Button */}
            <TouchableOpacity
              style={[
                styles.messageCircleBtn,
                neu.circleButton(52, { depth: 'high' }),
                {
                  backgroundColor: isDark ? '#262c36' : '#22c55e',
                  marginLeft: 8,
                },
              ]}
              onPress={() => {
                console.log('📞 [UserProfileScreen] User pressed Voice Call button for profile:', profile);
                if (profile?.id) {
                  initiateCall({
                    receiverId: profile.id,
                    receiverName: profile.name || profile.username || undefined,
                    receiverAvatar: profile.profileImageUrl || profile.photo || undefined,
                    callType: 'AUDIO',
                  });
                } else {
                  console.warn('⚠️ [UserProfileScreen] Cannot start call: profile.id is missing');
                }
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="call" size={20} color="#ffffff" />
            </TouchableOpacity>

            {/* Video Call Button */}
            <TouchableOpacity
              style={[
                styles.messageCircleBtn,
                neu.circleButton(52, { depth: 'high' }),
                {
                  backgroundColor: isDark ? '#262c36' : '#6366f1',
                  marginLeft: 8,
                },
              ]}
              onPress={() => {
                console.log('🎥 [UserProfileScreen] User pressed Video Call button for profile:', profile);
                if (profile?.id) {
                  initiateCall({
                    receiverId: profile.id,
                    receiverName: profile.name || profile.username || undefined,
                    receiverAvatar: profile.profileImageUrl || profile.photo || undefined,
                    callType: 'VIDEO',
                  });
                } else {
                  console.warn('⚠️ [UserProfileScreen] Cannot start call: profile.id is missing');
                }
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="videocam" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default UserProfileScreen;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#0a0d12',
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.68,
    width: SCREEN_WIDTH,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  fallbackHero: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackAvatarCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  fallbackAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.85,
  },
  vignetteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  floatingBackBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 18,
    zIndex: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    zIndex: 15,
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingBottom: 24,
  },
  cardContainer: {
    marginHorizontal: 16,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 24,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameBlock: {
    flex: 1,
    paddingRight: 12,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  handleText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  seeProfileBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeProfileText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94a3b8',
  },
  bioContainer: {
    marginTop: 14,
    marginBottom: 16,
  },
  bioQuote: {
    fontSize: 13.5,
    lineHeight: 20,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  statsThreeColRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 2,
    marginBottom: 18,
  },
  statCol: {
    flex: 1,
  },
  statColLeft: {
    alignItems: 'flex-start',
  },
  statColCenter: {
    alignItems: 'center',
  },
  statColRight: {
    alignItems: 'flex-end',
  },
  statColNumber: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  statColLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  primaryBtn: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  messageCircleBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
