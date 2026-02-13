import React , {useContext, useEffect} from 'react';
import { Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeChat from '../screens/chat/HomeChat';
import CallsHome from '../screens/calls/CallsHome';
import StatusHome from '../screens/status/StatusHome';
import SettingsNavigator from '../navigation/SettingsNavigator';
import ProfileNavigator from '../navigation/ProfileNavigator';
import { AuthContext } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const Tab = createBottomTabNavigator();
const iconSize = 24;

const BottomTabs = () => {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation<any>();

  useEffect(() => {
    const openProfileSetupOnce = async () => {
      if (!user || user.isProfileSetup) return;

      const alreadyShown = await AsyncStorage.getItem('profile_setup_shown');

      if (!alreadyShown) {
        await AsyncStorage.setItem('profile_setup_shown', 'true');

        navigation.navigate('Profile', {
          screen: 'EditProfile',
          params: { mode: 'setup' },
        });
      }
    };

    openProfileSetupOnce();
  }, [user]);

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
  name="Profile"
  component={ProfileNavigator}
  options={{
    tabBarIcon: ({ focused }) => (
      <Image
        source={
          user?.photo
            ? { uri: user.photo }
            : require('../assets/icons/user.png')
        }
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: iconSize / 2, 
          tintColor: user?.photo
            ? undefined 
            : focused
            ? '#ff0000'
            : '#000',
        }}
      />
    ),
  }}
/>

    </Tab.Navigator>
  );
};

export default BottomTabs;

