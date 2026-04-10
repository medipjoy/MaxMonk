import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';
import { useClearDayStore } from '../clearday/store';
import { ThemeTokens } from '../clearday/theme';
import { getFontSet } from '../clearday/fonts';
import { fontScale } from '../clearday/scale';
import { NavCtx } from '../clearday/ClarityApp';
import { Quadrant } from '../clearday/types';

interface Props { tokens: ThemeTokens; fontChoice: string; }

const Q_ORDER = ['Q1', 'Q2', 'Q3', 'Q4'];
function qColor(q: string, tokens: ThemeTokens) {
  switch (q) { case 'Q1': return tokens.q1; case 'Q2': return tokens.q2; case 'Q3': return tokens.q3; default: return tokens.q4; }
}

function formatMonth(ts?: number): string {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(' ', " '");
}

export function CompletedScreen({ tokens, fontChoice }: Props) {
  const insets = useSafeAreaInsets();
  const fonts = getFontSet(fontChoice as any);
  const nav = useContext(NavCtx);
  const { agendas, restoreCompletedAgenda, archiveAgenda } = useClearDayStore();
  const fontSizeMultiplier = useClearDayStore(s => s.config?.fontSizeMultiplier ?? 1.0);
  const quadrantLabels = useClearDayStore(s => s.config.quadrantLabels);

  const completed = agendas.filter(a => a.status === 'done');
  const grouped: Record<string, typeof completed> = {};
  Q_ORDER.forEach(q => { grouped[q] = completed.filter(a => a.quadrant === q); });

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: tokens.bg, paddingTop: insets.top },
    header: { height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: tokens.border },
    backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    title: { fontFamily: fonts.serif, fontSize: fontScale(22, fontSizeMultiplier), color: tokens.text, fontWeight: '300', letterSpacing: -0.3, marginLeft: 4 },
    scroll: { flex: 1 },
    sectionHeader: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
    sectionLabel: { fontFamily: fonts.sansMedium, fontSize: fontScale(7.5, fontSizeMultiplier), color: tokens.textGhost, textTransform: 'uppercase', letterSpacing: 0.1 * fontScale(7.5, fontSizeMultiplier) },
    row: { minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: tokens.border },
    dot: { width: 4, height: 4, borderRadius: 2, marginRight: 12 },
    rowText: { flex: 1, fontFamily: fonts.serif, fontSize: fontScale(12, fontSizeMultiplier), color: tokens.textMuted },
    rowMeta: { fontFamily: fonts.serif, fontSize: fontScale(9, fontSizeMultiplier), color: tokens.textGhost, marginLeft: 8 },
    rowBtns: { flexDirection: 'row', alignItems: 'center' },
    rowBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
    rowBtnText: { fontSize: fontScale(14, fontSizeMultiplier), color: tokens.textMuted },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontFamily: fonts.serifItalic, fontSize: fontScale(13, fontSizeMultiplier), color: tokens.textGhost },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={nav.back} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Svg width={16} height={16} viewBox="0 0 16 16">
            <Line x1={10} y1={3} x2={5} y2={8} stroke={tokens.accent} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1={5} y1={8} x2={10} y2={13} stroke={tokens.accent} strokeWidth={1.5} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={s.title}>Completed</Text>
      </View>

      {completed.length === 0 ? (
        <View style={s.empty}><Text style={s.emptyText}>Nothing completed yet.</Text></View>
      ) : (
        <ScrollView style={s.scroll}>
          {Q_ORDER.map(q => {
            const items = grouped[q];
            if (!items.length) return null;
            return (
              <View key={q}>
                <View style={s.sectionHeader}>
                  <Text style={[s.sectionLabel, { color: qColor(q, tokens) }]}>{`${quadrantLabels[q as Quadrant].toUpperCase()} · ${q}`}</Text>
                </View>
                {items.map(agenda => (
                  <TouchableOpacity
                    key={agenda.id}
                    style={s.row}
                    onPress={() => { nav.setEditAgendaId(agenda.id); nav.openPanel('edit'); }}
                  >
                    <View style={[s.dot, { backgroundColor: qColor(q, tokens) }]} />
                    <Text style={s.rowText} numberOfLines={1}>{agenda.text}</Text>
                    <Text style={s.rowMeta}>{agenda.domain} · {formatMonth(agenda.doneAt)}</Text>
                    <View style={s.rowBtns}>
                      <TouchableOpacity style={s.rowBtn} onPress={async () => { await restoreCompletedAgenda(agenda.id); nav.showToast('Back to Active'); }}>
                        <Text style={[s.rowBtnText, { color: tokens.accent, fontSize: fontScale(16.1, fontSizeMultiplier) }]}>+</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.rowBtn} onPress={async () => { await archiveAgenda(agenda.id); nav.showToast('Archived'); }}>
                        <Text style={s.rowBtnText}>↓</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
