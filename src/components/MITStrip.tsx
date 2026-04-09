import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { ThemeTokens } from '../clearday/theme';
import { getFontSet } from '../clearday/fonts';
import { moderateScale, fontScale } from '../clearday/scale';
import { useClearDayStore } from '../clearday/store';

interface Props {
  tokens: ThemeTokens;
  fontChoice: string;
  mitText: string;
  onPress: () => void;
}

export function MITStrip({ tokens, fontChoice, mitText, onPress }: Props) {
  const fonts = getFontSet(fontChoice as any);
  const insets = useSafeAreaInsets();
  const fontSizeMultiplier = useClearDayStore(s => s.config?.fontSizeMultiplier ?? 1.0);

  const notchPadding = insets.top > 0 ? insets.top : 0;
  const stripHeight = 24 + notchPadding;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={[
        s.container,
        {
          borderBottomColor: tokens.border,
          height: stripHeight,
          paddingTop: notchPadding,
        },
      ]}>
        {/* Target icon */}
        <View style={s.icon}>
          <Svg width={14} height={14} viewBox="0 0 14 14">
            <Circle cx="7" cy="7" r="6" stroke={tokens.gold} strokeWidth="1" fill="none" />
            <Circle cx="7" cy="7" r="3.5" stroke={tokens.gold} strokeWidth="0.75" fill="none" />
            <Circle cx="7" cy="7" r="1.5" fill={tokens.gold} />
          </Svg>
        </View>
        <Text
          style={[
            s.text,
            {
              fontFamily: fonts.serifItalic,
              fontSize: fontScale(mitText ? 10.5 : 10, fontSizeMultiplier),
              color: mitText ? tokens.text : tokens.textGhost,
            },
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {mitText || "Today's #1"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: {
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  icon: { marginRight: 8 },
  text: { flex: 1 },
});
