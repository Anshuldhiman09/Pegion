import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  useColorScheme,
} from 'react-native';

import { useNavigation, useRoute } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import { launchImageLibrary } from 'react-native-image-picker';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EditProfile = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const mode: 'setup' | 'edit' = route.params?.mode ?? 'edit';

  const { user, updateProfile } = useContext(AuthContext);
  const isDark = useColorScheme() === 'dark';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone ?? '');
      setBio(user.bio ?? '');
      setGender(user.gender ?? '');
      setPhoto(user.photo ?? null);
    }
  }, [user]);

  const openGallery = () => {
    if (mode !== 'edit') return;
    launchImageLibrary({ mediaType: 'photo' }, res => {
      if (res.assets?.length) {
        setPhoto(res.assets[0].uri || null);
      }
    });
  };

  const handleSave = async () => {
    if (mode === 'setup') {
      await updateProfile({ name, isProfileSetup: true });
      await AsyncStorage.removeItem('profile_setup_shown');
      navigation.replace('HomeTabs');
    } else {
      await updateProfile({ name, phone, bio, gender, photo });
      navigation.goBack();
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: isDark ? '#000' : '#fff' },
      ]}
    >
      <TouchableOpacity onPress={openGallery} style={styles.avatarWrapper}>
        <Image
          source={
            photo
              ? { uri: photo }
              : require('../../assets/images/pegion.png')
          }
          style={styles.avatar}
        />
        {mode === 'edit' && (
          <Text style={styles.editText}>Edit</Text>
        )}
      </TouchableOpacity>

      <Text
        style={[
          styles.title,
          { color: isDark ? '#fff' : '#000' },
        ]}
      >
        {mode === 'setup' ? 'Setup Profile' : 'Edit Profile'}
      </Text>

      {/* Name */}
      <TextInput
        placeholder="Your Name"
        placeholderTextColor="#888"
        value={name}
        onChangeText={setName}
        style={[
          styles.input,
          { backgroundColor: isDark ? '#111' : '#f2f2f2',
            color: isDark ? '#fff' : '#000' },
        ]}
      />

      {/* Email (Read Only) */}
      {mode === 'edit' && user && (
        <TextInput
          value={user.email}
          editable={false}
          style={[
            styles.input,
            {
              backgroundColor: isDark ? '#111' : '#f2f2f2',
              color: isDark ? '#aaa' : '#555',
            },
          ]}
        />
      )}

      {mode === 'edit' && (
        <>
          {/* Phone */}
          <TextInput
            placeholder="Phone"
            placeholderTextColor="#888"
            value={phone}
            onChangeText={(text) => {
              const cleaned = text
                .replace(/[^0-9]/g, '')
                .slice(0, 10);
              setPhone(cleaned);
            }}
            keyboardType="number-pad"
            maxLength={10}
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#111' : '#f2f2f2',
                color: isDark ? '#fff' : '#000',
              },
            ]}
          />

          {/* Bio */}
          <TextInput
            placeholder="Bio"
            placeholderTextColor="#888"
            value={bio}
            onChangeText={setBio}
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#111' : '#f2f2f2',
                color: isDark ? '#fff' : '#000',
              },
            ]}
          />

          {/* Gender Dropdown */}
          <View
            style={[
              styles.pickerWrapper,
              {
                backgroundColor: isDark ? '#111' : '#f2f2f2',
              },
            ]}
          >
            <Picker
              selectedValue={gender}
              dropdownIconColor={isDark ? '#fff' : '#000'}
              onValueChange={(itemValue) =>
                setGender(itemValue)
              }
              style={{ color: isDark ? '#fff' : '#000' }}
            >
              <Picker.Item label="Select Gender" value="" />
              <Picker.Item label="Male" value="Male" />
              <Picker.Item label="Female" value="Female" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>
        </>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handleSave}
      >
        <Text style={styles.buttonText}>
          {mode === 'setup'
            ? 'Continue'
            : 'Save Changes'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },

  title: {
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 25,
    fontWeight: '700',
  },

  input: {
    padding: 14,
    borderRadius: 8,
    marginBottom: 15,
  },

  pickerWrapper: {
    borderRadius: 8,
    marginBottom: 15,
    justifyContent: 'center',
  },

  button: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 8,
  },

  buttonText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#fff',
  },

  avatarWrapper: {
    alignSelf: 'center',
    marginBottom: 20,
    alignItems: 'center',
  },

  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },

  editText: {
    color: '#888',
    marginTop: 8,
    fontSize: 12,
  },
});
