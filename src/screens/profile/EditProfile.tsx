import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import { launchImageLibrary } from 'react-native-image-picker';

const EditProfile = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const mode: 'setup' | 'edit' = route.params?.mode ?? 'edit';

  const { user, updateProfile } = useContext(AuthContext);

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
      navigation.replace('HomeTabs');
    } else {
      await updateProfile({ name, phone, bio, gender, photo });
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={openGallery} style={styles.avatarWrapper}>
        <Image
          source={photo ? { uri: photo } : require('../../assets/images/pegion.png')}
          style={styles.avatar}
        />
        {mode === 'edit' && <Text style={styles.editText}>Edit</Text>}
      </TouchableOpacity>

      <Text style={styles.title}>
        {mode === 'setup' ? 'Setup Profile' : 'Edit Profile'}
      </Text>

      <TextInput
        placeholder="Your Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      {mode === 'edit' && user && (
        <TextInput
          value={user.email}
          editable={false}
          style={[styles.input, { opacity: 0.6 }]}
        />
      )}

      {mode === 'edit' && (
        <>
          <TextInput
            placeholder="Phone"
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
          />
          <TextInput
            placeholder="Bio"
            value={bio}
            onChangeText={setBio}
            style={styles.input}
          />
          <TextInput
            placeholder="Gender"
            value={gender}
            onChangeText={setGender}
            style={styles.input}
          />
        </>
      )}

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>
          {mode === 'setup' ? 'Continue' : 'Save Changes'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 24, justifyContent: 'center' },
  title: { color: '#fff', fontSize: 26, textAlign: 'center', marginBottom: 25 },
  input: { backgroundColor: '#111', color: '#fff', padding: 14, borderRadius: 8, marginBottom: 15 },
  button: { backgroundColor: '#fff', padding: 15, borderRadius: 8 },
  buttonText: { textAlign: 'center', fontWeight: '700', color: '#000' },
  avatarWrapper: { alignSelf: 'center', marginBottom: 20, alignItems: 'center' },
  avatar: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#111' },
  editText: { color: '#aaa', marginTop: 8, fontSize: 12 },
});
