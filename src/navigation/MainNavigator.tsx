import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import BottomTabs from '../components/BottomTabs';
import SettingsNavigator from './SettingsNavigator';
import ConnectedUsersScreen from '../screens/connections/ConnectedUsersScreen';
import UserProfileScreen from '../screens/profile/UserProfileScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ChatScreen from '../screens/chat/ChatScreen';

export type MainStackParamList = {
  BottomTabs: undefined;
  Settings: undefined;
  ConnectedUsers: { isDiscover?: boolean; isGlobalSearch?: boolean; mode?: string } | undefined;
  UserProfile: { userId?: string | number; user?: any } | undefined;
  Notifications: undefined;
  ChatScreen: any;
};

const Stack = createNativeStackNavigator<MainStackParamList>();
const MainNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BottomTabs" component={BottomTabs} />
      <Stack.Screen name="Settings" component={SettingsNavigator} />
      <Stack.Screen name="ConnectedUsers" component={ConnectedUsersScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
    </Stack.Navigator>
  );
};

export default MainNavigator;
