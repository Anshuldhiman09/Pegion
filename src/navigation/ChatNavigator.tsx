import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeChat from '../screens/chat/HomeChat';

const Stack = createNativeStackNavigator();

const ChatNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Chat" component={HomeChat} />
    </Stack.Navigator>
  );
};

export default ChatNavigator;
