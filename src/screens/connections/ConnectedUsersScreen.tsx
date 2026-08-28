import React, { useState, useCallback, useContext, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { AuthContext } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { connectionService, userService, SearchUserItem } from '../../api';
import { useTheme, getNeumorphicStyles } from '../../theme';
import FocusAwareStatusBar from '../../components/FocusAwareStatusBar';

const defaultUser = require('../../assets/icons/user.png');

const PAGE_SIZE = 15;

const ConnectedUsersScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors, isDark } = useTheme();
  const neu = getNeumorphicStyles(isDark);
  const { user } = useContext(AuthContext);

  const initialDiscover = route?.params?.isDiscover || route?.params?.isGlobalSearch || false;
  const isCallMode = route?.params?.mode === 'calls' || route?.params?.isCallMode || false;

  // Connected users state
  const [connectedUsers, setConnectedUsers] = useState<SearchUserItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [isLast, setIsLast] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resolvedUserId, setResolvedUserId] = useState<number | null>(
    (user as any)?.id || null,
  );

  // Global search state
  const [isGlobalSearch, setIsGlobalSearch] = useState(initialDiscover);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalUsers, setGlobalUsers] = useState<SearchUserItem[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalHasSearched, setGlobalHasSearched] = useState(false);
  const [globalPage, setGlobalPage] = useState(0);
  const [globalIsLast, setGlobalIsLast] = useState(true);

  const debounceTimerRef = useRef<any>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (route?.params?.isDiscover || route?.params?.isGlobalSearch) {
      setIsGlobalSearch(true);
    }
  }, [route?.params]);

  const fetchConnections = useCallback(
    async (pageToFetch: number = 0, isRefresh: boolean = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else if (pageToFetch === 0) {
          setLoading(true);
        }

        // Resolve current user ID if not present
        let currentUserId = resolvedUserId;
        if (!currentUserId) {
          const email =
            user?.email || (await AsyncStorage.getItem('auth_email'));
          if (email) {
            const profileRes = await userService.getProfileInfo(email);
            if (profileRes?.data?.id) {
              currentUserId = profileRes.data.id;
              setResolvedUserId(currentUserId);
            }
          }
        }

        if (!currentUserId) {
          setLoading(false);
          setRefreshing(false);
          return;
        }

        const res = await connectionService.getConnectedUsers(
          currentUserId,
          pageToFetch,
          PAGE_SIZE,
        );

        const data = res?.data;
        if (data?.content) {
          setConnectedUsers(prev =>
            pageToFetch === 0 ? data.content : [...prev, ...data.content],
          );
          setTotalCount(data.totalElements || data.content.length);
          setIsLast(data.last);
          setPage(pageToFetch);
        } else {
          if (pageToFetch === 0) {
            setConnectedUsers([]);
            setTotalCount(0);
          }
          setIsLast(true);
        }
      } catch (err) {
        console.log('Error fetching connected users:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [resolvedUserId, user?.email],
  );

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(false);
        StatusBar.setBackgroundColor(colors.statusBg, true);
      }
      fetchConnections(0);
    }, [fetchConnections, colors.statusBg]),
  );

  // Global search across ALL app users with minimum 2 characters requirement
  const performGlobalSearch = async (
    keyword: string,
    pageNum: number = 0,
    isNewSearch: boolean = false,
  ) => {
    const trimmed = keyword.trim();
    if (trimmed.length < 2) {
      if (isNewSearch) {
        setGlobalUsers([]);
        setGlobalHasSearched(false);
        setGlobalLoading(false);
      }
      return;
    }

    try {
      if (isNewSearch) {
        setGlobalLoading(true);
        setGlobalHasSearched(true);
      }

      const res = await userService.searchUsers(trimmed, pageNum, PAGE_SIZE);
      const pageData = res?.data;

      if (pageData && pageData.content) {
        const newResults = pageData.content;
        setGlobalUsers(prev =>
          isNewSearch ? newResults : [...prev, ...newResults],
        );
        setGlobalIsLast(pageData.last);
        setGlobalPage(pageNum);
      } else {
        if (isNewSearch) {
          setGlobalUsers([]);
        }
        setGlobalIsLast(true);
      }
    } catch (err) {
      console.log('Global search error:', err);
      if (isNewSearch) {
        setGlobalUsers([]);
      }
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleGlobalTextChange = (val: string) => {
    setGlobalSearchQuery(val);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = val.trim();
    if (trimmed.length < 2) {
      setGlobalUsers([]);
      setGlobalHasSearched(false);
      setGlobalLoading(false);
      return;
    }

    // Debounce for 350ms after typing
    debounceTimerRef.current = setTimeout(() => {
      performGlobalSearch(trimmed, 0, true);
    }, 350);
  };

  const toggleGlobalSearch = () => {
    if (isGlobalSearch) {
      setIsGlobalSearch(false);
      setGlobalSearchQuery('');
      setGlobalUsers([]);
      setGlobalHasSearched(false);
    } else {
      setIsGlobalSearch(true);
      setSearchQuery('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  };

  const handleStartChat = (item: SearchUserItem) => {
    navigation.navigate('ChatScreen', {
      recipient: item,
      otherUserId: item.id,
      otherUserName: item.name || item.username,
      otherUserProfileImage: item.profileImageUrl,
    });
  };

  const { initiateCall } = useCall();

  const handleStartCall = (item: SearchUserItem, type: 'voice' | 'video') => {
    console.log(`📞 [ConnectedUsers] User tapped ${type} call for user:`, item);
    if (!item.id) {
      console.warn('⚠️ [ConnectedUsers] Cannot start call: item.id is missing');
      return;
    }
    initiateCall({
      receiverId: item.id,
      receiverName: item.name || item.username,
      receiverAvatar: item.profileImageUrl,
      callType: type === 'video' ? 'VIDEO' : 'AUDIO',
    });
  };

  const handleOpenProfile = (item: SearchUserItem) => {
    navigation.navigate('UserProfile', {
      userId: item.id,
      user: item,
    });
  };

  const filteredUsers = connectedUsers.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      return true;
    }
    return (
      u.name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q)
    );
  });

  const isUserConnected = (item: SearchUserItem) => {
    return connectedUsers.some(
      cu =>
        cu.id === item.id ||
        (Boolean((cu as any).email) &&
          Boolean((item as any).email) &&
          (cu as any).email.toLowerCase() === (item as any).email.toLowerCase()),
    );
  };

  const renderConnectedItem = ({ item }: { item: SearchUserItem }) => (
    <View
      style={[
        styles.userCard,
        neu.cardElevated({ radius: 18, depth: 'low' }),
      ]}
    >
      <TouchableOpacity
        style={styles.userMainRow}
        onPress={() => handleOpenProfile(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatarWell, neu.sunkenWell(50)]}>
          <Image
            source={
              item.profileImageUrl ? { uri: item.profileImageUrl } : defaultUser
            }
            style={styles.avatar}
          />
        </View>
        <View style={styles.userInfo}>
          <Text
            style={[styles.userName, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.name || item.username || 'User'}
          </Text>
          <Text style={[styles.userHandle, { color: colors.textSecondary }]} numberOfLines={1}>
            @{item.username || 'username'}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.actionsRow}>
        {/* 1. Message */}
        <TouchableOpacity
          style={[
            styles.actionCircleBtn,
            neu.circleButton(36, { depth: 'low' }),
            { backgroundColor: colors.surfaceSubtle, marginRight: 6 },
          ]}
          onPress={() => handleStartChat(item)}
          activeOpacity={0.75}
        >
          <Ionicons name="chatbubble-ellipses" size={16} color={colors.primary} />
        </TouchableOpacity>

        {/* 2. Voice Call */}
        <TouchableOpacity
          style={[
            styles.actionCircleBtn,
            neu.circleButton(36, { depth: 'low' }),
            { backgroundColor: colors.surfaceSubtle, marginRight: 6 },
          ]}
          onPress={() => handleStartCall(item, 'voice')}
          activeOpacity={0.75}
        >
          <Ionicons name="call" size={16} color={colors.primary} />
        </TouchableOpacity>

        {/* 3. Video Call */}
        <TouchableOpacity
          style={[
            styles.actionCircleBtn,
            neu.circleButton(36, { depth: 'low' }),
            { backgroundColor: colors.surfaceSubtle },
          ]}
          onPress={() => handleStartCall(item, 'video')}
          activeOpacity={0.75}
        >
          <Ionicons name="videocam" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGlobalItem = ({ item }: { item: SearchUserItem }) => {
    const connected = isUserConnected(item);

    return (
      <View
        style={[
          styles.userCard,
          neu.cardElevated({ radius: 18, depth: 'low' }),
        ]}
      >
        <TouchableOpacity
          style={styles.userMainRow}
          onPress={() => handleOpenProfile(item)}
          activeOpacity={0.7}
        >
          <View style={[styles.avatarWell, neu.sunkenWell(50)]}>
            <Image
              source={
                item.profileImageUrl ? { uri: item.profileImageUrl } : defaultUser
              }
              style={styles.avatar}
            />
          </View>
          <View style={styles.userInfo}>
            <Text
              style={[styles.userName, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.name || item.username || 'User'}
            </Text>
            <Text style={[styles.userHandle, { color: colors.textSecondary }]} numberOfLines={1}>
              @{item.username || 'username'}
            </Text>
          </View>
        </TouchableOpacity>

        {connected ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.actionCircleBtn,
                neu.circleButton(36, { depth: 'low' }),
                { backgroundColor: colors.surfaceSubtle, marginRight: 6 },
              ]}
              onPress={() => handleStartChat(item)}
              activeOpacity={0.75}
            >
              <Ionicons name="chatbubble-ellipses" size={16} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionCircleBtn,
                neu.circleButton(36, { depth: 'low' }),
                { backgroundColor: colors.surfaceSubtle, marginRight: 6 },
              ]}
              onPress={() => handleStartCall(item, 'voice')}
              activeOpacity={0.75}
            >
              <Ionicons name="call" size={16} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionCircleBtn,
                neu.circleButton(36, { depth: 'low' }),
                { backgroundColor: colors.surfaceSubtle },
              ]}
              onPress={() => handleStartCall(item, 'video')}
              activeOpacity={0.75}
            >
              <Ionicons name="videocam" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.chatBtn,
              neu.circleButton(38, { depth: 'high' }),
              { width: 'auto', paddingHorizontal: 14, borderRadius: 19, backgroundColor: isDark ? '#262c36' : '#ffffff' },
            ]}
            onPress={() => handleOpenProfile(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="person-outline" size={15} color={colors.primary} />
            <Text style={[styles.chatBtnText, { color: colors.primary }]}>View</Text>
          </TouchableOpacity>
        )}
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
          style={[
            styles.backBtn,
            neu.circleButton(40, { depth: 'low' }),
          ]}
          onPress={() => {
            if (isGlobalSearch) {
              toggleGlobalSearch();
            } else if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Chats');
            }
          }}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text
            style={[styles.headerTitle, { color: colors.text }]}
          >
            {isGlobalSearch ? 'Discover People' : 'Connected Users'}
          </Text>
          {!isGlobalSearch && (
            <View style={[styles.countBadge, neu.badgeEmbossed(colors.primary)]}>
              <Text style={styles.countBadgeText}>{totalCount}</Text>
            </View>
          )}
        </View>

        {/* Right Spacer for balanced title centering */}
        <View style={styles.headerRightSpacer} />
      </View>

      {/* Dynamic Search Bar */}
      <View
        style={[
          styles.searchBar,
          neu.fieldSunken({ radius: 22 }),
          isGlobalSearch && {
            borderColor: colors.primary,
            borderWidth: 1.2,
          },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={19}
          color={isGlobalSearch ? colors.primary : colors.placeholderText}
          style={styles.searchIcon}
        />
        <TextInput
          ref={inputRef}
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={
            isGlobalSearch
              ? 'Search new people on Pegion...'
              : 'Search connected users...'
          }
          placeholderTextColor={colors.placeholderText}
          value={isGlobalSearch ? globalSearchQuery : searchQuery}
          onChangeText={
            isGlobalSearch ? handleGlobalTextChange : setSearchQuery
          }
          autoCapitalize="none"
          autoCorrect={false}
        />
        {(isGlobalSearch
          ? globalSearchQuery.length > 0
          : searchQuery.length > 0) && (
          <TouchableOpacity
            onPress={() => {
              if (isGlobalSearch) {
                setGlobalSearchQuery('');
                setGlobalUsers([]);
                setGlobalHasSearched(false);
              } else {
                setSearchQuery('');
              }
            }}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.placeholderText}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Content Area */}
      {isGlobalSearch ? (
        // GLOBAL DISCOVERY SEARCH LIST
        globalLoading && globalUsers.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={globalUsers}
            keyExtractor={item => item.id.toString()}
            renderItem={renderGlobalItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onEndReached={() => {
              if (!globalIsLast && !globalLoading && globalSearchQuery.trim()) {
                performGlobalSearch(globalSearchQuery, globalPage + 1, false);
              }
            }}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={
              globalHasSearched && globalSearchQuery.trim().length >= 2 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="search-outline"
                    size={54}
                    color={colors.textMuted}
                  />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    No users found
                  </Text>
                  <Text
                    style={[
                      styles.emptySubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    No Pegion users matched "{globalSearchQuery}".
                  </Text>
                </View>
              ) : null
            }
          />
        )
      ) : (
        // CONNECTED USERS FILTER LIST
        loading && connectedUsers.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={item => item.id.toString()}
            renderItem={renderConnectedItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchConnections(0, true)}
                colors={[colors.primary]}
              />
            }
            onEndReached={() => {
              if (!isLast && !loading) {
                fetchConnections(page + 1);
              }
            }}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="people-outline"
                  size={54}
                  color={colors.textMuted}
                />
                <Text
                  style={[styles.emptyTitle, { color: colors.text }]}
                >
                  No connections found
                </Text>
                <Text
                  style={[
                    styles.emptySubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  {searchQuery
                    ? 'No contacts matched your filter.'
                    : 'You have not connected with anyone yet.'}
                </Text>
                <TouchableOpacity
                  style={[styles.findPeopleBtn, { backgroundColor: colors.primary }]}
                  onPress={toggleGlobalSearch}
                >
                  <Ionicons name="search" size={16} color="#fff" />
                  <Text style={styles.findPeopleBtnText}>Find & Connect</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )
      )}
    </View>
  );
};

export default ConnectedUsersScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  headerRightSpacer: {
    width: 44,
    height: 44,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  listContent: {
    paddingBottom: 100,
    gap: 10,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  userMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatarWell: {
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  userHandle: {
    fontSize: 13,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  chatBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  findPeopleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 20,
  },
  findPeopleBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callBtnCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

