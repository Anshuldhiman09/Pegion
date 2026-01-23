import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SignupScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  
const isValidEmail = (value: string) => {
  return /^[^\s@]+@gmail\.com$/.test(value);
};


  const handleSendOtp = () => {
    if (!isValidEmail(email)) {
      Alert.alert('Invalid Email', 'Enter a valid email address');
      return;
    }

    navigation.navigate('Otp', { email });
  };

  return (
    <View style={styles.container}>

      {/* LOGO */}
      <Image
        source={require('../../assets/images/pegion.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Pegion</Text>
      <Text style={styles.subtitle}>Enter your email address</Text>

      <TextInput
        placeholder="Email Address"
        placeholderTextColor="#666"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleSendOtp}>
        <Text style={styles.buttonText}>Send OTP</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    padding: 24,
  },

 logo: {
  width: 220,
  height: 220,
  alignSelf: 'center',
  marginBottom: 24,
},


  title: {
    fontSize: 36,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },

  subtitle: {
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 30,
  },

  input: {
    backgroundColor: '#111',
    color: '#fff',
    padding: 14,
    borderRadius: 8,
    marginBottom: 20,
  },

  button: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
  },

  buttonText: {
    color: '#000',
    fontWeight: '600',
    textAlign: 'center',
  },
});
