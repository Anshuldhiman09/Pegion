import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LogoutConfirm from '../menu/LogoutConfirm';
import { useTheme, ThemeMode, getNeumorphicStyles } from '../../theme';

type SettingsStackParamList = {
  SettingsHome: undefined;
  Profile: undefined;
  AccountSettings: undefined;
  Privacy: undefined;
  Notifications: undefined;
  DataStorage: undefined;
  Chats: undefined;
  Security: undefined;
  HelpAndSupport: undefined;
  About: undefined;
};

type NavigationProp = NativeStackNavigationProp<
  SettingsStackParamList,
  'SettingsHome'
>;

type ItemProps = {
  icon: string;
  title: string;
  subtitle?: string;
  valueText?: string;
  onPress?: () => void;
  danger?: boolean;
};

const SettingItem: React.FC<ItemProps> = ({
  icon,
  title,
  subtitle,
  valueText,
  onPress,
  danger = false,
}) => {
  const { colors, isDark } = useTheme();
  const neu = getNeumorphicStyles(isDark);

  return (
    <TouchableOpacity
      style={[styles.item, { borderBottomColor: colors.divider }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <View
          style={[
            styles.iconWrapper,
            danger
              ? neu.circleButton(40, { depth: 'low' })
              : neu.circleButton(40, { depth: 'low' }),
            {
              backgroundColor: danger
                ? 'rgba(239, 68, 68, 0.12)'
                : (isDark ? '#22262d' : '#f0f2f5'),
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={19}
            color={danger ? colors.danger : colors.text}
          />
        </View>

        <View style={styles.textContainer}>
          <Text
            style={[
              styles.text,
              {
                color: danger ? colors.danger : colors.text,
              },
            ]}
          >
            {title}
          </Text>

          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rightSection}>
        {valueText && (
          <Text style={[styles.valueText, { color: colors.primary }]}>
            {valueText}
          </Text>
        )}
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textMuted}
        />
      </View>
    </TouchableOpacity>
  );
};

const SettingsHome: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark, themeMode, setThemeMode } = useTheme();
  const neu = getNeumorphicStyles(isDark);

  const [logoutVisible, setLogoutVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  const getThemeModeLabel = (mode: ThemeMode) => {
    switch (mode) {
      case 'dark':
        return 'Dark Mode';
      case 'light':
        return 'Light Mode';
      case 'system':
      default:
        return 'System Default';
    }
  };

  const themeOptions: { mode: ThemeMode; label: string; icon: string; desc: string }[] = [
    {
      mode: 'system',
      label: 'System Default',
      icon: 'settings-outline',
      desc: 'Matches your device display mode automatically',
    },
    {
      mode: 'dark',
      label: 'Dark Mode',
      icon: 'moon-outline',
      desc: 'Sleek dark background for low-light environments',
    },
    {
      mode: 'light',
      label: 'Light Mode',
      icon: 'sunny-outline',
      desc: 'Clean bright background for daytime use',
    },
  ];

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
      edges={['top']}
    >
      {/* Top Header Row with Back Button */}
      <View style={styles.topHeaderRow}>
        <TouchableOpacity
          style={[styles.headerBackBtn, neu.circleButton(38, { depth: 'low' })]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.header, { color: colors.text }]}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* Appearance Group */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            PREFERENCES
          </Text>
        </View>
        <View
          style={[
            styles.card,
            neu.cardElevated({ radius: 20, depth: 'low' }),
          ]}
        >
          <SettingItem
            icon="color-palette-outline"
            title="App Theme"
            subtitle="Choose between Light, Dark or System"
            valueText={getThemeModeLabel(themeMode)}
            onPress={() => setThemeModalVisible(true)}
          />
        </View>

        {/* General Settings */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            ACCOUNT & PRIVACY
          </Text>
        </View>
        <View
          style={[
            styles.card,
            neu.cardElevated({ radius: 20, depth: 'low' }),
          ]}
        >
          <SettingItem
            icon="person-circle-outline"
            title="Profile"
            subtitle="Edit name, bio, profile photo"
            onPress={() => (navigation.getParent() as any)?.navigate('Profile')}
          />

          <SettingItem
            icon="key-outline"
            title="Account"
            subtitle="Security, active sessions, info"
            onPress={() => navigation.navigate('AccountSettings')}
          />

          <SettingItem
            icon="lock-closed-outline"
            title="Privacy"
            subtitle="Blocked users, status visibility"
            onPress={() => navigation.navigate('Privacy')}
          />

          <SettingItem
            icon="notifications-outline"
            title="Notifications"
            subtitle="Message & call alerts"
            onPress={() => navigation.navigate('Notifications')}
          />

          <SettingItem
            icon="chatbubble-ellipses-outline"
            title="Chats"
            subtitle="Chat preferences, wallpapers"
            onPress={() => (navigation.getParent() as any)?.navigate('Chats')}
          />
        </View>

        {/* Support & Legal */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            SUPPORT
          </Text>
        </View>
        <View
          style={[
            styles.card,
            neu.cardElevated({ radius: 20, depth: 'low' }),
          ]}
        >
          <SettingItem
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="FAQ, contact support"
            onPress={() => navigation.navigate('HelpAndSupport')}
          />

          <SettingItem
            icon="information-circle-outline"
            title="About Pegion"
            subtitle="App version 1.0.0"
            onPress={() => navigation.navigate('HelpAndSupport')}
          />

          <SettingItem
            icon="log-out-outline"
            title="Logout"
            danger
            onPress={() => setLogoutVisible(true)}
          />
        </View>
      </ScrollView>

      {/* Theme Picker Modal */}
      <Modal
        visible={themeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setThemeModalVisible(false)}
        >
          <View
            style={[
              styles.themeModalCard,
              neu.cardElevated({ radius: 28, depth: 'high' }),
            ]}
          >
            <View style={styles.modalHeader}>
              <Ionicons name="color-palette" size={24} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Choose Theme
              </Text>
            </View>

            <View style={styles.themeOptionsContainer}>
              {themeOptions.map(option => {
                const isSelected = themeMode === option.mode;
                return (
                  <TouchableOpacity
                    key={option.mode}
                    style={[
                      styles.themeOptionRow,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(255, 68, 56, 0.15)'
                            : '#fff1f0'
                          : colors.surfaceSubtle,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setThemeMode(option.mode);
                      setThemeModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.themeOptionLeft}>
                      <Ionicons
                        name={option.icon}
                        size={22}
                        color={isSelected ? colors.primary : colors.text}
                      />
                      <View style={styles.themeOptionTextWrap}>
                        <Text
                          style={[
                            styles.themeOptionLabel,
                            {
                              color: isSelected
                                ? colors.primary
                                : colors.text,
                              fontWeight: isSelected ? '700' : '600',
                            },
                          ]}
                        >
                          {option.label}
                        </Text>
                        <Text
                          style={[
                            styles.themeOptionDesc,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {option.desc}
                        </Text>
                      </View>
                    </View>

                    <Ionicons
                      name={
                        isSelected
                          ? 'radio-button-on'
                          : 'radio-button-off'
                      }
                      size={20}
                      color={isSelected ? colors.primary : colors.textMuted}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[
                styles.modalCloseBtn,
                { backgroundColor: colors.surfaceSubtle },
              ]}
              onPress={() => setThemeModalVisible(false)}
            >
              <Text style={[styles.modalCloseText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Logout Modal */}
      <LogoutConfirm
        visible={logoutVisible}
        onClose={() => setLogoutVisible(false)}
      />
    </SafeAreaView>
  );
};

export default SettingsHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerBackBtn: {},
  header: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 38,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  valueText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Theme Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  themeModalCard: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  themeOptionsContainer: {
    gap: 10,
    marginBottom: 18,
  },
  themeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  themeOptionTextWrap: {
    flex: 1,
  },
  themeOptionLabel: {
    fontSize: 15,
    marginBottom: 2,
  },
  themeOptionDesc: {
    fontSize: 11,
  },
  modalCloseBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

