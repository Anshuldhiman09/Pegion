import React, { useState, useEffect, useCallback, useContext } from 'react';
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
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../context/AuthContext';
import {
  getConversations,
  ConversationResponseItem,
} from '../../services/ChatApiService';
import SocketService from '../../services/SocketService';

import { useTheme, getNeumorphicStyles } from '../../theme';
import FocusAwareStatusBar from '../../components/FocusAwareStatusBar';

const defaultUser = require('../../assets/icons/user.png');
const appLogo = require('../../assets/images/pegion.png');

const HomeChat = () => {
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const { colors, isDark } = useTheme();
  const neu = getNeumorphicStyles(isDark);

  const [conversations, setConversations] = useState<ConversationResponseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load cached conversations on startup
  useEffect(() => {
    const loadCached = async () => {
      try {
        const stored = await AsyncStorage.getItem('@conversations_cache');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setConversations(parsed);
            setLoading(false);
          }
        }
      } catch (e) {
        console.log('Error reading cached conversations:', e);
      }
    };
    loadCached();
  }, []);

  const fetchConversationList = useCallback(async () => {
    try {
      const data = await getConversations();
      if (data) {
        setConversations(data);
        AsyncStorage.setItem('@conversations_cache', JSON.stringify(data)).catch(() => {});
      }
    } catch (e) {
      console.log('Error loading conversations:', e);
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
      fetchConversationList();
      SocketService.connect().catch(err => {
        console.log('[HomeChat] Socket connect notice:', err?.message || err);
      });
    }, [fetchConversationList, colors.statusBg]),
  );

  // Listen for read receipts in real-time on home chat list
  useEffect(() => {
    const handleRead = (data: any) => {
      let readerId = data;
      if (typeof data === 'object' && data !== null) {
        readerId = data.readerId ?? data.userId ?? data.id;
      }
      if (readerId !== undefined && readerId !== null) {
        setConversations(prev =>
          prev.map(c => {
            if (String(c.otherUserId) === String(readerId)) {
              return { ...c, lastMessageIsRead: true };
            }
            return c;
          }),
        );
      }
    };

    SocketService.on('messages.read', handleRead);
    SocketService.on('chat.read', handleRead);
    return () => {
      SocketService.off('messages.read', handleRead);
      SocketService.off('chat.read', handleRead);
    };
  }, []);

  const handleOpenChat = (item: ConversationResponseItem) => {
    navigation.navigate('ChatScreen', {
      recipient: {
        id: item.otherUserId,
        name: item.otherUserName,
        profileImageUrl: item.otherUserProfileImage,
      },
      otherUserId: item.otherUserId,
      otherUserName: item.otherUserName,
    });
  };

  const handleOpenNewChat = () => {
    navigation.navigate('ConnectedUsers');
  };

  const formatMessageTime = (timeStr?: string) => {
    if (!timeStr) {
      return '';
    }
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) {
      return timeStr;
    }

    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) {
      return d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return 'Yesterday';
    }

    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filteredList = conversations.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      return true;
    }
    return (
      c.otherUserName?.toLowerCase().includes(q) ||
      c.lastMessage?.toLowerCase().includes(q)
    );
  });

