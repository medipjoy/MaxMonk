import React, { useEffect, useRef } from 'react';
import { View, TouchableWithoutFeedback, Animated, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '../clearday/navigation';
import { lightTokens, darkTokens, ThemeMode } from '../clearday/theme';
import { resolveTheme } from '../clearday/theme';
import { createCrosshair, createListIcon, createDotsIcon } from '../clearday/scale';
import { SvgXml } from 'react-native-svg';

interface FloatingPillProps {
  themeMode: ThemeMode;
  systemScheme: 'light' | 'dark' | null;
  visible: boolean;
  onTouchStart?: () => void;
}

export const FloatingPill: React.FC<FloatingPillProps> = ({
  themeMode,
  systemScheme,
  visible,
  onTouchStart,
}) => {
  const insets = useSafeAreaInsets();
  const { currentScreen, goToMatrix, goToActive, openPanel } = useNavigation();
  const opacityRef = useRef(new Animated.Value(visible ? 1 : 0));
  const fadeOutTimerRef = useRef<NodeJS.Timeout | null>(null);

  const tokens = resolveTheme(themeMode, systemScheme);
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');

  useEffect(() => {
    if (visible) {
      Animated.timing(opacityRef.current, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Reset fade-out timer
      if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current);
      fadeOutTimerRef.current = setTimeout(() => {
        Animated.timing(opacityRef.current, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }, 2500);
    }

    return () => {
      if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current);
    };
  }, [visible]);

  const handleIconPress = (action: () => void) => {
    if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current);
    if (onTouchStart) onTouchStart();
    action();
  };

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 18 + insets.bottom,
      alignSelf: 'center',
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(9,11,17,0.92)' : 'rgba(248,246,242,0.94)',
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.13)',
      borderWidth: isDark ? 1 : 0.5,
      borderRadius: 28,
      paddingVertical: 9,
      paddingHorizontal: 20,
      gap: 20,
    },
    iconButton: {
      width: 28,
      height: 28,
      justifyContent: 'center',
      alignItems: 'center',
    },
    activeIndicator: {
      position: 'absolute',
      top: -8,
      width: 16,
      height: 2,
      backgroundColor: tokens.accent,
      borderRadius: 1,
    },
  });

  const crosshairSvg = createCrosshair(14, 2, tokens.textGhost);
  const listSvg = createListIcon(14, 1.5, tokens.textGhost);
  const dotsSvg = createDotsIcon(14, 1.5, tokens.textGhost);

  const crosshairActiveSvg = createCrosshair(14, 2, tokens.accent);
  const listActiveSvg = createListIcon(14, 1.5, tokens.accent);
  const dotsActiveSvg = createDotsIcon(14, 1.5, tokens.accent);

  return (
    <Animated.View style={[styles.container, { opacity: opacityRef.current }]}>
      <TouchableWithoutFeedback onPress={() => onTouchStart?.()}>
        <View style={styles.pill}>
          {/* Crosshair - Matrix */}
          <TouchableWithoutFeedback onPress={() => handleIconPress(goToMatrix)}>
            <View style={styles.iconButton}>
              <SvgXml
                xml={currentScreen === 'matrix' ? crosshairActiveSvg : crosshairSvg}
                width={14}
                height={14}
              />
              {currentScreen === 'matrix' && <View style={styles.activeIndicator} />}
            </View>
          </TouchableWithoutFeedback>

          {/* List - Active */}
          <TouchableWithoutFeedback onPress={() => handleIconPress(goToActive)}>
            <View style={styles.iconButton}>
              <SvgXml
                xml={currentScreen === 'active' ? listActiveSvg : listSvg}
                width={14}
                height={14}
              />
              {currentScreen === 'active' && <View style={styles.activeIndicator} />}
            </View>
          </TouchableWithoutFeedback>

          {/* Dots - More */}
          <TouchableWithoutFeedback onPress={() => handleIconPress(() => openPanel('pulse'))}>
            <View style={styles.iconButton}>
              <SvgXml
                xml={currentScreen === 'more' ? dotsActiveSvg : dotsSvg}
                width={14}
                height={14}
              />
              {currentScreen === 'more' && <View style={styles.activeIndicator} />}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};
