import React, { useContext, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../context/AuthContext';
import { userService, ProfileData } from '../../api';
import { useTheme, getNeumorphicStyles } from '../../theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FocusAwareStatusBar from '../../components/FocusAwareStatusBar';

const defaultUser = require('../../assets/icons/user.png');

const ViewProfile = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const neu = getNeumorphicStyles(isDark);
  const { user, logout } = useContext(AuthContext);

  const topBannerBg = isDark ? '#1e293b' : '#c7e6fc';

  const [profileData, setProfileData] = useState<ProfileData | null>(
    user
      ? {
          name: user.name,
          username: user.username,
          email: user.email,
          description: user.bio,
          dateOfBirth: user.dob,
          gender: user.gender,
          profileImageUrl: user.profileImageUrl || user.photo,
        }
      : null,
  );
  const [loading, setLoading] = useState(profileData === null);

  const fetchProfile = useCallback(async () => {
    try {
      const email = user?.email || (await AsyncStorage.getItem('auth_email'));
      if (!email) {
        setLoading(false);
        return;
      }

      const profileRes = await userService.getProfileInfo(email);
      if (profileRes?.data) {
        setProfileData(profileRes.data);
      }
    } catch (error) {
      console.log('Profile fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(false);
        StatusBar.setBackgroundColor(topBannerBg, true);
      }
      return () => {
        if (Platform.OS === 'android') {
          StatusBar.setTranslucent(false);
          StatusBar.setBackgroundColor(colors.statusBg, true);
        }
      };
    }, [fetchProfile, topBannerBg, colors.statusBg]),
  );

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
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of Pegion?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const photoUri =
    profileData?.profileImageUrl || profileData?.photo || user?.profileImageUrl;

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
      <FocusAwareStatusBar
        backgroundColor={topBannerBg}
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent={false}
      />

      {/* Loading Indicator */}
      {loading && !profileData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Banner with Pastel background */}
          <View style={[styles.topBanner, { backgroundColor: topBannerBg }]}>
            <View style={styles.topHeaderRow}>
              <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                My Profile
              </Text>

              <TouchableOpacity
                style={[
                  styles.notificationBtn,
                  neu.circleButton(44, { depth: 'high' }),
                  { backgroundColor: isDark ? '#334155' : '#ffffff' },
                ]}
                onPress={() => navigation.navigate('Settings', { screen: 'SettingsHome' })}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="options-outline"
                  size={22}
                  color={isDark ? '#ffffff' : '#0f172a'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Profile Info Card with Floating Avatar */}
          <View style={styles.cardOuterWrapper}>
            {/* The Card */}
            <View
              style={[
                styles.profileCard,
                neu.cardElevated({ radius: 30, depth: 'high' }),
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Top Row inside Card: Space for avatar on left, Edit Button on right */}
              <View style={styles.cardTopRow}>
                <View style={{ width: 96 }} />

                {/* [✎ Edit] Pill Button */}
                <TouchableOpacity
                  style={[
                    styles.editPillBtn,
                    neu.cardElevated({ radius: 20, depth: 'low' }),
                    { backgroundColor: isDark ? '#334155' : '#f1f5f9' },
                  ]}
                  onPress={() => navigation.navigate('EditProfile')}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name="create-outline"
                    size={16}
                    color={colors.text}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.editPillBtnText, { color: colors.text }]}>
                    Edit
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Name and Email */}
              <View style={styles.identityBlock}>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {profileData?.name || user?.name || 'Your Name'}
                </Text>
                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                  {profileData?.email || user?.email || 'email@example.com'}
                </Text>
                {profileData?.username ? (
                  <Text style={[styles.userHandle, { color: colors.primary }]}>
                    @{profileData.username}
                  </Text>
                ) : null}
              </View>

              {/* Bio Quote (if present) */}
              {profileData?.description ? (
                <View
                  style={[
                    styles.bioBox,
                    neu.fieldSunken({ radius: 14 }),
                    { backgroundColor: colors.surfaceSubtle },
                  ]}
                >
                  <Text
                    style={[
                      styles.bioText,
                      { color: isDark ? '#cbd5e1' : '#475569' },
                    ]}
                  >
                    “{profileData.description}”
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Absolute Floating Avatar (Zero Clipping, 100% visible circular well) */}
            <View style={styles.floatingAvatarWrapper}>
              <View
                style={[
                  styles.avatarWell,
                  neu.sunkenWell(94),
                  { borderColor: colors.surface, backgroundColor: colors.surface },
                ]}
              >
                <Image
                  source={photoUri ? { uri: photoUri } : defaultUser}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              </View>
            </View>
          </View>

          {/* SECTION: Profile Details */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
              Profile Details
            </Text>

            <View
              style={[
                styles.groupCard,
                neu.cardElevated({ radius: 24, depth: 'low' }),
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {/* Connected Users */}
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => navigation.navigate('ConnectedUsers')}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.listIconCircle,
                    neu.circleButton(38, { depth: 'low' }),
                    { backgroundColor: colors.surfaceSubtle },
                  ]}
                >
                  <Ionicons name="people-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.listTextContainer}>
                  <Text style={[styles.listTitle, { color: colors.text }]}>
                    Connected Users
                  </Text>
                  <Text style={[styles.listSubtitle, { color: colors.textMuted }]}>
                    Manage friends & connections
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <View style={[styles.listDivider, { backgroundColor: colors.border }]} />

              {/* Personal Information */}
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => navigation.navigate('EditProfile')}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.listIconCircle,
                    neu.circleButton(38, { depth: 'low' }),
                    { backgroundColor: colors.surfaceSubtle },
                  ]}
                >
                  <Ionicons name="person-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.listTextContainer}>
                  <Text style={[styles.listTitle, { color: colors.text }]}>
                    Personal Information
                  </Text>
                  <Text style={[styles.listSubtitle, { color: colors.textMuted }]}>
                    {`${profileData?.gender || 'Gender not set'} • ${formatDate(profileData?.dateOfBirth || user?.dob)}`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <View style={[styles.listDivider, { backgroundColor: colors.border }]} />

              {/* Log Out */}
              <TouchableOpacity
                style={styles.listItem}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.listIconCircle,
                    neu.circleButton(38, { depth: 'low' }),
                    { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2' },
                  ]}
                >
                  <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                </View>
                <View style={styles.listTextContainer}>
                  <Text style={[styles.listTitle, { color: '#ef4444', fontWeight: '700' }]}>
                    Log Out
                  </Text>
                  <Text style={[styles.listSubtitle, { color: colors.textMuted }]}>
                    Sign out of this device
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default ViewProfile;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  topBanner: {
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    paddingHorizontal: 20,
    paddingBottom: 110,
    minHeight: 190,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 130,
  },
  cardOuterWrapper: {
    position: 'relative',
    marginTop: -38,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  profileCard: {
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
    borderWidth: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    height: 48,
  },
  floatingAvatarWrapper: {
    position: 'absolute',
    top: -42,
    left: 32,
    zIndex: 25,
    elevation: 12,
  },
  avatarWell: {
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 3.5,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  editPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editPillBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  identityBlock: {
    marginTop: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  userHandle: {
    fontSize: 13.5,
    fontWeight: '600',
    marginTop: 2,
  },
  bioBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
  },
  bioText: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    marginLeft: 4,
  },
  groupCard: {
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  listIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  listTextContainer: {
    flex: 1,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  listSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  listDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 52,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 70 : 45,
    paddingRight: 20,
  },
  optionsMenuCard: {
    width: 260,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  menuOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  menuOptionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuOptionTextCol: {
    flex: 1,
  },
  menuOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  menuOptionSub: {
    fontSize: 11,
    marginTop: 1,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 10,
  },
});

