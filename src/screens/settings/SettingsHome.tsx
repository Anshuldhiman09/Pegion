import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  useColorScheme,
  ScrollView,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@react-native-vector-icons/ionicons';
import LogoutConfirm from '../menu/LogoutConfirm';

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
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  onPress?: () => void;
  isSwitch?: boolean;
  danger?: boolean;
};

const SettingItem: React.FC<ItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  isSwitch = false,
  danger = false,
}) => {
  const [enabled, setEnabled] = useState(false);
  const isDark = useColorScheme() === 'dark';

  return (
    <TouchableOpacity
      style={styles.item}
      onPress={!isSwitch ? onPress : undefined}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <Ionicons
          name={icon}
          size={22}
          color={danger ? '#e11d48' : isDark ? '#fff' : '#222'}
          style={{ marginRight: 15 }}
        />

        <View>
          <Text
            style={[
              styles.text,
              {
                color: danger
                  ? '#e11d48'
                  : isDark
                  ? '#fff'
                  : '#111',
              },
            ]}
          >
            {title}
          </Text>

          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                { color: isDark ? '#aaa' : '#666' },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {isSwitch ? (
        <Switch value={enabled} onValueChange={setEnabled} />
      ) : (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={isDark ? '#aaa' : '#999'}
        />
      )}
    </TouchableOpacity>
  );
};

const SettingsHome: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const isDark = useColorScheme() === 'dark';

  const [logoutVisible, setLogoutVisible] = useState(false);

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#0f172a' : '#f2f2f2' },
      ]}
      edges={['top']}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text
          style={[
            styles.header,
            { color: isDark ? '#fff' : '#000' },
          ]}
        >
          Settings
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: isDark ? '#1e293b' : '#fff' },
          ]}
        >
          <SettingItem
            icon="person-circle-outline"
            title="Profile"
            subtitle="Edit name, bio, profile photo"
            onPress={() => navigation.navigate('Profile')}
          />

          <SettingItem
            icon="key-outline"
            title="Account"
            subtitle="Privacy, change number"
            onPress={() =>
              navigation.navigate('AccountSettings')
            }
          />

          <SettingItem
            icon="shield-checkmark-outline"
            title="Security"
            subtitle="Two-step verification"
            onPress={() => navigation.navigate('Security')}
          />

          <SettingItem
            icon="lock-closed-outline"
            title="Privacy"
            subtitle="Blocked users, read receipts"
            onPress={() => navigation.navigate('Privacy')}
          />

          <SettingItem
            icon="notifications-outline"
            title="Notifications"
            subtitle="Message & call alerts"
            onPress={() =>
              navigation.navigate('Notifications')
            }
          />

          <SettingItem
            icon="chatbubble-ellipses-outline"
            title="Chats"
            subtitle="Backup, history, wallpaper"
            onPress={() => navigation.navigate('Chats')}
          />

          <SettingItem
            icon="cloud-outline"
            title="Data & Storage"
            subtitle="Network usage, auto download"
            onPress={() =>
              navigation.navigate('DataStorage')
            }
          />

          <SettingItem
            icon="help-circle-outline"
            title="Help"
            subtitle="FAQ, contact support"
            onPress={() =>
              navigation.navigate('HelpAndSupport')
            }
          />

          <SettingItem
            icon="information-circle-outline"
            title="About Pegion"
            subtitle="App version & info"
            onPress={() => navigation.navigate('About')}
          />

          <SettingItem
            icon="log-out-outline"
            title="Logout"
            danger
            onPress={() => setLogoutVisible(true)}
          />
        </View>
      </ScrollView>

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
  container: { flex: 1 },

  header: {
    fontSize: 28,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 15,
  },

  card: {
    marginHorizontal: 15,
    borderRadius: 16,
    paddingVertical: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  item: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  text: {
    fontSize: 16,
    fontWeight: '500',
  },

  subtitle: {
    fontSize: 13,
    marginTop: 3,
  },
});
