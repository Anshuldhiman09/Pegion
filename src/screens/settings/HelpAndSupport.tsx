import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme, getNeumorphicStyles } from '../../theme';

const HelpAndSupport = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const neu = getNeumorphicStyles(isDark);

  const faqs = [
    { q: 'How do I start a chat?', a: 'Tap the Search tab or floating message button, find a user and tap Message.' },
    { q: 'Are my chats private?', a: 'Pegion ensures modern secure messaging with verified identity and direct delivery.' },
    { q: 'How do I change my theme?', a: 'Go to Settings > Preferences > App Theme and select System, Dark, or Light.' },
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>FREQUENTLY ASKED QUESTIONS</Text>
        <View style={[styles.card, neu.cardElevated({ radius: 20, depth: 'low' })]}>
          {faqs.map((item, index) => (
            <View
              key={item.q}
              style={[
                styles.faqItem,
                index < faqs.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
              ]}
            >
              <Text style={[styles.faqQuestion, { color: colors.text }]}>{item.q}</Text>
              <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{item.a}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CONTACT US</Text>
        <View style={[styles.card, neu.cardElevated({ radius: 20, depth: 'low' })]}>
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => Linking.openURL('mailto:support@pegion.app')}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconWrap,
                neu.circleButton(38, { depth: 'low' }),
                { backgroundColor: isDark ? '#22262d' : '#f0f2f5' },
              ]}
            >
              <Ionicons name="mail-outline" size={19} color={colors.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactTitle, { color: colors.text }]}>Email Support</Text>
              <Text style={[styles.contactDesc, { color: colors.textSecondary }]}>support@pegion.app</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HelpAndSupport;

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
  faqItem: {
    padding: 16,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 18,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconWrap: {
    marginRight: 14,
  },
  contactInfo: { flex: 1 },
  contactTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactDesc: {
    fontSize: 13,
  },
});

