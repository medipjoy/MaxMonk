import React from 'react';
import { View, SafeAreaView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '../clearday/navigation';
import { resolveTheme, ThemeMode } from '../clearday/theme';
import Svg, { Line } from 'react-native-svg';

interface ActiveScreenProps {
  themeMode: ThemeMode;
  systemScheme: 'light' | 'dark' | null;
}

export const ActiveScreen: React.FC<ActiveScreenProps> = ({ themeMode, systemScheme }) => {
  const tokens = resolveTheme(themeMode, systemScheme);
  const { back } = useNavigation();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    header: {
      height: 44,
      borderBottomColor: tokens.border,
      borderBottomWidth: 0.5,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    backButton: {
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      fontSize: 14,
      color: tokens.text,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={back}>
          <Svg width={14} height={14} viewBox="0 0 14 14">
            <Line x1="10" y1="2" x2="4" y2="7" stroke={tokens.accent} strokeWidth="1.5" />
            <Line x1="4" y1="7" x2="10" y2="12" stroke={tokens.accent} strokeWidth="1.5" />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Content placeholder */}
      <View style={styles.content}>
        <Text style={styles.text}>Active List (Section 8)</Text>
      </View>
    </SafeAreaView>
  );
};
