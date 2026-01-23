import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SignupScreen from '../screens/auth/SignupScreen';
import OtpVerification from '../screens/auth/OtpVerification';

export type AuthStackParamList = {
  Signup: undefined;
  Otp: { phone: string };
  EditProfile: undefined;
};

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
