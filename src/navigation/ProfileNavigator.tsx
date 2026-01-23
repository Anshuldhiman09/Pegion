import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ViewProfile from '../screens/profile/ViewProfile';
import EditProfile from '../screens/profile/EditProfile';

export type ProfileStackParamList = {
  ViewProfile: undefined;
  EditProfile: { mode?: 'setup' | 'edit' };
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const ProfileNavigator = () => {
  return (
    <Stack.Navigator>
      {/* ✅ HEADER SHOWN */}
      <Stack.Screen
        name="ViewProfile"
        component={ViewProfile}
        options={{
          title: 'Profile',
          headerShown: true,
        }}
      />

      {/* ❌ HEADER HIDDEN */}
      <Stack.Screen
        name="EditProfile"
        component={EditProfile}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default ProfileNavigator;
