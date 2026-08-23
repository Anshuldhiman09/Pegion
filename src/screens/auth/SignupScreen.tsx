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
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../api';
import { useTheme, getNeumorphicStyles } from '../../theme';

const SignupScreen = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const neu = getNeumorphicStyles(isDark);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidEmail = (val: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(val);
  };

  const handleSendOtp = async () => {
    if (!isValidEmail(email)) {
      Alert.alert('Invalid Email', 'Enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.sendOtp(email);

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: result.statusMsg || 'OTP sent successfully',
          position: 'top',
        });

        await AsyncStorage.setItem('email', email.trim());

        setTimeout(() => {
          navigation.navigate('Otp', { email: email.trim() });
        }, 1000);
      } else {
        Toast.show({
          type: 'error',
          text1: result.statusMsg || 'Failed to send OTP',
          position: 'top',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.message || 'Something went wrong',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Image
        source={require('../../assets/images/pegion.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={[styles.title, { color: colors.text }]}>Pegion</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Get Start from Email </Text>

      <View style={[styles.inputWrapper, neu.fieldSunken({ radius: 18 })]}>
        <TextInput
          placeholder="Email Address"
          placeholderTextColor={colors.placeholderText}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          style={[
            styles.input,
            {
              color: colors.text,
            },
          ]}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          neu.circleButton(52, { depth: 'high' }),
          { width: '100%', borderRadius: 26, backgroundColor: colors.primary },
          loading && { opacity: 0.6 },
        ]}
        onPress={handleSendOtp}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Verifing...' : 'Verify Email'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignupScreen;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },

  logo: {
    width: 140,
    height: 140,
    alignSelf: 'center',
    marginBottom: 16,
  },

  title: {
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.5,
  },

  subtitle: {
    textAlign: 'center',
    marginBottom: 28,
    fontSize: 15,
  },

  inputWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 20,
    minHeight: 52,
    justifyContent: 'center',
  },

  input: {
    fontSize: 16,
    paddingVertical: 10,
  },

  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
  },
});

