import React from 'react';
import { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';
import { ThemeColors } from '../theme/colors';

export const getToastConfig = (colors?: ThemeColors, isDark?: boolean) => ({
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#4CAF50',
        backgroundColor: isDark ? '#1a2e1d' : '#E8F5E9',
        height: 'auto',
        width: '85%',
        borderRadius: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(76, 175, 80, 0.25)' : 'rgba(76, 175, 80, 0.15)',
      }}
      text1NumberOfLines={0}
      text2NumberOfLines={0}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: '700',
        color: isDark ? '#81c784' : '#2E7D32',
        flexWrap: 'wrap',
      }}
      text2Style={{
        fontSize: 13,
        color: isDark ? '#c8e6c9' : '#1B5E20',
        flexWrap: 'wrap',
      }}
    />
  ),

  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#ef4444',
        backgroundColor: isDark ? '#2e1919' : '#FFEBEE',
        height: 'auto',
        width: '85%',
        borderRadius: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.15)',
      }}
      text1NumberOfLines={0}
      text2NumberOfLines={0}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: '700',
        color: isDark ? '#f87171' : '#B71C1C',
        flexWrap: 'wrap',
      }}
      text2Style={{
        fontSize: 13,
        color: isDark ? '#fecaca' : '#7F0000',
        flexWrap: 'wrap',
      }}
    />
  ),

  info: (props: any) => (
    <InfoToast
      {...props}
      style={{
        borderLeftColor: '#3b82f6',
        backgroundColor: isDark ? '#192438' : '#EFF6FF',
        height: 'auto',
        width: '85%',
        borderRadius: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.15)',
      }}
      text1NumberOfLines={0}
      text2NumberOfLines={0}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: '700',
        color: isDark ? '#60a5fa' : '#1D4ED8',
        flexWrap: 'wrap',
      }}
      text2Style={{
        fontSize: 13,
        color: isDark ? '#bfdbfe' : '#1E40AF',
        flexWrap: 'wrap',
      }}
    />
  ),
});

export const toastConfig = getToastConfig();
export default getToastConfig;


