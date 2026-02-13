import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import LogoutConfirm from './LogoutConfirm';

interface Props {
  navigation: any;
  onClose: () => void;
  menuType?: 'chat' | 'profile' | 'status'; // ✅ ADD status
}

const MenuOptions: React.FC<Props> = ({
  navigation,
  onClose,
  menuType = 'chat',
}) => {
  const [logoutVisible, setLogoutVisible] = useState(false);

  const goToSettings = (screen: string) => {
    onClose();
    navigation.navigate('Settings', { screen });
  };

  return (
    <View style={styles.container}>
      {/* MENU HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Menu</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.close}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* ================= STATUS MENU ================= */}
      {menuType === 'status' && (
        <MenuItem
          title="Settings"
          onPress={() => goToSettings('SettingsHome')}
        />
      )}

      {/* ================= CHAT MENU ================= */}
      {menuType === 'chat' && (
        <>
          <MenuItem
            title="Profile"
            onPress={() => {
              onClose();
              navigation.navigate('Profile', {
                screen: 'ViewProfile',
              });
            }}
          />

          <MenuItem
            title="Settings"
            onPress={() => goToSettings('SettingsHome')}
          />

          <MenuItem
            title="Help"
            onPress={() => goToSettings('HelpAndSupport')}
          />

          <View style={styles.divider} />

          <MenuItem
            title="Logout"
            danger
            onPress={() => setLogoutVisible(true)}
          />
        </>
      )}

      {/* ================= PROFILE MENU ================= */}
      {menuType === 'profile' && (
        <>
          <MenuItem
            title="Edit Profile"
            onPress={() => {
              onClose();
              navigation.navigate('Profile', {
                screen: 'EditProfile',
              });
            }}
          />

          <MenuItem
            title="Settings"
            onPress={() => goToSettings('SettingsHome')}
          />

          <View style={styles.divider} />

          <MenuItem
            title="Logout"
            danger
            onPress={() => setLogoutVisible(true)}
          />
        </>
      )}

      <LogoutConfirm
        visible={logoutVisible}
        onClose={() => setLogoutVisible(false)}
      />
    </View>
  );
};

export default MenuOptions;

/* -------- REUSABLE MENU ITEM -------- */

const MenuItem = ({
  title,
  onPress,
  danger = false,
}: {
  title: string;
  onPress: () => void;
  danger?: boolean;
}) => (
  <TouchableOpacity style={styles.option} onPress={onPress}>
    <Text style={[styles.text, danger && styles.danger]}>
      {title}
    </Text>
  </TouchableOpacity>
);

/* -------- STYLES -------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  close: {
    fontSize: 22,
  },
  option: {
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 16,
    color: '#111',
  },
  danger: {
    color: '#D32F2F',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
});
