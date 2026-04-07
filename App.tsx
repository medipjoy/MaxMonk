import React, { useEffect, useState } from 'react';
import { View, useColorScheme } from 'react-native';
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
import { ClarityApp } from './src/clearday/ClarityApp';

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

  return (
    <SafeAreaProvider>
      <ClarityApp
        systemScheme={systemColorScheme === 'light' || systemColorScheme === 'dark' ? systemColorScheme : null}
      />
    </SafeAreaProvider>
  );
}
