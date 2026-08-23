import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { userService, SearchUserItem } from '../api';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme, getNeumorphicStyles } from '../theme';
import FocusAwareStatusBar from './FocusAwareStatusBar';

const defaultUser = require('../assets/icons/user.png');

const PAGE_SIZE = 10;

const SearchScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const neu = getNeumorphicStyles(isDark);
  const [text, setText] = useState('');
  const [users, setUsers] = useState<SearchUserItem[]>([]);
  const [history, setHistory] = useState<SearchUserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [isLastPage, setIsLastPage] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(false);
        StatusBar.setBackgroundColor(colors.statusBg, true);
      }
    }, [colors.statusBg]),
  );

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await AsyncStorage.getItem('search_history');
      if (data) {
        setHistory(JSON.parse(data));
      }
    } catch (e) {
      console.log('Error loading search history:', e);
    }
  };

  const saveToHistory = async (user: SearchUserItem) => {
    try {
      let updatedHistory = [user, ...history];
      updatedHistory = updatedHistory.filter(
        (item, index, self) => index === self.findIndex(u => u.id === item.id),
      );
      if (updatedHistory.length > 10) {
        updatedHistory = updatedHistory.slice(0, 10);
      }
      setHistory(updatedHistory);
      await AsyncStorage.setItem(
        'search_history',
        JSON.stringify(updatedHistory),
      );
    } catch (e) {
      console.log('Error saving search history:', e);
    }
  };

  const removeFromHistory = async (id: number) => {
    try {
      const updated = history.filter(item => item.id !== id);
      setHistory(updated);
      await AsyncStorage.setItem('search_history', JSON.stringify(updated));
    } catch (e) {
      console.log('Error removing from search history:', e);
    }
  };

  const performSearch = async (
    keyword: string,
    pageNum: number,
    isNewSearch: boolean = false,
  ) => {
    const trimmed = keyword.trim();
    if (trimmed.length < 2) {
      if (isNewSearch) {
        setUsers([]);
        setHasSearched(false);
        setLoading(false);
        setLoadingMore(false);
      }
      return;
    }

    try {
      if (isNewSearch) {
        setLoading(true);
        setHasSearched(true);
      } else {
        setLoadingMore(true);
      }

      const response = await userService.searchUsers(
        trimmed,
        pageNum,
        PAGE_SIZE,
      );
      const pageData = response?.data;

      if (pageData && pageData.content) {
        const newResults = pageData.content;
        setUsers(prev => (isNewSearch ? newResults : [...prev, ...newResults]));
        setIsLastPage(pageData.last);
        setPage(pageNum);
      } else {
        if (isNewSearch) {
          setUsers([]);
        }
        setIsLastPage(true);
      }
    } catch (err) {
      console.log('Search error:', err);
      if (isNewSearch) {
        setUsers([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleTextChange = (val: string) => {
    setText(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = val.trim();
    if (trimmed.length < 2) {
      setUsers([]);
      setHasSearched(false);
      setLoading(false);
      setLoadingMore(false);
      setPage(0);
      setIsLastPage(true);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(trimmed, 0, true);
    }, 350);
  };

  const handleManualSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (text.trim().length >= 2) {
      performSearch(text, 0, true);
    }
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && !isLastPage && text.trim()) {
      performSearch(text, page + 1, false);
    }
  };

  const handleUserClick = (user: SearchUserItem) => {
    saveToHistory(user);
    navigation.navigate('UserProfile', {
      userId: user.id,
      user,
    });
  };

  const renderItem = ({
    item,
  }: {
    item: SearchUserItem;
  }) => {
    const isHistoryItem = text.trim().length === 0;

    return (
      <TouchableOpacity
        style={[
          styles.userCard,
          neu.cardElevated({ radius: 18, depth: 'low' }),
        ]}
        onPress={() => handleUserClick(item)}
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

        {isHistoryItem ? (
          <TouchableOpacity
            onPress={() => removeFromHistory(item.id)}
            style={styles.removeHistoryBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="close"
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        ) : (
          <View
            style={[
              styles.viewProfileBtn,
              neu.circleButton(32, { depth: 'low' }),
            ]}
          >
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.primary}
            />
          </View>
        )}
      </TouchableOpacity>
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
      {/* Top Search Bar */}
      <View style={styles.topBar}>
        <View
          style={[
            styles.searchBox,
            neu.fieldSunken({ radius: 22 }),
          ]}
        >
          <Ionicons
            name="search-outline"
            size={19}
            color={colors.placeholderText}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search users by name or username..."
            placeholderTextColor={colors.placeholderText}
            value={text}
            onChangeText={handleTextChange}
            onSubmitEditing={handleManualSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, { color: colors.text }]}
          />
          {text.length > 0 && (
            <TouchableOpacity
              onPress={() => handleTextChange('')}
              style={styles.clearBtn}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.placeholderText}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text
            style={[styles.loadingText, { color: colors.textSecondary }]}
          >
            Searching...
          </Text>
        </View>
      )}

      {text.trim().length === 0 && history.length > 0 && (
        <View style={styles.historyHeader}>
          <View style={styles.historyTitleRow}>
            <Ionicons
              name="time-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.historyTitle, { color: colors.textSecondary }]}
            >
              Recent Searches
            </Text>
          </View>
        </View>
      )}

      <FlatList
        data={text.trim().length > 0 ? users : history}
        keyExtractor={(item: SearchUserItem) => item.id.toString()}
        renderItem={renderItem}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading &&
          hasSearched &&
          text.trim().length >= 2 &&
          users.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="search-outline"
                size={48}
                color={colors.textMuted}
              />
              <Text
                style={[styles.emptyTitle, { color: colors.text }]}
              >
                No results found
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                No users found for "{text}"
              </Text>
            </View>
          ) : text.trim().length === 0 && history.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="people-outline"
                size={48}
                color={colors.textMuted}
              />
              <Text
                style={[styles.emptyTitle, { color: colors.text }]}
              >
                Search Pegion
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Find friends by typing their name or username above
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
    gap: 10,
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
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 22,
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
  historyHeader: {
    paddingVertical: 8,
    marginBottom: 6,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: 110,
    gap: 10,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
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
    justifyContent: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  userHandle: {
    fontSize: 13,
  },
  removeHistoryBtn: {
    padding: 6,
  },
  viewProfileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLoader: {
    paddingVertical: 16,
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
  },
});
