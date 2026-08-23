import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { userService, uploadService } from '../../api';
import DatePickerModal from '../../components/DatePickerModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme, getNeumorphicStyles } from '../../theme';
import FocusAwareStatusBar from '../../components/FocusAwareStatusBar';

const EditProfile = () => {
  const navigation = useNavigation<any>();
  const { user, updateProfile } = useContext(AuthContext);
  const { colors, isDark } = useTheme();
  const neu = getNeumorphicStyles(isDark);

  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [dob, setDob] = useState<Date | null>(
    user?.dob ? new Date(user.dob) : null,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState(user?.gender || '');
  const [showGender, setShowGender] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [photo, setPhoto] = useState<string | null>(
    user?.profileImageUrl || user?.photo || null,
  );

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fetchProfileInfo = useCallback(async () => {
    try {
      setLoading(true);

      const email = user?.email || (await AsyncStorage.getItem('auth_email'));
      if (!email) {
        setLoading(false);
        return;
      }

      const result = await userService.getProfileInfo(email);
      const data = result?.data;

      if (!data) {
        return;
      }

      setName(data.name || '');
      setBio(data.description || data.bio || '');
      setGender(data.gender || '');

      if (data.dateOfBirth || data.dob) {
        setDob(new Date(data.dateOfBirth || data.dob || ''));
      }

      setPhoto(data.profileImageUrl || data.photo || null);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load profile',
      });
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchProfileInfo();
  }, [fetchProfileInfo]);

  const openGallery = async () => {
    try {
      const res = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
        selectionLimit: 1,
      });

      if (res.assets?.length && res.assets[0].uri) {
        const image = res.assets[0];

        // Optimistic instant UI update
        setPhoto(image.uri || null);
        setUploadingPhoto(true);

        const imageUrl = await uploadService.uploadToCloudinary({
          uri: image.uri,
          type: image.type,
          fileName: image.fileName,
        });

        if (imageUrl) {
          setPhoto(imageUrl);
          await userService.updateProfilePhoto(imageUrl);
          updateProfile({ profileImageUrl: imageUrl });
          Toast.show({
            type: 'success',
            text1: 'Profile Photo Updated',
          });
        }
      }
    } catch (err) {
      console.log('Upload error:', err);
      Toast.show({
        type: 'error',
        text1: 'Failed to upload photo',
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const saveProfile = async () => {
    if (!name || !dob || !gender) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill all required fields',
      });
      return;
    }

    try {
      setLoading(true);
      const formattedDob = dob.toISOString().split('T')[0];

      const result = await userService.updateProfile({
        name,
        dateOfBirth: formattedDob,
        gender,
        description: bio,
      });

      if (result.success) {
        updateProfile({
          name,
          bio,
          dob: formattedDob,
          gender,
        });

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Profile updated successfully',
        });

        navigation.goBack();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.statusMsg || 'Failed to update profile',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Something went wrong',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !name) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <FocusAwareStatusBar
        backgroundColor={colors.statusBg}
        barStyle={colors.statusBar}
        translucent={false}
      />
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, neu.circleButton(40, { depth: 'low' })]}
        >
          <Ionicons
            name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.saveBtn,
            neu.circleButton(40, { depth: 'high' }),
            { width: 'auto', paddingHorizontal: 20, borderRadius: 20, backgroundColor: colors.primary },
          ]}
          onPress={saveProfile}
        >
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imageContainer}>
        <TouchableOpacity onPress={openGallery}>
          <View style={[styles.imageWrapper, neu.sunkenWell(116)]}>
            <Image
              source={
                photo ? { uri: photo } : require('../../assets/icons/user.png')
              }
              style={styles.image}
            />

            <View style={[styles.plusIcon, neu.circleButton(32, { depth: 'high' }), { backgroundColor: colors.primary }]}>
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={16} color="#fff" />
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        Edit Profile
      </Text>

      {/* Name Input */}
      <View style={[styles.neuInputWrap, neu.fieldSunken({ radius: 18 })]}>
        <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
        <TextInput
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          placeholderTextColor={colors.placeholderText}
          style={[
            styles.neuTextInput,
            { color: colors.text },
          ]}
        />
      </View>

      {/* Date of Birth Input */}
      <TouchableOpacity
        style={[styles.neuInputWrap, neu.fieldSunken({ radius: 18 })]}
        onPress={() => setShowDatePicker(true)}
      >
        <Ionicons name="calendar-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
        <Text
          style={[
            styles.neuTextValue,
            { color: dob ? colors.text : colors.placeholderText },
          ]}
        >
          {dob ? dob.toDateString() : 'Select Date of Birth'}
        </Text>
      </TouchableOpacity>

      <DatePickerModal
        visible={showDatePicker}
        value={dob}
        onClose={() => setShowDatePicker(false)}
        onConfirm={selected => setDob(selected)}
      />

      {/* Gender Dropdown */}
      <View style={styles.genderWrapper}>
        <TouchableOpacity
          style={[styles.neuInputWrap, neu.fieldSunken({ radius: 18 })]}
          onPress={() => setShowGender(!showGender)}
        >
          <Ionicons name="male-female-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
          <Text
            style={[
              styles.neuTextValue,
              { color: gender ? colors.text : colors.placeholderText },
            ]}
          >
            {gender || 'Select Gender'}
          </Text>
          <Ionicons
            name={showGender ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textMuted}
            style={{ marginLeft: 'auto' }}
          />
        </TouchableOpacity>

        {showGender && (
          <View
            style={[
              styles.dropdownList,
              neu.cardElevated({ radius: 16, depth: 'low' }),
            ]}
          >
            {['Male', 'Female', 'Other'].map(item => (
              <TouchableOpacity
                key={item}
                onPress={() => {
                  setGender(item);
                  setShowGender(false);
                }}
                style={[
                  styles.dropdownItem,
                  { borderBottomColor: colors.divider },
                ]}
              >
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: gender === item ? '700' : '400' }}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Bio Input */}
      <View style={[styles.neuInputWrap, styles.neuBioWrap, neu.fieldSunken({ radius: 18 })]}>
        <TextInput
          placeholder="Write something about yourself..."
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          placeholderTextColor={colors.placeholderText}
          style={[
            styles.neuBioInput,
            { color: colors.text },
          ]}
        />
      </View>
    </ScrollView>
  );
};

export default EditProfile;

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  backBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  saveBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  saveText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },

  title: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },

  imageWrapper: {
    position: 'relative',
  },

  image: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },

  plusIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  neuInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    minHeight: 52,
  },

  inputIcon: {
    marginRight: 12,
  },

  neuTextInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },

  neuTextValue: {
    fontSize: 15,
    flex: 1,
  },

  genderWrapper: {
    marginBottom: 0,
  },

  dropdownList: {
    marginTop: -8,
    marginBottom: 16,
    overflow: 'hidden',
  },

  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  neuBioWrap: {
    minHeight: 110,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },

  neuBioInput: {
    flex: 1,
    fontSize: 15,
    textAlignVertical: 'top',
    paddingVertical: 0,
    width: '100%',
  },
});

