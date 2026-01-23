import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import Header from '../../components/Header';

const HomeChat = () => {
  const navigation = useNavigation<any>(); 


  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Pegion"
        navigation={navigation}
        showSearch
        showMenu
        onSearch={() => console.log('Search pressed')}
      />

      <View style={styles.content}>
        <Text style={styles.text}>Chat</Text>

       
      </View>
    </SafeAreaView>
  );
};

export default HomeChat;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 24, fontWeight: '700', marginBottom: 30 },
  logoutButton: {
    backgroundColor: '#b11717',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  logoutText: { color: '#000', fontWeight: '600' },
});
