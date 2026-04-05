import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ClearDayScreen } from './src/screens/ClearDayScreen';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClearDayScreen />
    </GestureHandlerRootView>
  );
}
