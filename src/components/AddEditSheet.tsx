import React, { useEffect, useRef, useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon, Rect, Line, Circle, Text as SvgText } from 'react-native-svg';
import Slider from '@react-native-community/slider';
import { useClearDayStore } from '../clearday/store';
import { ThemeTokens } from '../clearday/theme';
import { getFontSet } from '../clearday/fonts';
import { moderateScale, fontScale } from '../clearday/scale';
import { posFromSliders, qFromPos } from '../clearday/helpers';
import { NavCtx, AddSheetPreset } from '../clearday/ClarityApp';

const EFFORT_LABELS: Record<number, string> = { 1: 'Quick · <15 min', 2: '~1 hr', 3: '~3 hrs', 4: 'Half day', 5: 'Full day', 6: '2-3 days', 7: '1 week+' };
const EFFORT_TIME: Record<number, string> = { 1: 'quick', 2: 'short', 3: 'medium', 4: 'medium', 5: 'deep', 6: 'deep', 7: 'deep' };
const Q_LABEL: Record<string, string> = { Q1: 'Do Now', Q2: 'Schedule', Q3: 'Delegate', Q4: 'Eliminate' };

function qColor(q: string, tokens: ThemeTokens) {
  switch (q) { case 'Q1': return tokens.q1; case 'Q2': return tokens.q2; case 'Q3': return tokens.q3; default: return tokens.q4; }
}

interface Props {
  tokens: ThemeTokens;
  fontChoice: string;
  agendaId: string | null;
  preset: AddSheetPreset | null;
  onClose: () => void;
  onSave: (msg: string) => void;
}

