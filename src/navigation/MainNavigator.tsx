import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import BottomTabs from '../components/BottomTabs';
import ProfileNavigator from './ProfileNavigator';
import { AuthContext } from '../context/AuthContext';

export type MainStackParamList = {
  HomeTabs: undefined;
  Profile: {
    screen?: string;
    params?: any;
  };
};

const Stack = createNativeStackNavigator<MainStackParamList>();

const MainNavigator = () => {
  const { user } = useContext(AuthContext);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user?.isProfileSetup ? (
        // 👇 FIRST LOGIN → FORCE PROFILE SETUP
        <Stack.Screen
          name="Profile"
          component={ProfileNavigator}
          initialParams={{
            screen: 'EditProfile',
            params: { mode: 'setup' },
          }}
        />
      ) : (
        // 👇 NORMAL FLOW
        <>
          <Stack.Screen name="HomeTabs" component={BottomTabs} />
          <Stack.Screen name="Profile" component={ProfileNavigator} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default MainNavigator;
