import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MatrixScreen } from './src/screens/MatrixScreen';
import { AgendaScreen } from './src/screens/AgendaScreen';
import { StatsScreen } from './src/screens/StatsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#fff',
              borderTopColor: '#e5e7eb',
              height: Platform.OS === 'ios' ? 88 : 64,
              paddingBottom: Platform.OS === 'ios' ? 28 : 8,
              paddingTop: 8,
            },
            tabBarActiveTintColor: '#1a1a2e',
            tabBarInactiveTintColor: '#9ca3af',
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          }}
        >
          <Tab.Screen
            name="Matrix"
            component={MatrixScreen}
            options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🗓</Text>, tabBarLabel: 'Matrix' }}
          />
          <Tab.Screen
            name="Agenda"
            component={AgendaScreen}
            options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📅</Text>, tabBarLabel: 'Agenda' }}
          />
          <Tab.Screen
            name="Stats"
            component={StatsScreen}
            options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📊</Text>, tabBarLabel: 'Stats' }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
