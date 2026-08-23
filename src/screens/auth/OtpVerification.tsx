import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { authService } from '../../api';
import { useTheme, getNeumorphicStyles } from '../../theme';

const OTP_LENGTH = 6;
const RESEND_TIME = 30;

const OtpVerification = () => {
  const route = useRoute<any>();
  const { email } = route.params;

  const { login } = useContext(AuthContext);
  const { colors, isDark } = useTheme();
  const neu = getNeumorphicStyles(isDark);

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState(RESEND_TIME);
  const [loading, setLoading] = useState(false);

  const inputsRef = useRef<Array<TextInput | null>>([]);
  const isSubmittingRef = useRef(false);

  /* ---------------- MASK EMAIL ---------------- */
  const maskEmail = (val: string) => {
    const [name, domain] = val.split('@');
    return `${name[0]}***@${domain}`;
  };

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    if (timer === 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const clearOtpFields = () => {
    setOtp(Array(OTP_LENGTH).fill(''));
    setTimeout(() => {
      inputsRef.current[0]?.focus();
    }, 100);
  };

  const VerifyOtp = useCallback(async () => {
    const finalOtp = otp.join('');
    if (finalOtp.length !== OTP_LENGTH || isSubmittingRef.current) {
      return;
    }

    try {
      isSubmittingRef.current = true;
      setLoading(true);

      const result = await authService.verifyOtp(email, finalOtp);

      if (result.success && result.data) {
        Toast.show({
          type: 'success',
          text1: result.statusMsg || 'OTP Verified',
          position: 'top',
        });

        const { token, newUser, username, name } = result.data;

        await AsyncStorage.setItem('auth_token', token);
        await AsyncStorage.setItem('auth_email', email);

        await login(token, email, newUser, username, name);
      } else {
        clearOtpFields();
        Toast.show({
          type: 'error',
          text1: result.statusMsg || 'Invalid OTP',
          position: 'top',
        });
      }
    } catch (error: any) {
      clearOtpFields();
      Toast.show({
        type: 'error',
        text1: error.message || 'Something went wrong',
        position: 'top',
      });
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  }, [otp, email, login]);

  /* ---------------- AUTO SUBMIT ---------------- */
  const isOtpComplete = otp.every(digit => digit !== '');

  useEffect(() => {
    if (isOtpComplete && !loading && !isSubmittingRef.current) {
      VerifyOtp();
    }
  }, [isOtpComplete, loading, VerifyOtp]);

  /* ---------------- INPUT HANDLER ---------------- */
  const ChangeOtp = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const KeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  /* ---------------- RESEND OTP ---------------- */
  const ResendOtp = async () => {
    try {
      const targetEmail = email || (await AsyncStorage.getItem('email'));
      if (!targetEmail) {
        return;
      }

      const result = await authService.sendOtp(targetEmail);
      if (result.success) {
        setTimer(RESEND_TIME);
        setOtp(Array(OTP_LENGTH).fill(''));
        Toast.show({
          type: 'success',
          text1: result.statusMsg || 'OTP Resent Successfully',
          position: 'top',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: result.statusMsg || 'Failed to resend OTP',
          position: 'top',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.message || 'Resend Failed',
        position: 'top',
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Verify OTP</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Sent to {maskEmail(email)}
      </Text>

      <View style={styles.otpRow}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={ref => {
              inputsRef.current[index] = ref;
            }}
            value={digit}
            onChangeText={value => ChangeOtp(value, index)}
            onKeyPress={({ nativeEvent }) => KeyPress(nativeEvent.key, index)}
            keyboardType="number-pad"
            maxLength={1}
            style={[
              styles.otpBox,
              neu.fieldSunken({ radius: 14 }),
              {
                color: colors.text,
                borderColor: digit ? colors.primary : (isDark ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.08)'),
              },
            ]}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          neu.circleButton(52, { depth: 'high' }),
          { width: '100%', borderRadius: 26, backgroundColor: colors.primary },
          (!isOtpComplete || loading) && { opacity: 0.6 },
        ]}
        disabled={!isOtpComplete || loading}
        onPress={VerifyOtp}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.submitText}>Submit</Text>
        )}
      </TouchableOpacity>

      {timer > 0 ? (
        <Text style={[styles.timerText, { color: colors.textMuted }]}>
          Resend OTP in {timer}s
        </Text>
      ) : (
        <TouchableOpacity onPress={ResendOtp}>
          <Text style={[styles.resendText, { color: colors.primary }]}>
            Resend OTP
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default OtpVerification;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginVertical: 14,
    fontSize: 15,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 26,
  },
  otpBox: {
    width: 48,
    height: 56,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
  },
  timerText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
  resendText: {
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '700',
    fontSize: 15,
  },
  submitButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  submitText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
});

