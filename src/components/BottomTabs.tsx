import React, { useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
  Animated,
  Keyboard,
  PanResponder,
  BackHandler,
} from 'react-native';
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  useNavigation,
  getFocusedRouteNameFromRoute,
} from '@react-navigation/native';

import CallsHome from '../screens/calls/CallsHome';
import ProfileNavigator from '../navigation/ProfileNavigator';
import SearchPage from './SearchPage';
import ConnectedUsersScreen from '../screens/connections/ConnectedUsersScreen';
import { AuthContext } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChatNavigator from '../navigation/ChatNavigator';
import { useTheme } from '../theme';
import { getUnreadCount } from '../services/ChatApiService';

const Tab = createBottomTabNavigator();

const BAR_HEIGHT = 62;
const CIRCLE_SIZE = 50;
const NOTCH_WIDTH = 68;
const NOTCH_DEPTH = 24;

const TAB_ORDER = ['Chats', 'Calls', 'Connect', 'Search', 'Profile'];

const SUB_SCREENS = [
  'ChatScreen',
  'UserProfile',
  'Notifications',
  'EditProfile',
];

const tabNavigatorRef: { current: any } = { current: null };
const activeTabIndexRef: { current: number } = { current: 0 };
export const tabHistoryRef: { current: string[] } = { current: ['Chats'] };

const CurvedAnimatedTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  tabNavigatorRef.current = navigation;
  activeTabIndexRef.current = state.index;
  const { user } = useContext(AuthContext);
  const { colors, isDark } = useTheme();
  const currentRoute = state.routes[state.index];
  const descriptor = descriptors[currentRoute.key];

  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);
  const [imgError, setImgError] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [barWidth, setBarWidth] = useState<number>(0);

  const userPhotoUri = !imgError && (user?.profileImageUrl || (user as any)?.photo);

  const tabs = [
    {
      name: 'Chats',
      iconOutline: 'chatbubbles-outline',
      iconFilled: 'chatbubbles',
      showDot: unreadChatCount > 0,
      badgeCount: unreadChatCount,
    },
    {
      name: 'Calls',
      iconOutline: 'call-outline',
      iconFilled: 'call',
      showDot: false,
      badgeCount: 0,
    },
    {
      name: 'Connect',
      iconOutline: 'people-outline',
      iconFilled: 'people',
      showDot: false,
      badgeCount: 0,
    },
    {
      name: 'Search',
      iconOutline: 'search-outline',
      iconFilled: 'search',
      showDot: false,
      badgeCount: 0,
    },
    {
      name: 'Profile',
      iconOutline: 'person-outline',
      iconFilled: 'person',
      showDot: false,
      badgeCount: 0,
    },
  ];

  const numTabs = tabs.length;

  // Animation values for traveling curved notch & active elevated circle
  const notchTranslateX = useRef(new Animated.Value(0)).current;
  const circleScaleX = useRef(new Animated.Value(1)).current;
  const circleScaleY = useRef(new Animated.Value(1)).current;
  const circleElevationY = useRef(new Animated.Value(0)).current;
  const tabScales = useRef(tabs.map(() => new Animated.Value(1))).current;

  // Keyboard listener
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const fetchUnread = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadChatCount(count);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 8000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  // Update activeTabIndexRef and history on tab change
  useEffect(() => {
    const currentTabName = state.routes[state.index]?.name;
    if (currentTabName) {
      activeTabIndexRef.current = state.index;
      const history = tabHistoryRef.current;
      if (history[history.length - 1] !== currentTabName) {
        history.push(currentTabName);
      }
    }
  }, [state.index, state.routes]);

  // Curved Notch traveling spring animation
  useEffect(() => {
    if (barWidth > 0) {
      const tabWidth = barWidth / numTabs;
      const targetX = state.index * tabWidth + (tabWidth - NOTCH_WIDTH) / 2;

      Animated.parallel([
        // Horizontal sliding spring
        Animated.spring(notchTranslateX, {
          toValue: targetX,
          friction: 6.5,
          tension: 70,
          useNativeDriver: true,
        }),
        // Morphing & stretch/squash during transit (matches video physics)
        Animated.sequence([
          Animated.timing(circleScaleX, {
            toValue: 1.22,
            duration: 90,
            useNativeDriver: true,
          }),
          Animated.spring(circleScaleX, {
            toValue: 1,
            friction: 4,
            tension: 80,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(circleScaleY, {
            toValue: 0.84,
            duration: 90,
            useNativeDriver: true,
          }),
          Animated.spring(circleScaleY, {
            toValue: 1,
            friction: 4,
            tension: 80,
            useNativeDriver: true,
          }),
        ]),
        // Floating bounce animation
        Animated.sequence([
          Animated.timing(circleElevationY, {
            toValue: 5,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.spring(circleElevationY, {
            toValue: 0,
            friction: 3.5,
            tension: 85,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Icon pop animation on the active tab
      if (tabScales[state.index]) {
        Animated.sequence([
          Animated.timing(tabScales[state.index], {
            toValue: 0.78,
            duration: 70,
            useNativeDriver: true,
          }),
          Animated.spring(tabScales[state.index], {
            toValue: 1,
            friction: 3.5,
            tension: 90,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  }, [state.index, barWidth, numTabs, notchTranslateX, circleScaleX, circleScaleY, circleElevationY, tabScales]);

  // Check visibility conditions
  const focusedChildRoute = getFocusedRouteNameFromRoute(currentRoute) ?? '';
  const shouldHide =
    isKeyboardVisible ||
    SUB_SCREENS.includes(focusedChildRoute) ||
    (descriptor?.options?.tabBarStyle &&
      (descriptor.options.tabBarStyle as any).display === 'none');

  if (shouldHide) {
    return null;
  }

  const activeTab = tabs[state.index];
  const activeIconName = activeTab ? activeTab.iconFilled : 'chatbubbles';
  const isActiveProfile = activeTab?.name === 'Profile';

  return (
    <View style={styles.floatingContainer}>
      {/* Main Curved Bar Container */}
      <View
        style={[
          styles.curvedBarWrapper,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: isDark ? 'rgba(203, 221, 225, 0.12)' : 'rgba(31, 65, 75, 0.08)',
            shadowColor: isDark ? '#000000' : '#1F414B',
          },
        ]}
        onLayout={e => setBarWidth(e.nativeEvent.layout.width)}
      >
        {/* Animated Traveling Curved Cutout Notch */}
        {barWidth > 0 && (
          <Animated.View
            style={[
              styles.travelingNotchContainer,
              {
                transform: [{ translateX: notchTranslateX }],
              },
            ]}
          >
            {/* Notch Background Well (Carved out U-Shape matching screen background) */}
            <View
              style={[
                styles.notchWellCutout,
                {
                  backgroundColor: colors.background,
                  borderColor: isDark ? 'rgba(203, 221, 225, 0.14)' : 'rgba(31, 65, 75, 0.08)',
                },
              ]}
            />

            {/* Floating Active Circular Disc */}
            <Animated.View
              style={[
                styles.floatingActiveCircle,
                {
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                  transform: [
                    { scaleX: circleScaleX },
                    { scaleY: circleScaleY },
                    { translateY: circleElevationY },
                  ],
                },
              ]}
            >
              {isActiveProfile && userPhotoUri ? (
                <Image
                  source={{ uri: userPhotoUri }}
                  style={styles.activeProfileAvatar}
                  onError={() => setImgError(true)}
                />
              ) : (
                <Ionicons
                  name={activeIconName}
                  size={23}
                  color="#FFFFFF"
                />
              )}
            </Animated.View>
          </Animated.View>
        )}

        {/* 5 Tab Items Evenly Spaced */}
        {tabs.map((tab, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            Keyboard.dismiss();
            const event = navigation.emit({
              type: 'tabPress',
              target: state.routes[index].key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(state.routes[index].name);
            }
          };

          const iconColor = isDark ? '#CBDDE1' : '#056F89';
          const isProfileTab = tab.name === 'Profile';

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.85}
            >
              <Animated.View
                style={[
                  styles.tabIconWrapper,
                  {
                    transform: [{ scale: tabScales[index] }],
                    opacity: isFocused ? 0 : 1, // Elevated inside the active floating circle
                  },
                ]}
              >
                {isProfileTab && userPhotoUri ? (
                  <Image
                    source={{ uri: userPhotoUri }}
                    style={[
                      styles.profileAvatar,
                      {
                        borderColor: isDark
                          ? 'rgba(203, 221, 225, 0.3)'
                          : 'rgba(5, 111, 137, 0.3)',
                        borderWidth: 1.2,
                      },
                    ]}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <Ionicons name={tab.iconOutline} size={22} color={iconColor} />
                )}

                {/* Unread Count Badge on Inactive Chat Tab */}
                {tab.showDot && !isFocused && tab.badgeCount > 0 && (
                  <View
                    style={[
                      styles.countBadge,
                      { backgroundColor: colors.badge },
                    ]}
                  >
                    <Text style={styles.countBadgeText}>
                      {tab.badgeCount > 99 ? '99+' : tab.badgeCount}
                    </Text>
                  </View>
                )}
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const BottomTabs = () => {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation<any>();

  const isAtRootTabRef = useRef(true);

  const handleSwipeRelease = (gestureState: any) => {
    if (!isAtRootTabRef.current) {
      return;
    }
    Keyboard.dismiss();
    const tabNav = tabNavigatorRef.current || navigation;
    const currentIndex = activeTabIndexRef.current;
    
    // Natural responsive swipe thresholds (velocity flick or distance drag)
    const isSwipeLeft =
      gestureState.dx < -15 || (gestureState.dx < -5 && gestureState.vx < -0.12);
    const isSwipeRight =
      gestureState.dx > 15 || (gestureState.dx > 5 && gestureState.vx > 0.12);

    if (isSwipeLeft) {
      // Swiped Left -> Move to Next Tab in Order: Chats > Calls > Connect > Search > Profile
      if (currentIndex < TAB_ORDER.length - 1) {
        const nextIndex = currentIndex + 1;
        activeTabIndexRef.current = nextIndex;
        tabNav.navigate(TAB_ORDER[nextIndex]);
      }
    } else if (isSwipeRight) {
      // Swiped Right -> Move to Previous Tab in Order
      if (currentIndex > 0) {
        const prevIndex = currentIndex - 1;
        activeTabIndexRef.current = prevIndex;
        tabNav.navigate(TAB_ORDER[prevIndex]);
      }
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (!isAtRootTabRef.current) {
          return false;
        }
        return (
          Math.abs(gestureState.dx) > 10 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.1
        );
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        if (!isAtRootTabRef.current) {
          return false;
        }
        return (
          Math.abs(gestureState.dx) > 10 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.1
        );
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_, gestureState) => {
        handleSwipeRelease(gestureState);
      },
      onPanResponderTerminate: (_, gestureState) => {
        handleSwipeRelease(gestureState);
      },
    }),
  ).current;

  useEffect(() => {
    const openProfileSetupOnce = async () => {
      if (!user || user.isProfileSetup) {
        return;
      }

      const alreadyShown = await AsyncStorage.getItem('profile_setup_shown');

      if (!alreadyShown) {
        await AsyncStorage.setItem('profile_setup_shown', 'true');

        navigation.navigate('Profile', {
          screen: 'EditProfile',
          params: { mode: 'setup' },
        });
      }
    };

    openProfileSetupOnce();
  }, [user, navigation]);

  return (
    <View style={styles.rootContainer} {...panResponder.panHandlers}>
      <Tab.Navigator
        initialRouteName="Chats"
        backBehavior="history"
        screenListeners={{
          state: (e: any) => {
            const navState = e.data?.state;
            if (navState) {
              const activeIndex = navState.index;
              if (typeof activeIndex === 'number') {
                activeTabIndexRef.current = activeIndex;
              }
              const activeRoute = navState.routes?.[activeIndex];
              const childRouteName = getFocusedRouteNameFromRoute(activeRoute) ?? '';
              isAtRootTabRef.current = !SUB_SCREENS.includes(childRouteName);
            }
          },
        }}
        tabBar={props => <CurvedAnimatedTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tab.Screen name="Chats" component={ChatNavigator} />
        <Tab.Screen name="Calls" component={CallsHome} />
        <Tab.Screen name="Connect" component={ConnectedUsersScreen} />
        <Tab.Screen name="Search" component={SearchPage} />
        <Tab.Screen name="Profile" component={ProfileNavigator} />
      </Tab.Navigator>
    </View>
  );
};

export default BottomTabs;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  floatingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 12,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  curvedBarWrapper: {
    flex: 1,
    height: BAR_HEIGHT,
    borderRadius: 31,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'relative',
    elevation: 16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
  },
  travelingNotchContainer: {
    position: 'absolute',
    top: -NOTCH_DEPTH / 2,
    width: NOTCH_WIDTH,
    height: NOTCH_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  notchWellCutout: {
    width: NOTCH_WIDTH,
    height: NOTCH_WIDTH,
    borderRadius: NOTCH_WIDTH / 2,
    position: 'absolute',
    borderWidth: 1,
    top: -2,
  },
  floatingActiveCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    top: -6,
    elevation: 12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.45,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  tabIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    width: 40,
    height: 40,
  },
  countBadge: {
    position: 'absolute',
    top: 1,
    right: 1,
    minWidth: 15,
    height: 15,
    borderRadius: 7.5,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  profileAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  activeProfileAvatar: {
    width: CIRCLE_SIZE - 4,
    height: CIRCLE_SIZE - 4,
    borderRadius: (CIRCLE_SIZE - 4) / 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
