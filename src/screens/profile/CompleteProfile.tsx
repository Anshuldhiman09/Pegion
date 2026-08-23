import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import { userService, uploadService } from '../../api';
import DatePickerModal from '../../components/DatePickerModal';
import { useTheme, getNeumorphicStyles } from '../../theme';
import Ionicons from 'react-native-vector-icons/Ionicons';

const CompleteProfile = ({ navigation }: any) => {
  const { updateProfile } = useContext(AuthContext);
  const { colors, isDark } = useTheme();
  const neu = getNeumorphicStyles(isDark);
  const defaultUser = require('../../assets/icons/user.png');

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [gender, setGender] = useState('');
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [photo, setPhoto] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const pickImage = async () => {
    try {
      const result: any = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
        selectionLimit: 1,
      });

      if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
        const image = result.assets[0];

        // Optimistic instant UI preview
        setPhoto(image.uri);
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
    } catch (err: any) {
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
    setLoading(true);

    try {
      const formattedDob = dob?.toISOString().split('T')[0];

      const payload = {
        name,
        dateOfBirth: formattedDob,
        gender,
        description: bio,
      };

      const result = await userService.setupProfile(payload);

      if (result.success) {
        updateProfile({
          name,
          bio,
          dob: formattedDob,
          gender,
        });

        Toast.show({
          type: 'success',
          text1: 'Profile Saved',
        });

        navigation.replace('Main');
      } else {
        Toast.show({
          type: 'error',
          text1: result.statusMsg || 'Failed to save profile',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.message || 'Something went wrong',
      });
    } finally {
      setLoading(false);
    }
  };

  const Skip = () => {
    navigation.replace('Main');
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: colors.background },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[styles.skipBtn, neu.circleButton(40, { depth: 'low' }), { width: 'auto', paddingHorizontal: 16, borderRadius: 20 }]}
            onPress={Skip}
            disabled={loading}
          >
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, neu.circleButton(40, { depth: 'high' }), { width: 'auto', paddingHorizontal: 20, borderRadius: 20, backgroundColor: colors.primary }]}
            onPress={saveProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          Complete Profile
        </Text>

        <View style={styles.imageContainer}>
          <TouchableOpacity onPress={pickImage} disabled={loading}>
            <View style={[styles.imageWrapper, neu.sunkenWell(116)]}>
              <Image
                source={photo ? { uri: photo } : defaultUser}
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

        {/* Name Input */}
        <View style={[styles.neuInputWrap, neu.fieldSunken({ radius: 18 })]}>
          <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
          <TextInput
            placeholder="Full Name"
            value={name}
            editable={!loading}
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
          onPress={() => setShowDate(true)}
          disabled={loading}
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
          visible={showDate}
          value={dob}
          onClose={() => setShowDate(false)}
          onConfirm={selected => setDob(selected)}
        />

        {/* Gender Dropdown */}
        <View style={styles.genderWrapper}>
          <TouchableOpacity
            style={[styles.neuInputWrap, neu.fieldSunken({ radius: 18 })]}
            onPress={() => setShowGenderDropdown(!showGenderDropdown)}
            disabled={loading}
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
              name={showGenderDropdown ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textMuted}
              style={{ marginLeft: 'auto' }}
            />
          </TouchableOpacity>

          {showGenderDropdown && (
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
                    setShowGenderDropdown(false);
                  }}
                  style={styles.dropdownItem}
                >
                  <Text style={[styles.dropdownText, { color: colors.text, fontWeight: gender === item ? '700' : '400' }]}>{item}</Text>
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
            editable={!loading}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor={colors.placeholderText}
            style={[
              styles.neuBioInput,
              { color: colors.text },
            ]}
          />
        </View>
      </ScrollView>

      {loading && (
        <View style={styles.loaderContainer}>
          <View
            style={[
              styles.blurView,
              {
                backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)',
              },
            ]}
          />
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
};

export default CompleteProfile;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  skipBtn: {
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

  skipText: {
    fontSize: 15,
    fontWeight: '600',
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

  dropdownText: {
    fontSize: 15,
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

  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },

  blurView: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
});
