import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type SettingsStackParamList = {
  SettingsHome: undefined;
  AccountSettings: undefined;
  PrivacyAndSecurity: undefined;
  Notifications: undefined;
  HelpAndSupport: undefined;
};

type NavigationProp =
  NativeStackNavigationProp<SettingsStackParamList>;

const SettingItem = ({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.item} onPress={onPress}>
    <Text style={styles.text}>{title}</Text>
  </TouchableOpacity>
);

const SettingsHome = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <SettingItem
        title="Account"
        onPress={() => navigation.navigate('AccountSettings')}
      />
      <SettingItem
        title="Privacy & Security"
        onPress={() => navigation.navigate('PrivacyAndSecurity')}
      />
      <SettingItem
        title="Notifications"
        onPress={() => navigation.navigate('Notifications')}
      />
      <SettingItem
        title="Help & Support"
        onPress={() => navigation.navigate('HelpAndSupport')}
      />
    </View>
  );
};

export default SettingsHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  item: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderColor: '#ddd',
  },
  text: {
    fontSize: 16,
    color: '#111',
  },
});
