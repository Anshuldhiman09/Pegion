import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SettingsHome from '../screens/settings/SettingsHome';
import AccountSettings from '../screens/settings/AccountSettings';
import Notifications from '../screens/settings/Notifications';
import HelpAndSupport from '../screens/settings/HelpAndSupport';
import Privacy from '../screens/settings/Privacy';
import { SettingsStackParamList } from './Types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

const SettingsNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsHome" component={SettingsHome} />
      <Stack.Screen name="AccountSettings" component={AccountSettings} />
      <Stack.Screen name="Privacy" component={Privacy} />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="HelpAndSupport" component={HelpAndSupport} />
    </Stack.Navigator>
  );
};

export default SettingsNavigator;