const getMessagePreview = (text?: string) => {
  if (!text) return { isMedia: false, type: 'text', label: 'No messages yet' };

  const trimmed = text.trim();
  const isUrl =
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('file://') ||
    trimmed.startsWith('content://');

  if (isUrl) {
    if (
      trimmed.match(/\.(mp4|mkv|mov|avi)($|\?)/i) ||
      trimmed.includes('/video/upload/')
    ) {
      return { isMedia: true, type: 'video', icon: 'videocam', label: 'Video' };
    }
    if (
      trimmed.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ||
      trimmed.includes('cloudinary.com') ||
      trimmed.includes('/pegion_chat/') ||
      trimmed.includes('/image/upload/')
    ) {
      return { isMedia: true, type: 'photo', icon: 'camera', label: 'Photo' };
    }
  }

  return { isMedia: false, type: 'text', label: text };
};

  const renderItem = ({ item }: { item: ConversationResponseItem }) => {
    const hasUnread = item.unreadCount > 0;
    const preview = getMessagePreview(item.lastMessage);

    return (
      <TouchableOpacity
        style={[
          styles.chatRow,
          neu.cardElevated({ radius: 20, depth: 'low' }),
        ]}
        onPress={() => handleOpenChat(item)}
        activeOpacity={0.75}
      >
        <View
          style={[
            styles.avatarWrapper,
            neu.sunkenWell(50),
            {
              borderColor: hasUnread ? colors.primary : (isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.08)'),
            },
          ]}
        >
          <Image
            source={
              item.otherUserProfileImage
                ? { uri: item.otherUserProfileImage }
                : defaultUser
            }
            style={styles.avatar}
          />
        </View>

        <View style={styles.chatInfo}>
          <Text
            style={[
              styles.chatName,
              { color: colors.text, fontWeight: hasUnread ? '800' : '700' },
            ]}
            numberOfLines={1}
          >
            {item.otherUserName}
          </Text>

          <View style={styles.lastMessageRow}>
            {item.lastMessageIsMine && (
              <Ionicons
                name={item.lastMessageIsRead ? 'checkmark-done' : 'checkmark'}
                size={16}
                color={item.lastMessageIsRead ? '#38bdf8' : colors.textMuted}
                style={styles.checkIcon}
              />
            )}
            {preview.isMedia ? (
              <View style={styles.mediaPreviewRow}>
                <Ionicons
                  name={preview.icon as any}
                  size={15}
                  color={hasUnread ? colors.primary : colors.textSecondary}
                  style={styles.mediaPreviewIcon}
                />
                <Text
                  style={[
                    styles.lastMessage,
                    {
                      color: hasUnread ? colors.text : colors.textSecondary,
                      fontWeight: hasUnread ? '700' : '500',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {preview.label}
                </Text>
              </View>
            ) : (
              <Text
                style={[
                  styles.lastMessage,
                  {
                    color: hasUnread ? colors.text : colors.textSecondary,
                    fontWeight: hasUnread ? '700' : '400',
                  },
                ]}
                numberOfLines={1}
              >
                {preview.label}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.chatMeta}>
          <Text
            style={[
              styles.timeText,
              { color: hasUnread ? colors.primary : colors.textMuted },
            ]}
          >
            {formatMessageTime(item.lastMessageTime)}
          </Text>

          {hasUnread ? (
            <View
              style={[
                styles.unreadBadge,
                neu.badgeEmbossed(colors.primary),
              ]}
            >
              <Text style={styles.unreadCountText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          ) : (
            <View style={styles.badgeSpacer} />
          )}
        </View>
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
        {/* Top Header */}
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

          <Text style={[styles.headerTitle, { color: colors.text }]}>Chats</Text>

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
              placeholder="Search conversations..."
              placeholderTextColor={colors.placeholderText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={colors.placeholderText} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Conversation List */}
        {loading && conversations.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredList}
            keyExtractor={item => item.otherUserId.toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchConversationList();
                }}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconWell, neu.sunkenWell(76)]}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={42}
                    color={colors.textMuted}
                  />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {searchQuery ? 'No matching conversations' : 'No conversations yet'}
                </Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {searchQuery
                    ? 'Try searching for another name.'
                    : 'Connect with contacts and start chatting!'}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity
                    style={[
                      styles.startChatBtn,
                      neu.circleButton(48, { depth: 'high' }),
                      { backgroundColor: colors.primary, width: 'auto', paddingHorizontal: 24, borderRadius: 24 },
                    ]}
                    onPress={handleOpenNewChat}
                  >
                    <Feather name="message-square" size={16} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.startChatBtnText}>Start a Chat</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default HomeChat;

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
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  listContent: {
    paddingBottom: 110,
    paddingTop: 4,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginVertical: 5,
  },
  avatarWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatName: {
    fontSize: 16,
    marginBottom: 4,
  },
  lastMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mediaPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mediaPreviewIcon: {
    marginRight: 4,
  },
  checkIcon: {
    marginRight: 4,
  },
  lastMessage: {
    fontSize: 13,
    flex: 1,
  },
  chatMeta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  unreadBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    minWidth: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadCountText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  badgeSpacer: {
    height: 18,
  },
  emptyIconWell: {
    marginBottom: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 10,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  startChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 14,
  },
  startChatBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});


