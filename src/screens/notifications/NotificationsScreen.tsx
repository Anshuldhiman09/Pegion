import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  connectionService,
  ConnectionRequestItem,
  ConnectionRequestAction,
} from '../../api';
import { useTheme, getNeumorphicStyles } from '../../theme';
import FocusAwareStatusBar from '../../components/FocusAwareStatusBar';
import { StatusBar } from 'react-native';

const defaultUser = require('../../assets/icons/user.png');

const PAGE_SIZE = 10;

const NotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const neu = getNeumorphicStyles(isDark);

  const [activeTab, setActiveTab] = useState<'RECEIVED' | 'SENT'>('RECEIVED');

  // Received State
  const [receivedList, setReceivedList] = useState<ConnectionRequestItem[]>([]);
  const [receivedPage, setReceivedPage] = useState(0);
  const [receivedLast, setReceivedLast] = useState(true);
  const [receivedLoading, setReceivedLoading] = useState(false);
  const [receivedRefreshing, setReceivedRefreshing] = useState(false);

  // Sent State
  const [sentList, setSentList] = useState<ConnectionRequestItem[]>([]);
  const [sentPage, setSentPage] = useState(0);
  const [sentLast, setSentLast] = useState(true);
  const [sentLoading, setSentLoading] = useState(false);
  const [sentRefreshing, setSentRefreshing] = useState(false);

  // Action loading state (map of reqId -> boolean)
  const [actionLoadingMap, setActionLoadingMap] = useState<{
    [key: number]: boolean;
  }>({});

  // Fetch Received Requests
  const fetchReceived = useCallback(
    async (page: number = 0, isRefresh: boolean = false) => {
      try {
        if (isRefresh) {
          setReceivedRefreshing(true);
        } else if (page === 0) {
          setReceivedLoading(true);
        }

        const res = await connectionService.getReceivedRequests(
          page,
          PAGE_SIZE,
        );
        const data = res?.data;

        if (data?.content) {
          setReceivedList(prev =>
            page === 0 ? data.content : [...prev, ...data.content],
          );
          setReceivedLast(data.last);
          setReceivedPage(page);
        } else {
          if (page === 0) {
            setReceivedList([]);
          }
          setReceivedLast(true);
        }
      } catch (err) {
        console.log('Error fetching received requests:', err);
      } finally {
        setReceivedLoading(false);
        setReceivedRefreshing(false);
      }
    },
    [],
  );

  // Fetch Sent Requests
  const fetchSent = useCallback(
    async (page: number = 0, isRefresh: boolean = false) => {
      try {
        if (isRefresh) {
          setSentRefreshing(true);
        } else if (page === 0) {
          setSentLoading(true);
        }

        const res = await connectionService.getSentRequests(page, PAGE_SIZE);
        const data = res?.data;

        if (data?.content) {
          setSentList(prev =>
            page === 0 ? data.content : [...prev, ...data.content],
          );
          setSentLast(data.last);
          setSentPage(page);
        } else {
          if (page === 0) {
            setSentList([]);
          }
          setSentLast(true);
        }
      } catch (err) {
        console.log('Error fetching sent requests:', err);
      } finally {
        setSentLoading(false);
        setSentRefreshing(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(false);
        StatusBar.setBackgroundColor(colors.statusBg, true);
      }
      fetchReceived(0);
      fetchSent(0);
    }, [fetchReceived, fetchSent, colors.statusBg]),
  );

  const handleAction = async (
    reqId: number,
    action: ConnectionRequestAction,
  ) => {
    try {
      setActionLoadingMap(prev => ({ ...prev, [reqId]: true }));
      const res = await connectionService.respondToConnectionRequest(
        reqId,
        action,
      );

      if (res?.success || res?.statusCodes === 200) {
        Toast.show({
          type: 'success',
          text1: action === 'ACCEPT' ? 'Accepted' : 'Rejected',
          text2: res?.statusMsg || `Request ${action.toLowerCase()}ed!!`,
        });
        // Remove from received list
        setReceivedList(prev => prev.filter(item => item.id !== reqId));
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed',
          text2: res?.statusMsg || 'Action failed',
        });
      }
    } catch (err: any) {
      console.log('Action error:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err?.response?.data?.statusMsg || 'Something went wrong',
      });
    } finally {
      setActionLoadingMap(prev => ({ ...prev, [reqId]: false }));
    }
  };

  const handleUserClick = (targetUser?: any) => {
    if (targetUser) {
      navigation.navigate('UserProfile', {
        userId: targetUser.id,
        user: targetUser,
      });
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) {
      return '';
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
  };

  // Render Received Request Item
  const renderReceivedItem = ({ item }: { item: ConnectionRequestItem }) => {
    const sender = item.sender;
    const isActionLoading = actionLoadingMap[item.id] || false;

    return (
      <View
        style={[
          styles.requestCard,
          neu.cardElevated({ radius: 20, depth: 'low' }),
        ]}
      >
        <TouchableOpacity
          style={styles.userInfoRow}
          onPress={() => handleUserClick(sender)}
        >
          <View style={[styles.avatarWrapper, neu.sunkenWell(48)]}>
            <Image
              source={
                sender?.profileImageUrl
                  ? { uri: sender.profileImageUrl }
                  : defaultUser
              }
              style={styles.avatar}
            />
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.name, { color: colors.text }]}>
              {sender?.name || sender?.username || 'Unknown User'}
            </Text>
            {sender?.username ? (
              <Text style={[styles.username, { color: colors.textSecondary }]}>
                @{sender.username}
              </Text>
            ) : null}
            <Text style={[styles.timeText, { color: colors.textMuted }]}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={[styles.actionRow, { borderTopColor: colors.divider }]}>
          <TouchableOpacity
            style={[
              styles.rejectBtn,
              neu.circleButton(36, { depth: 'low' }),
              { width: 'auto', paddingHorizontal: 16, borderRadius: 18 },
            ]}
            onPress={() => handleAction(item.id, 'REJECT')}
            disabled={isActionLoading}
          >
            <Text style={[styles.rejectBtnText, { color: colors.textSecondary }]}>
              Reject
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.acceptBtn,
              neu.circleButton(36, { depth: 'high' }),
              { backgroundColor: colors.success, width: 'auto', paddingHorizontal: 20, borderRadius: 18 },
            ]}
            onPress={() => handleAction(item.id, 'ACCEPT')}
            disabled={isActionLoading}
          >
            {isActionLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.acceptBtnText}>Accept</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render Sent Request Item
  const renderSentItem = ({ item }: { item: ConnectionRequestItem }) => {
    const receiver = item.reciever;

    return (
      <View
        style={[
          styles.requestCard,
          neu.cardElevated({ radius: 20, depth: 'low' }),
        ]}
      >
        <TouchableOpacity
          style={styles.userInfoRow}
          onPress={() => handleUserClick(receiver)}
        >
          <View style={[styles.avatarWrapper, neu.sunkenWell(48)]}>
            <Image
              source={
                receiver?.profileImageUrl
                  ? { uri: receiver.profileImageUrl }
                  : defaultUser
              }
              style={styles.avatar}
            />
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.name, { color: colors.text }]}>
              {receiver?.name || receiver?.username || 'Unknown User'}
            </Text>
            {receiver?.username ? (
              <Text style={[styles.username, { color: colors.textSecondary }]}>
                @{receiver.username}
              </Text>
            ) : null}
            <Text style={[styles.timeText, { color: colors.textMuted }]}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={[styles.statusBadge, neu.badgeEmbossed()]}>
          <Text style={[styles.statusBadgeText, { color: colors.textSecondary }]}>
            Pending
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <FocusAwareStatusBar
        backgroundColor={colors.statusBg}
        barStyle={colors.statusBar}
        translucent={false}
      />
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, neu.circleButton(38, { depth: 'low' })]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Connection Requests
        </Text>
        <TouchableOpacity
          style={[styles.backBtn, neu.circleButton(38, { depth: 'low' })]}
          onPress={() => navigation.navigate('Settings', { screen: 'Notifications' })}
          activeOpacity={0.7}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View
        style={[
          styles.tabBar,
          neu.fieldSunken({ radius: 24 }),
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'RECEIVED' && [
              styles.tabItemActive,
              neu.cardElevated({ radius: 20, depth: 'low' }),
            ],
          ]}
          onPress={() => setActiveTab('RECEIVED')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'RECEIVED'
                ? [styles.tabTextActive, { color: colors.text }]
                : { color: colors.textSecondary },
            ]}
          >
            Received ({receivedList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'SENT' && [
              styles.tabItemActive,
              neu.cardElevated({ radius: 20, depth: 'low' }),
            ],
          ]}
          onPress={() => setActiveTab('SENT')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'SENT'
                ? [styles.tabTextActive, { color: colors.text }]
                : { color: colors.textSecondary },
            ]}
          >
            Sent ({sentList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'RECEIVED' ? (
        receivedLoading && receivedList.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={receivedList}
            keyExtractor={item => item.id.toString()}
            renderItem={renderReceivedItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={receivedRefreshing}
                onRefresh={() => fetchReceived(0, true)}
                colors={[colors.primary]}
              />
            }
            onEndReached={() => {
              if (!receivedLast && !receivedLoading) {
                fetchReceived(receivedPage + 1);
              }
            }}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconWell, neu.sunkenWell(76)]}>
                  <Ionicons
                    name="notifications-off-outline"
                    size={40}
                    color={colors.textMuted}
                  />
                </View>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No connection requests received
                </Text>
              </View>
            }
          />
        )
      ) : sentLoading && sentList.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={sentList}
          keyExtractor={item => item.id.toString()}
          renderItem={renderSentItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={sentRefreshing}
              onRefresh={() => fetchSent(0, true)}
              colors={[colors.primary]}
            />
          }
          onEndReached={() => {
            if (!sentLast && !sentLoading) {
              fetchSent(sentPage + 1);
            }
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconWell, neu.sunkenWell(76)]}>
                <Ionicons
                  name="paper-plane-outline"
                  size={40}
                  color={colors.textMuted}
                />
              </View>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No sent connection requests
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  placeholder: {
    width: 38,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 24,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20,
  },
  tabItemActive: {
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110,
    gap: 10,
  },
  requestCard: {
    borderRadius: 20,
    padding: 14,
    marginVertical: 4,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  username: {
    fontSize: 13,
    marginBottom: 2,
  },
  timeText: {
    fontSize: 11,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rejectBtn: {
    paddingVertical: 7,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  acceptBtn: {
    paddingVertical: 7,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  statusBadge: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
    gap: 8,
  },
  emptyIconWell: {
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
  },
});

