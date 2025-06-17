import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { useFrameworkReady } from '@/hooks/useFrameworkReady'
import { initSentry, SentryErrorBoundary } from '@/lib/sentry';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

// Initialize Sentry as early as possible
initSentry();

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
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
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="activities" />
          <Stack.Screen name="premium" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SentryErrorBoundary
      fallback={({ error, resetError }) => (
        <div style={{ 
          padding: 20, 
          textAlign: 'center',
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h1>Something went wrong</h1>
          <p>We're sorry, but something unexpected happened.</p>
          <details style={{ marginTop: 10, marginBottom: 20 }}>
            <summary>Error details</summary>
            <pre style={{ textAlign: 'left', fontSize: 12, marginTop: 10 }}>
              {error?.toString()}
            </pre>
          </details>
          <button 
            onClick={resetError}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer'
            }}
          >
            Try again
          </button>
        </div>
      )}
    >
      <RootLayoutContent />
    </SentryErrorBoundary>
  );
}