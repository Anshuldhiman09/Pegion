import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';

const OTP_LENGTH = 6;
const RESEND_TIME = 30;

const OtpVerification = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { email } = route.params;

  const { login } = useContext(AuthContext);

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState(RESEND_TIME);

  const inputsRef = useRef<Array<TextInput | null>>([]);

  /* ---------------- MASK EMAIL ---------------- */
  const maskEmail = (email: string) => {
    const [name, domain] = email.split('@');
    return `${name[0]}***@${domain}`;
  };

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  /* ---------------- VERIFY OTP ---------------- */
  const handleVerifyOtp = async () => {
  const finalOtp = otp.join('');
  if (finalOtp.length !== OTP_LENGTH) return;

  await login('dummy_token', email);

  
};


  /* ---------------- AUTO SUBMIT ---------------- */
  useEffect(() => {
    if (otp.join('').length === OTP_LENGTH) {
      handleVerifyOtp();
    }
  }, [otp]);

  /* ---------------- INPUT HANDLER ---------------- */
  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  /* ---------------- RESEND ---------------- */
  const handleResend = () => {
    setOtp(Array(OTP_LENGTH).fill(''));
    setTimer(RESEND_TIME);
    inputsRef.current[0]?.focus();
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>
        Sent to {maskEmail(email)}
      </Text>

      <View style={styles.otpRow}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
ref={(ref) => { inputsRef.current[index] = ref; }}       
     value={digit}
            onChangeText={value => handleChange(value, index)}
            onKeyPress={({ nativeEvent }) =>
              handleKeyPress(nativeEvent.key, index)
            }
            keyboardType="number-pad"
            maxLength={1}
            style={styles.otpBox}
          />
        ))}
      </View>

      {/* SUBMIT BUTTON */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          !isOtpComplete && styles.submitDisabled,
        ]}
        disabled={!isOtpComplete}
        onPress={handleVerifyOtp}
      >
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>

      {/* RESEND */}
      {timer > 0 ? (
        <Text style={styles.timerText}>
          Resend OTP in {timer}s
        </Text>
      ) : (
        <TouchableOpacity onPress={handleResend}>
          <Text style={styles.resendText}>Resend OTP</Text>
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
    backgroundColor: '#000',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#aaa',
    textAlign: 'center',
    marginVertical: 20,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 30,
  },
  otpBox: {
    width: 45,
    height: 55,
    backgroundColor: '#111',
    color: '#fff',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
  },
  timerText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
  resendText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 10,
  },
  submitDisabled: {
    backgroundColor: '#555',
  },
  submitText: {
    color: '#000',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
});
