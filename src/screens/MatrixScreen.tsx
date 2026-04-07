import React, { useState } from 'react';
import {
  View,
  SafeAreaView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MITStrip } from '../components/MITStrip';
import { useClearDayStore } from '../clearday/store';
import { resolveTheme, ThemeTokens } from '../clearday/theme';
import { moderateScale } from '../clearday/scale';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

interface MatrixScreenProps {
  themeMode: any;
  systemScheme: 'light' | 'dark' | null;
}

export const MatrixScreen: React.FC<MatrixScreenProps> = ({
  themeMode,
  systemScheme,
}) => {
  const insets = useSafeAreaInsets();
  const { config, mit } = useClearDayStore();
  const tokens = resolveTheme(themeMode, systemScheme);
  const { width, height } = Dimensions.get('window');

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    container: {
      flex: 1,
    },
    mitStrip: {
      // Height 24px
    },
    filterRow: {
      height: 22,
      paddingHorizontal: 10,
      flexDirection: 'row',
      gap: 4,
      backgroundColor: tokens.bg,
    },
    matrixCanvas: {
      flex: 1,
      backgroundColor: tokens.bg,
      position: 'relative',
    },
    sparksButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 28,
      height: 28,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  const renderMatrix = () => {
    const canvasWidth = width;
    const canvasHeight = height * 0.5; // Approximate

    return (
      <Svg width={canvasWidth} height={canvasHeight} viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}>
        {/* Background */}
        <rect width={canvasWidth} height={canvasHeight} fill={tokens.bg} />

        {/* Q2 background (top-left) */}
        <rect x="0" y="0" width={canvasWidth / 2} height={canvasHeight / 2} fill={tokens.q2Wash} />

        {/* Q1 background (top-right) */}
        <rect x={canvasWidth / 2} y="0" width={canvasWidth / 2} height={canvasHeight / 2} fill={tokens.q1Wash} />

        {/* Q4 background (bottom-left) */}
        <rect x="0" y={canvasHeight / 2} width={canvasWidth / 2} height={canvasHeight / 2} fill={tokens.q4Wash} />

        {/* Q3 background (bottom-right) */}
        <rect x={canvasWidth / 2} y={canvasHeight / 2} width={canvasWidth / 2} height={canvasHeight / 2} fill={tokens.q3Wash} />

        {/* Horizontal divider */}
        <Line x1="0" y1={canvasHeight / 2} x2={canvasWidth} y2={canvasHeight / 2} stroke={tokens.axisLine} strokeWidth="1" />

        {/* Vertical divider */}
        <Line x1={canvasWidth / 2} y1="0" x2={canvasWidth / 2} y2={canvasHeight} stroke={tokens.axisLine} strokeWidth="1" />

        {/* Quadrant labels */}
        <SvgText x="10" y={canvasHeight - 8} fontSize="8" fill={tokens.q2} opacity="0.38" fontFamily="serif" fontStyle="italic">
          Schedule
        </SvgText>
        <SvgText x={canvasWidth - 80} y={canvasHeight - 8} fontSize="8" fill={tokens.q1} opacity="0.38" fontFamily="serif" fontStyle="italic">
          Do Now
        </SvgText>
        <SvgText x="10" y={canvasHeight + 12} fontSize="8" fill={tokens.q4} opacity="0.38" fontFamily="serif" fontStyle="italic">
          Eliminate
        </SvgText>
        <SvgText x={canvasWidth - 80} y={canvasHeight + 12} fontSize="8" fill={tokens.q3} opacity="0.38" fontFamily="serif" fontStyle="italic">
          Delegate
        </SvgText>
      </Svg>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* MIT Strip */}
        <View style={styles.mitStrip}>
          <MITStrip
            tokens={tokens}
            fontChoice={config.fontChoice}
            mitText={mit}
            onPress={() => {}}
          />
        </View>

        {/* Filter Row */}
        <View style={styles.filterRow}>{/* Filter chips will be added */}</View>

        {/* Matrix Canvas */}
        <View style={styles.matrixCanvas}>
          {renderMatrix()}

          {/* Sparks button */}
          <TouchableOpacity style={styles.sparksButton}>
            {/* Sparks icon placeholder */}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};
