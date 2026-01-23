import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/Header';

const dummyStatus = [
  { id: '1', name: 'My Status', time: 'Tap to add status' },
  { id: '2', name: 'Rahul', time: '10 minutes ago' },
  { id: '3', name: 'Ankit', time: 'Today, 9:30 AM' },
];

const StatusHome = () => {
  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.statusItem}>
      <View style={styles.avatar} />
      <View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Status" />

      <FlatList
        data={dummyStatus}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />

      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default StatusHome;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ddd',
    marginRight: 14,
  },
  name: { fontSize: 17, fontWeight: '600', color: '#000' },
  time: { fontSize: 14, color: '#666', marginTop: 2 },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#799e9e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: { fontSize: 28, color: '#fff' },
});
