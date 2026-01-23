import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/Header';

const dummyCalls = [
  {
    id: '1',
    name: 'Rahul',
    type: 'voice',
    time: 'Today, 10:30 AM',
    direction: 'incoming',
  },
  {
    id: '2',
    name: 'Ankit',
    type: 'video',
    time: 'Yesterday, 8:15 PM',
    direction: 'outgoing',
  },
];

const CallsHome = () => {
  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.callItem}>
      <View style={styles.avatar} />

      <View style={styles.callInfo}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>
          {item.direction === 'incoming' ? '⬇ ' : '⬆ '}
          {item.time}
        </Text>
      </View>

      <Text style={styles.callType}>
        {item.type === 'voice' ? '📞' : '🎥'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Calls" />

      <FlatList
        data={dummyCalls}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />

      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>📞</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default CallsHome;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  callItem: {
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
  callInfo: { flex: 1 },
  name: { fontSize: 17, fontWeight: '600' },
  meta: { fontSize: 14, color: '#666' },
  callType: { fontSize: 22 },

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
  fabText: { fontSize: 22, color: '#fff' },
});
