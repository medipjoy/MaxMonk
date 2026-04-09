import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';
import { useClearDayStore } from '../clearday/store';
import { ThemeTokens } from '../clearday/theme';
import { getFontSet } from '../clearday/fonts';
import { moderateScale, fontScale } from '../clearday/scale';
import { NavCtx } from '../clearday/ClarityApp';

interface Props { tokens: ThemeTokens; fontChoice: string; }

function qColor(q: string, tokens: ThemeTokens) {
  switch (q) { case 'Q1': return tokens.q1; case 'Q2': return tokens.q2; case 'Q3': return tokens.q3; default: return tokens.q4; }
}

export function HoldScreen({ tokens, fontChoice }: Props) {
  const insets = useSafeAreaInsets();
  const fonts = getFontSet(fontChoice as any);
  const nav = useContext(NavCtx);
  const { agendas, toggleHold, archiveAgenda } = useClearDayStore();
  const fontSizeMultiplier = useClearDayStore(s => s.config?.fontSizeMultiplier ?? 1.0);
  const onHold = agendas.filter(a => a.status === 'onhold');

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: tokens.bg, paddingTop: insets.top },
    header: { height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: tokens.border },
    backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    title: { fontFamily: fonts.serif, fontSize: fontScale(22, fontSizeMultiplier), color: tokens.text, fontWeight: '300', letterSpacing: -0.3 },
    scroll: { flex: 1 },
    row: { height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: tokens.border },
    dot: { width: 4, height: 4, borderRadius: 2, marginRight: 12 },
    rowText: { flex: 1, fontFamily: fonts.serif, fontSize: fontScale(12, fontSizeMultiplier), color: tokens.text },
    rowBtns: { flexDirection: 'row' },
    rowBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
    rowBtnText: { fontSize: fontScale(14, fontSizeMultiplier), color: tokens.textMuted },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontFamily: fonts.serifItalic, fontSize: fontScale(13, fontSizeMultiplier), color: tokens.textGhost },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={nav.back}>
          <Svg width={16} height={16} viewBox="0 0 16 16">
            <Line x1={10} y1={3} x2={5} y2={8} stroke={tokens.accent} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1={5} y1={8} x2={10} y2={13} stroke={tokens.accent} strokeWidth={1.5} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={s.title}>On Hold</Text>
      </View>
      {onHold.length === 0 ? (
        <View style={s.empty}><Text style={s.emptyText}>Nothing paused. Everything in motion.</Text></View>
      ) : (
        <ScrollView style={s.scroll}>
          {onHold.map(agenda => (
            <TouchableOpacity key={agenda.id} style={s.row} onPress={() => { nav.setBubbleActionId(agenda.id); nav.openPanel('bubbleAction'); }}>
              <View style={[s.dot, { backgroundColor: qColor(agenda.quadrant, tokens) }]} />
              <Text style={s.rowText} numberOfLines={1}>{agenda.text}</Text>
              <View style={s.rowBtns}>
                <TouchableOpacity style={s.rowBtn} onPress={() => toggleHold(agenda.id)}>
                  <Text style={s.rowBtnText}>▶</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.rowBtn} onPress={() => archiveAgenda(agenda.id)}>
                  <Text style={s.rowBtnText}>⊡</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
