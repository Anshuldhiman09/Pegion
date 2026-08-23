import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LogoutConfirm from './LogoutConfirm';
import { useTheme } from '../../theme';

interface Props {
  navigation: any;
  onClose: () => void;
  menuType?: 'chat' | 'profile' | 'status';
}

const MenuOptions: React.FC<Props> = ({
  navigation,
  onClose,
  menuType = 'chat',
}) => {
  const { colors } = useTheme();
  const [logoutVisible, setLogoutVisible] = useState(false);

  const goToSettings = (screen: string) => {
    onClose();
    navigation.navigate('Settings', { screen });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* MENU HEADER */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <Text style={[styles.title, { color: colors.text }]}>Menu</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[styles.close, { color: colors.textSecondary }]}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* ================= STATUS MENU ================= */}
      {menuType === 'status' && (
        <MenuItem
          title="Settings"
          colors={colors}
          onPress={() => goToSettings('SettingsHome')}
        />
      )}

      {/* ================= CHAT MENU ================= */}
      {menuType === 'chat' && (
        <>
          <MenuItem
            title="Profile"
            colors={colors}
            onPress={() => {
              onClose();
              navigation.navigate('Profile', {
                screen: 'ViewProfile',
              });
            }}
          />

          <MenuItem
            title="Connection Requests"
            colors={colors}
            onPress={() => {
              onClose();
              navigation.navigate('Notifications');
            }}
          />

          <MenuItem
            title="Settings"
            colors={colors}
            onPress={() => goToSettings('SettingsHome')}
          />

          <MenuItem
            title="Help"
            colors={colors}
            onPress={() => goToSettings('HelpAndSupport')}
          />

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <MenuItem
            title="Logout"
            colors={colors}
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
            colors={colors}
            onPress={() => {
              onClose();
              navigation.navigate('Profile', {
                screen: 'EditProfile',
              });
            }}
          />

          <MenuItem
            title="Settings"
            colors={colors}
            onPress={() => goToSettings('SettingsHome')}
          />

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <MenuItem
            title="Logout"
            colors={colors}
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
  colors,
  danger = false,
}: {
  title: string;
  onPress: () => void;
  colors: any;
  danger?: boolean;
}) => (
  <TouchableOpacity style={styles.option} onPress={onPress} activeOpacity={0.7}>
    <Text
      style={[
        styles.text,
        { color: danger ? colors.danger : colors.text },
        danger && styles.danger,
      ]}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

/* -------- STYLES -------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    height: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  close: {
    fontSize: 20,
    fontWeight: '600',
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 15,
    fontWeight: '500',
  },
  danger: {
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
});

