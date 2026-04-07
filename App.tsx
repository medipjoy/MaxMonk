import React, { useEffect, useState } from 'react';
import { View, Text, useColorScheme, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_700Bold_Italic,
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';
import {
  LibreBaskerville_400Regular,
  LibreBaskerville_700Bold_Italic,
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
// @ts-ignore - Web builds skip this
import { useClearDayStore } from './src/clearday/store';
import { ClarityApp } from './src/clearday/ClarityApp';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const systemColorScheme = useColorScheme();
  const [appReady, setAppReady] = useState(false);
  const { config, ready: storeReady, bootstrap } = useClearDayStore();

  const [fontsLoaded] = useFonts({
    Cormorant_Garamond_400Regular: CormorantGaramond_400Regular,
    Cormorant_Garamond_400Italic: CormorantGaramond_700Bold_Italic,
    Cormorant_Garamond_600SemiBold: CormorantGaramond_600SemiBold,
    LibreBaskerville_400Regular,
    LibreBaskerville_400Italic: LibreBaskerville_700Bold_Italic,
    LibreBaskerville_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });

  useEffect(() => {
    bootstrap();
  }, []);

  useEffect(() => {
    if (fontsLoaded && storeReady) {
      setAppReady(true);
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, storeReady]);

  if (!appReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ClarityApp
        themeMode={config.themeMode}
        systemScheme={systemColorScheme === 'light' || systemColorScheme === 'dark' ? systemColorScheme : null}
      />
    </SafeAreaProvider>
  );
}
