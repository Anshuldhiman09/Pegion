import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme, getNeumorphicStyles } from '../../theme';

const AccountSettings = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const neu = getNeumorphicStyles(isDark);

  const options = [
    { icon: 'mail-outline', title: 'Email Address', desc: 'Manage your linked email' },
    { icon: 'shield-checkmark-outline', title: 'Two-Step Verification', desc: 'Add an extra layer of security' },
    { icon: 'phone-portrait-outline', title: 'Change Phone Number', desc: 'Transfer account to a new number' },
    { icon: 'download-outline', title: 'Request Account Info', desc: 'Download a report of your account data' },
    { icon: 'trash-outline', title: 'Delete Account', desc: 'Permanently delete your account and data', danger: true },
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Account</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, neu.cardElevated({ radius: 20, depth: 'low' })]}>
          {options.map((item, index) => (
            <TouchableOpacity
              key={item.title}
              style={[
                styles.item,
                index < options.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
              ]}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconWrap,
                  neu.circleButton(38, { depth: 'low' }),
                  {
                    backgroundColor: item.danger
                      ? 'rgba(239, 68, 68, 0.12)'
                      : (isDark ? '#22262d' : '#f0f2f5'),
                  },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={19}
                  color={item.danger ? colors.danger : colors.text}
                />
              </View>
              <View style={styles.itemInfo}>
                <Text
                  style={[
                    styles.itemTitle,
                    { color: item.danger ? colors.danger : colors.text },
                  ]}
                >
                  {item.title}
                </Text>
                <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>
                  {item.desc}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AccountSettings;

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
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconWrap: {
    marginRight: 14,
  },
  itemInfo: { flex: 1 },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemDesc: {
    fontSize: 12,
  },
});

