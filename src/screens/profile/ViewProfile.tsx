import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';

const ViewProfile = () => {
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);

if (!user) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Loading profile…</Text>
    </View>
  );
}

  return (
    <ScrollView style={styles.container}>
      {/* TOP PROFILE CARD */}
      <View style={styles.profileCard}>
        <Image
          source={
            user.photo
              ? { uri: user.photo }
              : require('../../assets/images/pegion.png')
          }
          style={styles.avatar}
        />

        <View style={styles.info}>
          <Text style={styles.name}>
            {user.name || 'Your Name'}
          </Text>

          <Text style={styles.email}>
            {user.email}
          </Text>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() =>
              navigation.navigate('Profile', {
                screen: 'EditProfile',
                params: { mode: 'edit' },
              })
            }
          >
            <Text style={styles.editText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* OPTIONS LIST */}
      <View style={styles.list}>
        <ProfileRow
          label="About"
          value={user.bio || 'No bio added'}
        />

        <ProfileRow
          label="Phone"
          value={user.phone || 'Not added'}
        />

        <ProfileRow
          label="Username"
          value={`@${user.name?.toLowerCase().replace(/\s/g, '')}`}
        />
      </View>
    </ScrollView>
  );
};

export default ViewProfile;

/* ---------- REUSABLE ROW ---------- */

const ProfileRow = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  profileCard: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#eee',
  },

  info: {
    marginLeft: 16,
    flex: 1,
  },

  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },

  email: {
    color: '#666',
    marginTop: 2,
    marginBottom: 8,
  },

  editBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#1976D2',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },

  editText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },

  list: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },

  row: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  rowLabel: {
    fontSize: 13,
    color: '#777',
  },

  rowValue: {
    fontSize: 16,
    color: '#111',
    marginTop: 4,
  },
  emptyContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#fff',
},
emptyText: {
  color: '#777',
  fontSize: 16,
},

});
