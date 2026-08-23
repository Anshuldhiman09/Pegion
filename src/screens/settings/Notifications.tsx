import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme, getNeumorphicStyles } from '../../theme';

const Notifications = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const neu = getNeumorphicStyles(isDark);

  const [messageAlerts, setMessageAlerts] = useState(true);
  const [callAlerts, setCallAlerts] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrate, setVibrate] = useState(true);
  const [preview, setPreview] = useState(true);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, neu.circleButton(38, { depth: 'low' })]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>MESSAGES</Text>
        <View style={[styles.card, neu.cardElevated({ radius: 20, depth: 'low' })]}>
          <View style={[styles.item, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider }]}>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemTitle, { color: colors.text }]}>Show Notifications</Text>
              <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>Receive alerts for new incoming messages</Text>
            </View>
            <Switch
              value={messageAlerts}
              onValueChange={setMessageAlerts}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={[styles.item, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider }]}>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemTitle, { color: colors.text }]}>Message Preview</Text>
              <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>Preview message text inside notifications</Text>
            </View>
            <Switch
              value={preview}
              onValueChange={setPreview}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.item}>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemTitle, { color: colors.text }]}>Sound</Text>
              <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>Play alert sound on new messages</Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CALLS & VIBRATION</Text>
        <View style={[styles.card, neu.cardElevated({ radius: 20, depth: 'low' })]}>
          <View style={[styles.item, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider }]}>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemTitle, { color: colors.text }]}>Call Notifications</Text>
              <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>Alerts for incoming voice and video calls</Text>
            </View>
            <Switch
              value={callAlerts}
              onValueChange={setCallAlerts}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.item}>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemTitle, { color: colors.text }]}>Vibrate</Text>
              <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>Vibrate on incoming alerts</Text>
            </View>
            <Switch
              value={vibrate}
              onValueChange={setVibrate}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Notifications;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  placeholder: { width: 38 },
  content: {
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  itemInfo: { flex: 1, marginRight: 12 },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemDesc: {
    fontSize: 12,
  },
});
