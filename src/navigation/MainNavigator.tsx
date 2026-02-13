import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import BottomTabs from '../components/BottomTabs';
import ProfileNavigator from './ProfileNavigator';
import { AuthContext } from '../context/AuthContext';
import SettingsNavigator from './SettingsNavigator';

export type MainStackParamList = {
  HomeTabs: undefined;
  Settings: undefined;
  Profile: {
    screen?: string;
    params?: any;
  };
};

const Stack = createNativeStackNavigator<MainStackParamList>();

const MainNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeTabs" component={BottomTabs} />
      <Stack.Screen name="Profile" component={ProfileNavigator} />
      <Stack.Screen name="Settings" component={SettingsNavigator} />
    </Stack.Navigator>
  );
};

export default MainNavigator;

