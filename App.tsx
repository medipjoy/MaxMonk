import React, { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_600SemiBold_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import {
  LibreBaskerville_400Regular,
  LibreBaskerville_400Regular_Italic,
  LibreBaskerville_700Bold,
} from '@expo-google-fonts/libre-baskerville';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';
// Importing full app is currently deferred to avoid startup crashes
// import { ClarityApp } from './src/clearday/ClarityApp';
import { View, Text, StyleSheet } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const systemColorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    Cormorant_Garamond_400Regular: CormorantGaramond_400Regular,
    Cormorant_Garamond_400Italic: CormorantGaramond_400Regular_Italic,
    Cormorant_Garamond_600SemiBold: CormorantGaramond_600SemiBold,
    Cormorant_Garamond_600SemiBold_Italic: CormorantGaramond_600SemiBold_Italic,
    LibreBaskerville_400Regular,
    LibreBaskerville_400Italic: LibreBaskerville_400Regular_Italic,
    LibreBaskerville_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  // Minimal fallback UI to ensure the app launches reliably.
  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <Text style={styles.title}>Clearday — Minimal Safe Mode</Text>
        <Text style={styles.sub}>App is running. Full UI temporarily disabled for stability.</Text>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  sub: { fontSize: 13, color: '#444' },
});
