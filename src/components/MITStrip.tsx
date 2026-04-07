import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemeTokens, FontChoice } from '../clearday/theme';
import { getFontSet } from '../clearday/fonts';
import { moderateScale } from '../clearday/scale';
import Svg, { Circle } from 'react-native-svg';

interface MITStripProps {
  tokens: ThemeTokens;
  fontChoice: FontChoice;
  mitText: string;
  onPress: () => void;
}

export const MITStrip: React.FC<MITStripProps> = ({
  tokens,
  fontChoice,
  mitText,
  onPress,
}) => {
  const fonts = getFontSet(fontChoice);

  const styles = StyleSheet.create({
    container: {
      height: 24,
      borderBottomColor: tokens.border,
      borderBottomWidth: 0.5,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: moderateScale(10),
    },
    icon: {
      marginRight: 8,
    },
    text: {
      flex: 1,
      fontFamily: fonts.serifItalic,
      fontSize: moderateScale(mitText ? 10.5 : 10),
      color: mitText ? tokens.text : tokens.textGhost,
    },
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.container, { backgroundColor: tokens.surface }]}>
        {/* Target icon (simplified - three concentric circles) */}
        <View style={styles.icon}>
          <Svg width={14} height={14} viewBox="0 0 14 14">
            <Circle cx="7" cy="7" r="6" stroke={tokens.gold} strokeWidth="1" fill="none" />
            <Circle cx="7" cy="7" r="3.5" stroke={tokens.gold} strokeWidth="0.75" fill="none" />
            <Circle cx="7" cy="7" r="1.5" fill={tokens.gold} />
          </Svg>
        </View>

        <Text style={styles.text} numberOfLines={1}>
          {mitText || "Today's #1"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
