import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SettingsHome from '../screens/settings/SettingsHome';
import AccountSettings from '../screens/settings/AccountSettings';
import PrivacyAndSecurity from '../screens/settings/Privacy';
import Notifications from '../screens/settings/Notifications';
import HelpAndSupport from '../screens/settings/HelpAndSupport';
import Privacy from '../screens/settings/Privacy';

const Stack = createNativeStackNavigator();

const SettingsNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SettingsHome"
        component={SettingsHome}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen
        name="AccountSettings"
        component={AccountSettings}
        options={{ title: 'Account' }}
      />
      <Stack.Screen
        name="Privacy"
        component={Privacy}
        options={{ title: 'Privacy ' }}
      />
      <Stack.Screen
        name="Notifications"
        component={Notifications}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen
        name="HelpAndSupport"
        component={HelpAndSupport}
        options={{ title: 'Help & Support' }}
      />
    </Stack.Navigator>
  );
};

export default SettingsNavigator;
