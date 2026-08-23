import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SignupScreen from '../screens/auth/SignupScreen';
import OtpVerification from '../screens/auth/OtpVerification';

import { AuthStackParamList } from './Types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="Otp" component={OtpVerification} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
