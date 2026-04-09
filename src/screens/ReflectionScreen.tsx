import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line, Circle } from 'react-native-svg';
import { useClearDayStore } from '../clearday/store';
import { ThemeTokens } from '../clearday/theme';
import { getFontSet } from '../clearday/fonts';
import { moderateScale, fontScale } from '../clearday/scale';
import { NavCtx } from '../clearday/ClarityApp';

interface Props { tokens: ThemeTokens; fontChoice: string; }

export function ReflectionScreen({ tokens, fontChoice }: Props) {
  const insets = useSafeAreaInsets();
  const fonts = getFontSet(fontChoice as any);
  const nav = useContext(NavCtx);
  const { reflection, weeklyPulse, monthlyPulse, runReflection, runPulse } = useClearDayStore();
  const fontSizeMultiplier = useClearDayStore(s => s.config?.fontSizeMultiplier ?? 1.0);
  const [loading, setLoading] = useState(false);
  const [pulseLoading, setPulseLoading] = useState<'week' | 'month' | null>(null);

  const handleReflect = async () => {
    setLoading(true);
    try { await runReflection(); } finally { setLoading(false); }
  };

  const handlePulse = async (period: 'week' | 'month') => {
    setPulseLoading(period);
    try { await runPulse(period); } finally { setPulseLoading(null); }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: tokens.bg, paddingTop: insets.top },
    header: { height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: tokens.border },
    backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    title: { fontFamily: fonts.serif, fontSize: fontScale(22, fontSizeMultiplier), color: tokens.text, fontWeight: '300', letterSpacing: -0.3 },
    subtitle: { fontFamily: fonts.serifItalic, fontSize: fontScale(9, fontSizeMultiplier), color: tokens.textGhost, paddingHorizontal: 16, marginTop: 8 },
    scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
    generateBtn: { height: 44, borderWidth: 0.5, borderColor: tokens.borderMid, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    generateText: { fontFamily: fonts.serif, fontSize: fontScale(13, fontSizeMultiplier), color: tokens.text },
    reflectionText: { fontFamily: fonts.serifItalic, fontSize: fontScale(14, fontSizeMultiplier), color: tokens.text, lineHeight: fontScale(14, fontSizeMultiplier) * 1.8, paddingBottom: 24 },
    pulseRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    pulseBtn: { flex: 1, height: 36, borderWidth: 0.5, borderColor: tokens.borderMid, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
    pulseBtnText: { fontFamily: fonts.serif, fontSize: fontScale(11, fontSizeMultiplier), color: tokens.text },
    insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
    insightDot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
    insightText: { flex: 1, fontFamily: fonts.serif, fontSize: fontScale(12, fontSizeMultiplier), color: tokens.textMuted, lineHeight: fontScale(12, fontSizeMultiplier) * 1.5 },
    insightTitle: { fontFamily: fonts.serifBold, fontSize: fontScale(13, fontSizeMultiplier), color: tokens.text, marginBottom: 8 },
  });

  const pulse = pulseLoading === 'week' ? null : weeklyPulse;
  const monthPulse = pulseLoading === 'month' ? null : monthlyPulse;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={nav.back}>
          <Svg width={16} height={16} viewBox="0 0 16 16">
            <Line x1={10} y1={3} x2={5} y2={8} stroke={tokens.accent} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1={5} y1={8} x2={10} y2={13} stroke={tokens.accent} strokeWidth={1.5} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={s.title}>Reflection</Text>
      </View>
      <Text style={s.subtitle}>End of day. What moved.</Text>

      <ScrollView style={s.scroll}>
        <TouchableOpacity style={s.generateBtn} onPress={handleReflect} disabled={loading}>
          <Text style={s.generateText}>{loading ? 'Reflecting…' : 'Generate reflection'}</Text>
        </TouchableOpacity>

        {reflection ? (
          <Text style={s.reflectionText}>{reflection}</Text>
        ) : null}

        <View style={s.pulseRow}>
          <TouchableOpacity style={s.pulseBtn} onPress={() => handlePulse('week')}>
            <Text style={s.pulseBtnText}>{pulseLoading === 'week' ? 'Loading…' : 'This Week'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.pulseBtn} onPress={() => handlePulse('month')}>
            <Text style={s.pulseBtnText}>{pulseLoading === 'month' ? 'Loading…' : 'This Month'}</Text>
          </TouchableOpacity>
        </View>

        {weeklyPulse && (
          <View>
            <Text style={s.insightTitle}>{weeklyPulse.title}</Text>
            {weeklyPulse.lines.map((line, i) => (
              <View key={i} style={s.insightRow}>
                <View style={[s.insightDot, { backgroundColor: tokens.accent }]} />
                <Text style={s.insightText}>{line}</Text>
              </View>
            ))}
          </View>
        )}

        {monthlyPulse && (
          <View style={{ marginTop: 16 }}>
            <Text style={s.insightTitle}>{monthlyPulse.title}</Text>
            {monthlyPulse.lines.map((line, i) => (
              <View key={i} style={s.insightRow}>
                <View style={[s.insightDot, { backgroundColor: tokens.accent }]} />
                <Text style={s.insightText}>{line}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
