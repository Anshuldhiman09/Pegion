import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme, getNeumorphicStyles } from '../../theme';
import { useCall } from '../../context/CallContext';
import { useAuth } from '../../context/AuthContext';
import { callApiService, CallResponseDto } from '../../api';
import FocusAwareStatusBar from '../../components/FocusAwareStatusBar';

const defaultUser = require('../../assets/icons/user.png');
const appLogo = require('../../assets/images/pegion.png');

const formatCallTime = (dateStr?: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return `Today, ${timeStr}`;
  } else if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  } else {
    const month = date.toLocaleDateString([], { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}, ${timeStr}`;
  }
};

const CallsHome = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const neu = getNeumorphicStyles(isDark);
  const { initiateCall } = useCall();
  const { user } = useAuth();

  const [calls, setCalls] = useState<CallResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchCalls = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await callApiService.getAllCalls();
      setCalls(data || []);
    } catch (err) {
      console.error('Failed to fetch call history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(false);
        StatusBar.setBackgroundColor(colors.statusBg, true);
      }
      fetchCalls();
    }, [colors.statusBg, fetchCalls]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCalls(true);
  }, [fetchCalls]);

  const currentUserId = user?.id ? Number(user.id) : null;

  const filteredCalls = calls.filter(c => {
    const isOutgoing = currentUserId !== null && Number(c.callerId) === currentUserId;
    const name = isOutgoing ? c.receiverName || '' : c.callerName || '';
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return name.toLowerCase().includes(q) || String(c.id).includes(q);
  });

  const handleDeleteCall = (item: CallResponseDto) => {
    const isOutgoing = currentUserId !== null && Number(item.callerId) === currentUserId;
    const otherUserId = isOutgoing ? item.receiverId : item.callerId;
    const otherUserName = isOutgoing
      ? item.receiverName || `User #${item.receiverId}`
      : item.callerName || `User #${item.callerId}`;

    Alert.alert(
      'Call Log Options',
      `Manage call record for ${otherUserName}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete this record',
          style: 'destructive',
          onPress: async () => {
            try {
              await callApiService.deleteCalls([item.id]);
              setCalls(prev => prev.filter(c => c.id !== item.id));
            } catch (e) {
              Alert.alert('Error', 'Failed to delete call record');
            }
          },
        },
        {
          text: `Delete all with ${otherUserName}`,
          style: 'destructive',
          onPress: async () => {
            try {
              await callApiService.deleteAllCallsForUser(otherUserId);
              setCalls(prev =>
                prev.filter(c =>
                  isOutgoing
                    ? Number(c.receiverId) !== Number(otherUserId)
                    : Number(c.callerId) !== Number(otherUserId),
                ),
              );
            } catch (e) {
              Alert.alert('Error', 'Failed to delete all calls for user');
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: CallResponseDto }) => {
    const isOutgoing = currentUserId !== null && Number(item.callerId) === currentUserId;
    const isMissed =
      !isOutgoing &&
      (item.status === 'MISSED' ||
        item.status === 'REJECTED' ||
        item.status === 'DECLINED' ||
        item.status === 'UNANSWERED' ||
        item.status === 'NO_ANSWER' ||
        item.status === 'BUSY');
    const direction = isMissed ? 'missed' : isOutgoing ? 'outgoing' : 'incoming';
    const otherUserId = isOutgoing ? item.receiverId : item.callerId;
    const otherUserName = isOutgoing
      ? item.receiverName || `User #${item.receiverId}`
      : item.callerName || `User #${item.callerId}`;
    const isVideo = String(item.callType).toUpperCase() === 'VIDEO';
    const displayTime = formatCallTime(item.createdAt || item.startedAt);

    return (
      <TouchableOpacity
        style={[
          styles.callCard,
          neu.cardElevated({ radius: 24, depth: 'low' }),
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        activeOpacity={0.75}
        onLongPress={() => handleDeleteCall(item)}
      >
        <View
          style={[
            styles.avatarWrapper,
            neu.sunkenWell(50),
            {
              borderColor: isMissed
                ? colors.danger
                : isDark
                ? 'rgba(0,0,0,0.8)'
                : 'rgba(0,0,0,0.08)',
            },
          ]}
        >
          <Image source={defaultUser} style={styles.avatar} />
        </View>

        <View style={styles.callInfo}>
          <Text
            style={[
              styles.callName,
              { color: isMissed ? colors.danger : colors.text },
            ]}
            numberOfLines={1}
          >
            {otherUserName}
          </Text>

          <View style={styles.metaRow}>
            {direction === 'missed' ? (
              <Feather
                name="phone-missed"
                size={13}
                color={colors.danger}
                style={styles.directionIcon}
              />
            ) : direction === 'incoming' ? (
              <Feather
                name="arrow-down-left"
                size={14}
                color={colors.success}
                style={styles.directionIcon}
              />
            ) : (
              <Feather
                name="arrow-up-right"
                size={14}
                color={colors.textSecondary}
                style={styles.directionIcon}
              />
            )}
            <Text
              style={[
                styles.callTimeText,
                { color: isMissed ? colors.danger : colors.textSecondary },
              ]}
            >
              {displayTime}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.callActionBtn,
            neu.circleButton(42, { depth: 'low' }),
            { backgroundColor: colors.surfaceSubtle },
          ]}
          onPress={() => {
            console.log('📞 [CallsHome] Initiating call to:', otherUserName, otherUserId);
            initiateCall({
              receiverId: otherUserId,
              receiverName: otherUserName,
              callType: isVideo ? 'VIDEO' : 'AUDIO',
            });
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={!isVideo ? 'call' : 'videocam'}
            size={18}
            color={isMissed ? colors.danger : colors.primary}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <FocusAwareStatusBar
        backgroundColor={colors.statusBg}
        barStyle={colors.statusBar}
        translucent={false}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Top Header matching HomeChat */}
        <View style={styles.header}>
          <View
            style={[
              styles.brandLogoContainer,
              neu.circleButton(44, { depth: 'low' }),
            ]}
          >
            <Image
              source={appLogo}
              style={styles.brandLogo}
              resizeMode="contain"
            />
          </View>

          <Text style={[styles.headerTitle, { color: colors.text }]}>Calls</Text>

          {/* Top Notification Action Button */}
          <TouchableOpacity
            style={[
              styles.plusButton,
              neu.circleButton(44, { depth: 'low' }),
              { backgroundColor: colors.surface },
            ]}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Inset Search Capsule */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchCapsule,
              neu.fieldSunken({ radius: 24 }),
            ]}
          >
            <Ionicons
              name="search"
              size={18}
              color={colors.placeholderText}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.inputText }]}
              placeholder="Search call history..."
              placeholderTextColor={colors.placeholderText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={colors.placeholderText}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Calls List */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredCalls}
            keyExtractor={item => String(item.id)}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconWell, neu.sunkenWell(76)]}>
                  <Ionicons
                    name="call-outline"
                    size={40}
                    color={colors.textMuted}
                  />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {searchQuery ? 'No matching calls' : 'No call history'}
                </Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {searchQuery
                    ? 'Try searching for another contact.'
                    : 'Your voice and video calls will appear here.'}
                </Text>
              </View>
            }
          />
        )}

        {/* Floating Start Call Action Button */}
        <TouchableOpacity
          style={[
            styles.floatingCallBtn,
            neu.circleButton(58, { depth: 'high' }),
            { backgroundColor: colors.primary },
          ]}
          onPress={() => {
            console.log('🚀 [CallsHome] User pressed Floating Start Call button');
            navigation.navigate('ConnectedUsers', {
              mode: 'calls',
              isCallMode: true,
            });
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="call" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CallsHome;


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 16,
  },
  brandLogoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    elevation: 6,
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  brandLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  plusButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  searchContainer: {
    marginBottom: 14,
  },
  searchCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 23,
    paddingHorizontal: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  listContent: {
    paddingBottom: 120,
  },
  callCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  avatarWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    marginRight: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  callInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  callName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  directionIcon: {
    marginRight: 5,
  },
  callTimeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  callActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  floatingCallBtn: {
    position: 'absolute',
    bottom: 95,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  emptyContainer: {
    paddingTop: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconWell: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  loadingContainer: {
    paddingTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


