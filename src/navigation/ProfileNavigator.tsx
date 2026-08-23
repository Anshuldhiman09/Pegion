import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ViewProfile from '../screens/profile/ViewProfile';
import EditProfile from '../screens/profile/EditProfile';

import { ProfileStackParamList } from './Types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();
const ProfileNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ViewProfile" component={ViewProfile} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
    </Stack.Navigator>
  );
};

export default ProfileNavigator;
