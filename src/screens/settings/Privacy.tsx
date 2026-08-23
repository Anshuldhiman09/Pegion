import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme, getNeumorphicStyles } from '../../theme';

const Privacy = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const neu = getNeumorphicStyles(isDark);

  const [readReceipts, setReadReceipts] = useState(true);

  const privacyItems = [
    { title: 'Last Seen & Online', value: 'Everyone' },
    { title: 'Profile Photo', value: 'My Contacts' },
    { title: 'About', value: 'Everyone' },
    { title: 'Status', value: 'My Contacts' },
    { title: 'Blocked Contacts', value: '0' },
  ];

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>WHO CAN SEE MY PERSONAL INFO</Text>
        <View style={[styles.card, neu.cardElevated({ radius: 20, depth: 'low' })]}>
          {privacyItems.map((item, index) => (
            <TouchableOpacity
              key={item.title}
              style={[
                styles.item,
                index < privacyItems.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
              <View style={styles.rightSection}>
                <Text style={[styles.itemValue, { color: colors.textSecondary }]}>{item.value}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>MESSAGING</Text>
        <View style={[styles.card, neu.cardElevated({ radius: 20, depth: 'low' })]}>
          <View style={styles.item}>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemTitle, { color: colors.text }]}>Read Receipts</Text>
              <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>If turned off, you won't send or receive read receipts</Text>
            </View>
            <Switch
              value={readReceipts}
              onValueChange={setReadReceipts}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Privacy;

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
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemValue: {
    fontSize: 14,
  },
});

