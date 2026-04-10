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
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.delay(1600),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, message]);

  if (!message) return null;

  return (
    <Animated.View
      style={[styles.container, {
        backgroundColor: tokens.surface,
        borderColor: tokens.border,
        bottom: 24 + bottomOffset + 56,
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
