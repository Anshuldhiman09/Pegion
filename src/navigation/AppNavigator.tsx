import React, { useContext } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import SetupProfile from '../screens/profile/SetupProfile';
import { AuthContext } from '../context/AuthContext';
import CompleteProfile from '../screens/profile/CompleteProfile';
import { useTheme } from '../theme';

import { RootStackParamList } from './Types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { isAuthenticated, isLoading, user } = useContext(AuthContext);
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : user?.isProfileSetup === false ? (
        <Stack.Screen name="SetupProfile" component={SetupProfile} />
      ) : (
        <Stack.Screen name="Main" component={MainNavigator} />
      )}

      <Stack.Screen name="CompleteProfile" component={CompleteProfile} />
    </Stack.Navigator>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