export function AddEditSheet({ tokens, fontChoice, agendaId, preset, onClose, onSave }: Props) {
  const fonts = getFontSet(fontChoice as any);
  const insets = useSafeAreaInsets();
  const nav = useContext(NavCtx);
  const { config, agendas, mit, addAgenda, updateAgenda } = useClearDayStore();
  const fontSizeMultiplier = useClearDayStore(s => s.config?.fontSizeMultiplier ?? 1.0);

  const existingAgenda = agendaId ? agendas.find(a => a.id === agendaId) : null;

  const [title, setTitle] = useState(existingAgenda?.text ?? '');
  const [urgency, setUrgency] = useState(
    preset?.urgency != null ? preset.urgency :
    existingAgenda?.cx != null ? Math.round(existingAgenda.cx * 90 + 5) : 50
  );
  const [importance, setImportance] = useState(
    preset?.importance != null ? preset.importance :
    existingAgenda?.cy != null ? Math.round((1 - existingAgenda.cy) * 90 + 5) : 50
  );
  const [effort, setEffort] = useState(3);
  const [selectedTag, setSelectedTag] = useState(
    existingAgenda?.domain ?? preset?.defaultDomain ?? config.tags[0]
  );
  const [isMIT, setIsMIT] = useState(false);

  const dismissPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
    onPanResponderMove: () => {},
    onPanResponderRelease: (_, gs) => { if (gs.dy > 80) onClose(); },
  })).current;

  useEffect(() => {
    if (preset) {
      setUrgency(preset.urgency);
      setImportance(preset.importance);
      if (preset.defaultDomain) setSelectedTag(preset.defaultDomain);
    }
  }, [preset]);

  const { cx, cy } = posFromSliders(urgency, importance);
  const quadrant = qFromPos(cx, cy);
  const quadColor = qColor(quadrant, tokens);

  const canSave = title.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    const timeVal = EFFORT_TIME[effort] as any;
    if (existingAgenda) {
      await updateAgenda(existingAgenda.id, { text: title.trim(), domain: selectedTag, time: timeVal, cx, cy });
      onSave('Updated');
    } else {
      const agenda = await addAgenda({ text: title.trim(), domain: selectedTag, time: timeVal, urgency, importance });
      if (isMIT && agenda) {
        await useClearDayStore.getState().setMit(agenda.text);
      }
      onSave('Added to ' + Q_LABEL[quadrant]);
    }
  };

  const s = StyleSheet.create({
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: tokens.overlay, justifyContent: 'flex-end' },
    sheet: { backgroundColor: tokens.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: insets.bottom + 16, maxHeight: '90%' },
    handle: { width: 36, height: 3, backgroundColor: tokens.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 12 },
    scroll: { paddingHorizontal: 16 },
    titleInput: { borderWidth: 0.5, borderColor: tokens.borderMid, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: tokens.surface2, fontFamily: fonts.serifItalic, fontSize: fontScale(14, fontSizeMultiplier), color: tokens.text, marginBottom: 8 },
    mitRow: { flexDirection: 'row', alignItems: 'center', height: 36, marginBottom: 8, gap: 8 },
    mitLabel: { fontFamily: fonts.serifItalic, fontSize: fontScale(9, fontSizeMultiplier), color: tokens.textGhost },
    sliderLabel: { fontFamily: 'Inter_500Medium', fontSize: fontScale(9, fontSizeMultiplier), color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 2 },
    sliderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
    sliderValue: { fontFamily: 'Inter_600SemiBold', fontSize: fontScale(13, fontSizeMultiplier), color: tokens.accent },
    sliderHelp: { fontFamily: fonts.serifItalic, fontSize: fontScale(9, fontSizeMultiplier), color: tokens.textGhost, marginBottom: 10 },
    tagRow: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
    tagChip: { borderRadius: 4, paddingHorizontal: 10, paddingVertical: 5 },
    tagText: { fontFamily: fonts.serif, fontSize: fontScale(11, fontSizeMultiplier) },
    preview: { flexDirection: 'row', gap: 6, marginBottom: 12 },
    previewLabel: { fontFamily: fonts.serifItalic, fontSize: fontScale(9, fontSizeMultiplier), color: tokens.accent, alignSelf: 'center' },
    submitBtn: { marginHorizontal: 16, height: 48, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
    submitText: { fontFamily: fonts.serif, fontSize: fontScale(14, fontSizeMultiplier), color: tokens.surface },
  });

  const StarIcon = ({ active }: { active: boolean }) => (
    <Svg width={13} height={13} viewBox="0 0 13 13">
      <Polygon
        points="6.5,1 8.1,4.7 12.1,5.1 9.2,7.7 10.1,11.6 6.5,9.4 2.9,11.6 3.8,7.7 0.9,5.1 4.9,4.7"
        fill={active ? tokens.gold : 'none'}
        stroke={active ? tokens.gold : tokens.textGhost}
        strokeWidth={1}
      />
    </Svg>
  );

  // Mini SVG matrix — always tinted, shows dot at current urgency/importance position
  const QuadPreview = () => {
    const S = 80;
    const half = S / 2;
    const dotX = (urgency / 100) * S;
    const dotY = (1 - importance / 100) * S;
    return (
      <Svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
        <Rect x={0} y={0} width={half} height={half} fill={tokens.q2Wash} />
        <Rect x={half} y={0} width={half} height={half} fill={tokens.q1Wash} />
        <Rect x={0} y={half} width={half} height={half} fill={tokens.q4Wash} />
        <Rect x={half} y={half} width={half} height={half} fill={tokens.q3Wash} />
        <Line x1={half} y1={0} x2={half} y2={S} stroke={tokens.axisLine} strokeWidth={0.75} />
        <Line x1={0} y1={half} x2={S} y2={half} stroke={tokens.axisLine} strokeWidth={0.75} />
        <SvgText x={3} y={half - 3} fontSize={5} fill={tokens.q2} opacity={0.5} fontStyle="italic">Sch</SvgText>
        <SvgText x={S - 3} y={half - 3} fontSize={5} fill={tokens.q1} opacity={0.5} textAnchor="end" fontStyle="italic">Now</SvgText>
        <SvgText x={3} y={S - 3} fontSize={5} fill={tokens.q4} opacity={0.5} fontStyle="italic">Elim</SvgText>
        <SvgText x={S - 3} y={S - 3} fontSize={5} fill={tokens.q3} opacity={0.5} textAnchor="end" fontStyle="italic">Del</SvgText>
        <Circle cx={dotX} cy={dotY} r={4} fill={quadColor} opacity={0.85} />
      </Svg>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={s.overlay}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1 }} />
      </TouchableWithoutFeedback>
      <View style={s.sheet}>
        <View style={s.handle} {...dismissPan.panHandlers} />
        <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {/* Title */}
                <TextInput
                  style={s.titleInput}
                  placeholder="Name this agenda…"
                  placeholderTextColor={tokens.textGhost}
                  value={title}
                  onChangeText={setTitle}
                  autoFocus
                  maxLength={80}
                />

                {/* MIT row */}
                {!existingAgenda && (
                  <TouchableOpacity style={s.mitRow} onPress={() => setIsMIT(!isMIT)}>
                    <StarIcon active={isMIT} />
                    <Text style={s.mitLabel}>Set as today's MIT</Text>
                  </TouchableOpacity>
                )}

                {/* Urgency */}
                <Text style={s.sliderLabel}>Urgency</Text>
                <View style={s.sliderRow}>
                  <Slider style={{ flex: 1 }} minimumValue={5} maximumValue={95} step={1} value={urgency} onValueChange={(v: number) => setUrgency(Math.round(v))} minimumTrackTintColor={tokens.accent} maximumTrackTintColor={tokens.border} thumbTintColor={tokens.accent} />
                  <Text style={s.sliderValue}>{urgency}</Text>
                </View>
                <Text style={s.sliderHelp}>Urgent = delay creates real consequences</Text>

                {/* Importance */}
                <Text style={s.sliderLabel}>Importance</Text>
                <View style={s.sliderRow}>
                  <Slider style={{ flex: 1 }} minimumValue={5} maximumValue={95} step={1} value={importance} onValueChange={(v: number) => setImportance(Math.round(v))} minimumTrackTintColor={tokens.accent} maximumTrackTintColor={tokens.border} thumbTintColor={tokens.accent} />
                  <Text style={s.sliderValue}>{importance}</Text>
                </View>
                <Text style={s.sliderHelp}>Important = advances your goals, not someone else's urgency</Text>

                {/* Effort */}
                <Text style={s.sliderLabel}>Effort</Text>
                <View style={s.sliderRow}>
                  <Slider style={{ flex: 1 }} minimumValue={1} maximumValue={7} step={1} value={effort} onValueChange={(v: number) => setEffort(Math.round(v))} minimumTrackTintColor={tokens.accent} maximumTrackTintColor={tokens.border} thumbTintColor={tokens.accent} />
                  <Text style={[s.sliderValue, { fontSize: fontScale(11, fontSizeMultiplier) }]}>{EFFORT_LABELS[effort]}</Text>
                </View>

                {/* Category */}
                <View style={s.tagRow}>
                  {config.tags.map(tag => {
                    const active = selectedTag === tag;
                    return (
                      <TouchableOpacity key={tag} style={[s.tagChip, { backgroundColor: active ? tokens.accent : 'transparent', borderWidth: 0.5, borderColor: active ? tokens.accent : tokens.textGhost }]} onPress={() => setSelectedTag(tag)}>
                        <Text style={[s.tagText, { color: active ? tokens.surface : tokens.textGhost }]}>{tag}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Quadrant preview */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <QuadPreview />
                  <Text style={s.previewLabel}>→ {Q_LABEL[quadrant]} · {quadrant}</Text>
                </View>
              </ScrollView>

              {/* Submit */}
              <TouchableOpacity
                style={[s.submitBtn, { backgroundColor: canSave ? tokens.text : tokens.textGhost }]}
                onPress={handleSave}
                disabled={!canSave}
              >
                <Text style={s.submitText}>
                  {existingAgenda ? 'Save Changes' : `Place in ${Q_LABEL[quadrant]}`}
                </Text>
              </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
