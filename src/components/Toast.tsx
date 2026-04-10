import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { ThemeTokens } from '../clearday/theme';
import { getFontSet } from '../clearday/fonts';
import { moderateScale, fontScale } from '../clearday/scale';
import { useClearDayStore } from '../clearday/store';

interface Props {
  tokens: ThemeTokens;
  fontChoice: string;
  message: string;
  visible: boolean;
  bottomOffset: number;
}

export function Toast({ tokens, fontChoice, message, visible, bottomOffset }: Props) {
  const fonts = getFontSet(fontChoice as any);
  const fontSizeMultiplier = useClearDayStore(s => s.config?.fontSizeMultiplier ?? 1.0);
  const matrixStyle = useClearDayStore(s => s.config?.matrixStyle ?? 'tinted');
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.delay(960),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, message]);

  if (!message) return null;

  const toastFill = matrixStyle === 'paper'
    ? tokens.surface2
    : matrixStyle === 'editorial'
      ? tokens.bg
      : tokens.surface;
  const toastBorder = matrixStyle === 'editorial' ? tokens.borderMid : tokens.border;

  return (
    <Animated.View
      style={[styles.container, {
        backgroundColor: toastFill,
        borderColor: toastBorder,
        bottom: bottomOffset + 100,
        opacity,
      }]}
      pointerEvents="none"
    >
      <Text style={{ fontFamily: fonts.serifItalic, fontSize: fontScale(11, fontSizeMultiplier), color: tokens.text, textAlign: 'center' }}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    borderWidth: 0.75,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 18,
    maxWidth: 320,
    width: '78%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
});
