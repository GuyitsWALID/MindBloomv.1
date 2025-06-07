import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { PaymentProvider } from '@/contexts/PaymentContext'
import { SubscriptionProvider } from '@/contexts/SubscriptionContext'
import { useFrameworkReady } from '@/hooks/useFrameworkReady'

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      // Call framework ready after fonts are loaded and splash screen is hidden
      window.frameworkReady?.();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <PaymentProvider>
          <SubscriptionProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="activities" />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </SubscriptionProvider>
        </PaymentProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}