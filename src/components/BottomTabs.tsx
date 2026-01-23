import React from 'react';
import { Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeChat from '../screens/chat/HomeChat';
import CallsHome from '../screens/calls/CallsHome';
import StatusHome from '../screens/status/StatusHome';
import SettingsNavigator from '../navigation/SettingsNavigator';

const Tab = createBottomTabNavigator();
const iconSize = 24;

const BottomTabs = () => {
  return (
    <Tab.Navigator

     initialRouteName="Chats" 
    
     screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ff0000',
        tabBarInactiveTintColor: '#000',
      }}
    >
      <Tab.Screen
        name="Status"
        component={StatusHome}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../assets/icons/status.png')}
              style={{
                width: iconSize,
                height: iconSize,
                tintColor: focused ? '#ff0000' : '#000',
              }}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Chats"
        component={HomeChat}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../assets/icons/chats.png')}
              style={{
                width: iconSize,
                height: iconSize,
                tintColor: focused ? '#ff0000' : '#000',
              }}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Calls"
        component={CallsHome}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../assets/icons/calls.png')}
              style={{
                width: iconSize,
                height: iconSize,
                tintColor: focused ? '#ff0000' : '#000',
              }}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../assets/icons/setting.png')}
              style={{
                width: iconSize,
                height: iconSize,
                tintColor: focused ? '#ff0000' : '#000',
              }}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabs;

