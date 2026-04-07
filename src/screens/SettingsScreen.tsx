import React from 'react';
import { View, SafeAreaView, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { useNavigation } from '../clearday/navigation';
import { resolveTheme, ThemeMode } from '../clearday/theme';
import Svg, { Line } from 'react-native-svg';

interface SettingsScreenProps {
  themeMode: ThemeMode;
  systemScheme: 'light' | 'dark' | null;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ themeMode, systemScheme }) => {
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
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 12,
      color: tokens.textGhost,
      letterSpacing: 0.05,
      marginBottom: 12,
      fontWeight: '600',
    },
    item: {
      paddingVertical: 12,
      borderBottomColor: tokens.border,
      borderBottomWidth: 0.5,
    },
    itemText: {
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

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APPEARANCE</Text>
          <View style={styles.item}>
            <Text style={styles.itemText}>Theme Mode (Section 9.1)</Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.itemText}>Font Choice</Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.itemText}>Matrix Style</Text>
          </View>
        </View>

        {/* Today's Focus Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TODAY'S FOCUS</Text>
          <View style={styles.item}>
            <Text style={styles.itemText}>MIT Reset Hour (Section 9.2)</Text>
          </View>
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CATEGORIES</Text>
          <View style={styles.item}>
            <Text style={styles.itemText}>Manage Tags (Section 9.3)</Text>
          </View>
        </View>

        {/* Manage Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MANAGE</Text>
          <View style={styles.item}>
            <Text style={styles.itemText}>Export Data</Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.itemText}>Clear All</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
