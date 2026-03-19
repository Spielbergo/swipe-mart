import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { AppProvider, useApp } from '../context/AppContext';

// Auth guard – redirect unauthenticated users to /auth
function AuthGuard() {
  const { user, loadingAuth } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loadingAuth) return;
    const inAuthGroup = segments[0] === 'auth';
    if (!user && !inAuthGroup) {
      router.replace('/auth');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loadingAuth, segments]);

  return null;
}

// Holds the Stack behind a loading screen until auth state is known.
// Prevents the white-screen flash on reload.
function AppShell() {
  const { loadingAuth } = useApp();

  if (loadingAuth) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <>
      <AuthGuard />
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppProvider>
          <AppShell />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: {
    flex: 1,
    backgroundColor: '#F4F5FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
