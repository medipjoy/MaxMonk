import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { ThemeTokens } from '../clearday/theme';
import { getFontSet } from '../clearday/fonts';
import { moderateScale } from '../clearday/scale';

interface Props {
  tokens: ThemeTokens;
  fontChoice: string;
  message: string;
  visible: boolean;
  bottomOffset: number;
}

export function Toast({ tokens, fontChoice, message, visible, bottomOffset }: Props) {
  const fonts = getFontSet(fontChoice as any);
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
        backgroundColor: tokens.surface2,
        borderColor: tokens.borderMid,
        bottom: 18 + bottomOffset + 48, // above pill
        opacity,
      }]}
      pointerEvents="none"
    >
      <Text style={{ fontFamily: fonts.serifItalic, fontSize: moderateScale(11), color: tokens.text, textAlign: 'center' }}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    borderWidth: 0.5,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    maxWidth: 320,
    width: '80%',
  },
});
