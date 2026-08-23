import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import Toast from 'react-native-toast-message';
import { userService } from '../../api';
import { useTheme, getNeumorphicStyles } from '../../theme';
import Ionicons from 'react-native-vector-icons/Ionicons';

const SetupProfile = ({ navigation }: any) => {
  const { user, updateProfile } = useContext(AuthContext);
  const { colors, isDark } = useTheme();
  const neu = getNeumorphicStyles(isDark);

  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
  }, [user]);

  const isNewUser = !user?.isProfileSetup;

  const saveUsername = async () => {
    if (!username.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Please enter username',
        position: 'top',
      });
      return;
    }

    setLoading(true);

    try {
      const result = await userService.saveUsername(username);

      if (result.success) {
        await updateProfile({
          username: username.trim(),
          isProfileSetup: true,
        });

        Toast.show({
          type: 'success',
          text1: result.statusMsg || 'Username saved',
          position: 'top',
        });

        navigation.replace('CompleteProfile');
      } else {
        Toast.show({
          type: 'error',
          text1: result.statusMsg || 'Something went wrong',
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

  const Letsgo = () => {
    navigation.replace('Main');
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {isNewUser ? (
        <>
          <Text style={[styles.title, { color: colors.text }]}>
            Set Your Username
          </Text>

          <View style={[styles.inputWrapper, neu.fieldSunken({ radius: 18 })]}>
            <Ionicons name="at-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              placeholder="Enter Username"
              placeholderTextColor={colors.placeholderText}
              value={username}
              onChangeText={setUsername}
              editable={!loading}
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                styles.input,
                { color: colors.text },
              ]}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              neu.circleButton(52, { depth: 'high' }),
              { width: '100%', borderRadius: 26, backgroundColor: colors.primary },
            ]}
            onPress={saveUsername}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save Username</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={[styles.title, { color: colors.text }]}>
            Welcome Back 👋
          </Text>

          <Text
            style={[styles.usernameText, { color: colors.text }]}
          >
            {user?.username}
          </Text>

          <TouchableOpacity
            style={[
              styles.button,
              neu.circleButton(52, { depth: 'high' }),
              { width: '100%', borderRadius: 26, backgroundColor: colors.primary },
            ]}
            onPress={Letsgo}
          >
            <Text style={styles.buttonText}>Let's Go</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default SetupProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 28,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 24,
    minHeight: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
  },
  usernameText: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 20,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#fff',
    fontSize: 16,
  },
});

