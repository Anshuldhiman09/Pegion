import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme, getNeumorphicStyles } from '../../theme';
import FocusAwareStatusBar from '../../components/FocusAwareStatusBar';

const defaultUser = require('../../assets/icons/user.png');
const appLogo = require('../../assets/images/pegion.png');

interface CallRecord {
  id: string;
  name: string;
  avatarUrl?: string;
  type: 'voice' | 'video';
  time: string;
  direction: 'incoming' | 'outgoing' | 'missed';
}

const dummyCalls: CallRecord[] = [
  {
    id: '1',
    name: 'Rahul Sharma',
    type: 'voice',
    time: 'Today, 10:30 AM',
    direction: 'incoming',
  },
  {
    id: '2',
    name: 'Ankit Verma',
    type: 'video',
    time: 'Yesterday, 8:15 PM',
    direction: 'outgoing',
  },
  {
    id: '3',
    name: 'Priya Singh',
    type: 'voice',
    time: 'Aug 20, 4:45 PM',
    direction: 'missed',
  },
];

const CallsHome = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const neu = getNeumorphicStyles(isDark);

  const [calls, setCalls] = useState<CallRecord[]>(dummyCalls);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(false);
        StatusBar.setBackgroundColor(colors.statusBg, true);
      }
    }, [colors.statusBg]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  const filteredCalls = calls.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return c.name.toLowerCase().includes(q);
  });

  const renderItem = ({ item }: { item: CallRecord }) => {
    const isMissed = item.direction === 'missed';

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
          <Image
            source={item.avatarUrl ? { uri: item.avatarUrl } : defaultUser}
            style={styles.avatar}
          />
        </View>

        <View style={styles.callInfo}>
          <Text
            style={[
              styles.callName,
              { color: isMissed ? colors.danger : colors.text },
            ]}
            numberOfLines={1}
          >
            {item.name}
          </Text>

          <View style={styles.metaRow}>
            {item.direction === 'missed' ? (
              <Feather
                name="phone-missed"
                size={13}
                color={colors.danger}
                style={styles.directionIcon}
              />
            ) : item.direction === 'incoming' ? (
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
              {item.time}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.callActionBtn,
            neu.circleButton(42, { depth: 'low' }),
            { backgroundColor: colors.surfaceSubtle },
          ]}
          activeOpacity={0.7}
        >
          <Ionicons
            name={item.type === 'voice' ? 'call' : 'videocam'}
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
        <FlatList
          data={filteredCalls}
          keyExtractor={item => item.id}
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
});

