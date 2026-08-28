import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { CallProvider } from './src/context/CallContext';
import { CallModal } from './src/components/calls/CallModal';
import { ThemeProvider, useTheme } from './src/theme';
import Toast from 'react-native-toast-message';
import { getToastConfig } from './src/components/ToastConfig';

const AppContent = () => {
  const { colors, isDark } = useTheme();

  const navTheme = React.useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        primary: colors.primary,
      },
    }),
    [colors, isDark],
  );

  const toastConf = React.useMemo(
    () => getToastConfig(colors, isDark),
    [colors, isDark],
  );

  return (
    <>
      <StatusBar
        backgroundColor={colors.statusBg}
        barStyle={colors.statusBar}
      />
      <NavigationContainer theme={navTheme}>
        <AppNavigator />
        <CallModal />
        <Toast config={toastConf} />
      </NavigationContainer>
    </>
  );
};


const App = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <CallProvider>
            <AppContent />
          </CallProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;

