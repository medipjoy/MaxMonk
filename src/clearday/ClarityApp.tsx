import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  SafeAreaView,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Platform,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useClearDayStore } from './store';
import { useNavigation } from './navigation';
import { resolveTheme, ThemeMode } from './theme';
import { FloatingPill } from '../components/FloatingPill';
import { MatrixScreen } from '../screens/MatrixScreen';
import { ActiveScreen } from '../screens/ActiveScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { Dimensions } from 'react-native';

interface ClarityAppProps {
  themeMode: ThemeMode;
  systemScheme: 'light' | 'dark' | null;
}

export const ClarityApp: React.FC<ClarityAppProps> = ({ themeMode, systemScheme }) => {
  const insets = useSafeAreaInsets();
  const { currentScreen, currentPanel, back, closePanel } = useNavigation();
  const tokens = resolveTheme(themeMode, systemScheme);
  const { width } = Dimensions.get('window');
  const isWide = width >= 768;

  const [pillVisible, setPillVisible] = useState(false);
  const [mouseActive, setMouseActive] = useState(false);
  const fadeOutTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMatrixTouch = () => {
    if (Platform.OS === 'web') return; // Web uses mouse enter/leave
    setPillVisible(true);

    if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current);
    fadeOutTimerRef.current = setTimeout(() => {
      setPillVisible(false);
    }, 2500);
  };

  const handleMouseEnter = () => {
    if (Platform.OS !== 'web') return;
    setMouseActive(true);
    if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current);
  };

  const handleMouseLeave = () => {
    if (Platform.OS !== 'web') return;
    if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current);
    fadeOutTimerRef.current = setTimeout(() => {
      setMouseActive(false);
    }, 2500);
  };

  const styles = StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    safeContainer: {
      flex: 1,
    },
    content: {
      flex: 1,
    },
    matrixContainer: {
      flex: 1,
    },
    sidebar: {
      width: 220,
      backgroundColor: tokens.surface,
      borderRightColor: tokens.border,
      borderRightWidth: 1,
    },
    mainContent: {
      flex: 1,
    },
    layoutRow: {
      flexDirection: 'row',
      flex: 1,
    },
  });

  const renderScreen = () => {
    switch (currentScreen) {
      case 'matrix':
        return <MatrixScreen themeMode={themeMode} systemScheme={systemScheme} />;
      case 'active':
        return <ActiveScreen themeMode={themeMode} systemScheme={systemScheme} />;
      case 'more':
        // More screen placeholder
        return (
          <SafeAreaView style={styles.safeContainer}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text>More Screen (Section 3.3)</Text>
            </View>
          </SafeAreaView>
        );
      default:
        return <MatrixScreen themeMode={themeMode} systemScheme={systemScheme} />;
    }
  };

  const renderPanel = () => {
    if (!currentPanel) return null;

    const panelStyles = StyleSheet.create({
      modalOverlay: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: tokens.overlay,
      },
      sheet: {
        position: 'absolute' as const,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: tokens.surface,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 16,
        minHeight: 200,
      },
    });

    return (
      <TouchableWithoutFeedback onPress={() => closePanel?.()}>
        <View style={panelStyles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={panelStyles.sheet}>
              <Text style={{ color: tokens.text, fontSize: 16, fontWeight: '600' }}>
                {currentPanel === 'settings' && 'Settings'}
                {currentPanel === 'add' && 'Add Agenda'}
                {currentPanel === 'detail' && 'Edit Agenda'}
                {currentPanel === 'sparks' && 'Sparks'}
                {!['settings', 'add', 'detail', 'sparks'].includes(currentPanel) && currentPanel}
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const renderContent = () => {
    if (isWide) {
      // Tablet/Web layout with sidebar
      return (
        <View style={styles.layoutRow}>
          <View style={styles.sidebar}>
            {/* Sidebar navigation */}
          </View>
          <View style={styles.mainContent}>
            {renderScreen()}
            {!isWide && currentPanel === null && (
              <FloatingPill
                themeMode={themeMode}
                systemScheme={systemScheme}
                visible={pillVisible || mouseActive}
                onTouchStart={handleMatrixTouch}
              />
            )}
          </View>
        </View>
      );
    } else {
      // Mobile layout
      return (
        <View style={styles.content}>
          {renderScreen()}
          {currentPanel === null && (
            <FloatingPill
              themeMode={themeMode}
              systemScheme={systemScheme}
              visible={pillVisible || mouseActive}
              onTouchStart={handleMatrixTouch}
            />
          )}
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>{renderContent()}</View>
    </SafeAreaView>
  );
};
