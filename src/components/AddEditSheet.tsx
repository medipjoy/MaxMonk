import React, { useEffect, useRef, useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, PanResponder, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon, Rect, Line, Circle, Text as SvgText } from 'react-native-svg';
import Slider from '@react-native-community/slider';
import { useClearDayStore } from '../clearday/store';
import { ThemeTokens } from '../clearday/theme';
import { getFontSet } from '../clearday/fonts';
import { moderateScale, fontScale } from '../clearday/scale';
import { posFromSliders, qFromPos, slidersFromPos } from '../clearday/helpers';
import { NavCtx, AddSheetPreset } from '../clearday/ClarityApp';
import { Quadrant } from '../clearday/types';
import { CheckIcon } from './ActionIcons';

const EFFORT_LABELS: Record<number, string> = { 1: 'Minimal', 2: 'Light', 3: 'Moderate', 4: 'Substantial', 5: 'Committed', 6: 'Extended', 7: 'Total' };
const EFFORT_TIME: Record<number, string> = { 1: 'quick', 2: 'short', 3: 'medium', 4: 'medium', 5: 'deep', 6: 'deep', 7: 'deep' };
const EFFORT_RADII: Record<string, number> = { quick: 20, short: 29, medium: 38, deep: 50 };
function getRadius(time: string) { return EFFORT_RADII[time] ?? 29; }

// Reverted custom slider to native Slider for stability

function effortLevelFromTime(time?: string): number {
  if (time === 'quick') return 1;
  if (time === 'short') return 2;
  if (time === 'medium') return 3;
  if (time === 'deep') return 5;
  return 3;
}

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
  const { config, agendas, mit, addAgenda, updateAgenda, completeAgenda, toggleHold, archiveAgenda } = useClearDayStore();
  const fontSizeMultiplier = useClearDayStore(s => s.config?.fontSizeMultiplier ?? 1.0);

  const existingAgenda = agendaId ? agendas.find(a => a.id === agendaId) : null;

  const [title, setTitle] = useState(preset?.defaultText ?? existingAgenda?.text ?? '');
  const [urgency, setUrgency] = useState(
    preset?.urgency != null ? preset.urgency :
    existingAgenda?.cx != null && existingAgenda?.cy != null ? slidersFromPos(existingAgenda.cx, existingAgenda.cy).urgency : 50
  );
  const [importance, setImportance] = useState(
    preset?.importance != null ? preset.importance :
    existingAgenda?.cx != null && existingAgenda?.cy != null ? slidersFromPos(existingAgenda.cx, existingAgenda.cy).importance : 50
  );
  const [effort, setEffort] = useState(3);
  const [selectedTag, setSelectedTag] = useState(
    existingAgenda?.domain ?? preset?.defaultDomain ?? config.tags[0]
  );
  const [isMIT, setIsMIT] = useState(false);
  const [sliderKey, setSliderKey] = useState(0);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [scrollHeight, setScrollHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const dismissPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
    onPanResponderMove: () => {},
    onPanResponderRelease: (_, gs) => { if (gs.dy > 50) onClose(); },
  })).current;

  useEffect(() => {
    if (existingAgenda) {
      const nextSliders = slidersFromPos(existingAgenda.cx, existingAgenda.cy);
      setTitle(existingAgenda.text);
      setUrgency(nextSliders.urgency);
      setImportance(nextSliders.importance);
      setEffort(effortLevelFromTime(existingAgenda.time));
      setSelectedTag(existingAgenda.domain);
      setIsMIT(mit === existingAgenda.text);
      setSliderKey(k => k + 1);
      return;
    }

    setTitle(preset?.defaultText ?? '');
    setUrgency(preset?.urgency ?? 50);
    setImportance(preset?.importance ?? 50);
    setEffort(3);
    setSelectedTag(preset?.defaultDomain ?? config.tags[0]);
    setIsMIT(false);
    setSliderKey(k => k + 1);
  }, [agendaId, existingAgenda, preset, config.tags, mit]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const { cx, cy } = posFromSliders(urgency, importance);
  const quadrant = qFromPos(cx, cy);
  const quadrantLabels = config.quadrantLabels;
  const matrixStyle = config.matrixStyle;
  const quadColor = qColor(quadrant, tokens);
  const sheetTone = matrixStyle === 'paper' ? tokens.surface2 : tokens.surface;
  const sliderActive = matrixStyle === 'editorial' ? tokens.text : tokens.accent;
  const sliderInactive = matrixStyle === 'paper' ? tokens.borderMid : tokens.border;

  const canSave = title.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    const timeVal = EFFORT_TIME[effort] as any;
    if (existingAgenda) {
      await updateAgenda(existingAgenda.id, { text: title.trim(), domain: selectedTag, time: timeVal, cx, cy });
      onSave('Updated');
    } else {
      const agenda = await addAgenda({ text: title.trim(), domain: selectedTag, time: timeVal, urgency, importance });
      if (agenda) {
        if (isMIT) await useClearDayStore.getState().setMit(agenda.text);
        if (preset?.addToHold) await useClearDayStore.getState().toggleHold(agenda.id);
      }
      onSave(preset?.addToHold ? 'Added to Hold' : 'Added to ' + quadrantLabels[quadrant as Quadrant]);
    }
  };

  const s = StyleSheet.create({
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: tokens.overlay, justifyContent: 'flex-end' },
    sheet: { backgroundColor: sheetTone, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: keyboardVisible ? 0 : insets.bottom + 8, maxHeight: '64%' },
    handleArea: { width: '100%', alignItems: 'center', paddingTop: 8, paddingBottom: 8 },
    handle: { width: 36, height: 3, backgroundColor: tokens.border, borderRadius: 2 },
    scroll: { paddingHorizontal: 16 },
    titleInput: { borderWidth: 0.5, borderColor: tokens.borderMid, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: matrixStyle === 'paper' ? tokens.surface : tokens.surface2, fontFamily: fonts.serifItalic, fontSize: fontScale(14, fontSizeMultiplier), color: tokens.text, marginBottom: 8 },
    mitRow: { flexDirection: 'row', alignItems: 'center', height: 36, marginBottom: 8, gap: 8 },
    mitLabel: { fontFamily: fonts.serifItalic, fontSize: fontScale(9, fontSizeMultiplier), color: tokens.textGhost },
    sliderLabel: { fontFamily: fonts.sansMedium, fontSize: fontScale(9, fontSizeMultiplier), color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 2 },
    sliderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
    sliderValue: { fontFamily: fonts.serifBold, fontSize: fontScale(13, fontSizeMultiplier), color: tokens.accent },
    sliderHelp: { fontFamily: fonts.serifItalic, fontSize: fontScale(9, fontSizeMultiplier), color: tokens.textGhost, marginBottom: 10 },
    tagRow: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
    tagChip: { borderRadius: 4, paddingHorizontal: 10, paddingVertical: 5 },
    tagText: { fontFamily: fonts.serif, fontSize: fontScale(11, fontSizeMultiplier) },
    preview: { flexDirection: 'row', gap: 6, marginBottom: 12 },
    previewLabel: { fontFamily: fonts.serifItalic, fontSize: fontScale(9, fontSizeMultiplier), color: tokens.accent, alignSelf: 'center' },
    submitBtn: { marginHorizontal: 16, height: 48, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginTop: 2, marginBottom: keyboardVisible ? 0 : 0 },
    submitText: { fontFamily: fonts.serif, fontSize: fontScale(14, fontSizeMultiplier), color: tokens.surface },
    quickActions: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    quickBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 5,
      borderWidth: 0.5, borderColor: tokens.borderMid,
    },
    quickBtnText: { fontFamily: fonts.serif, fontSize: fontScale(10, fontSizeMultiplier), color: tokens.textMuted },
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

  // Mini SVG matrix — always tinted, shows bubble at current urgency/importance/effort
  const QuadPreview = () => {
    const S = 80;
    const half = S / 2;
    const dotX = (urgency / 100) * S;
    const dotY = (1 - importance / 100) * S;
    // Scale effort radius proportionally to the 80px preview (main canvas ~360px)
    const fullRadius = getRadius(EFFORT_TIME[effort] as any);
    const previewR = Math.max(3, Math.round(fullRadius * 80 / 360));
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
        <Circle cx={dotX} cy={dotY} r={previewR} fill={quadColor} opacity={0.72} stroke={quadColor} strokeOpacity={0.75} strokeWidth={0.75} />
      </Svg>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'position' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? -2 : 0}
      style={s.overlay}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1 }} hitSlop={{ top: 0, bottom: 24, left: 0, right: 0 }} />
      </TouchableWithoutFeedback>
      <View style={s.sheet}>
        <View style={s.handleArea} {...dismissPan.panHandlers}>
          <View style={s.handle} />
        </View>
        <ScrollView
          style={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={showScrollIndicator}
          persistentScrollbar={showScrollIndicator}
          onLayout={(e) => {
            const nextHeight = e.nativeEvent.layout.height;
            setScrollHeight(nextHeight);
          }}
          onContentSizeChange={(_, contentHeight) => {
            setShowScrollIndicator(contentHeight > scrollHeight + 8);
          }}
        >
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
                    <Slider key={`urgency-${sliderKey}`} style={{ flex: 1 }} minimumValue={5} maximumValue={95} step={1} value={urgency} onValueChange={(v: number) => setUrgency(Math.round(v))} minimumTrackTintColor={sliderActive} maximumTrackTintColor={sliderInactive} thumbTintColor={sliderActive} />
                  <Text style={s.sliderValue}>{urgency}</Text>
                </View>
                <Text style={s.sliderHelp}>Urgent = delay creates real consequences</Text>

                {/* Importance */}
                <Text style={s.sliderLabel}>Importance</Text>
                <View style={s.sliderRow}>
                    <Slider key={`importance-${sliderKey}`} style={{ flex: 1 }} minimumValue={5} maximumValue={95} step={1} value={importance} onValueChange={(v: number) => setImportance(Math.round(v))} minimumTrackTintColor={sliderActive} maximumTrackTintColor={sliderInactive} thumbTintColor={sliderActive} />
                  <Text style={s.sliderValue}>{importance}</Text>
                </View>
                <Text style={s.sliderHelp}>Important = advances your goals, not someone else's urgency</Text>

                {/* Effort */}
                <Text style={s.sliderLabel}>Effort</Text>
                <View style={s.sliderRow}>
                  <Slider style={{ flex: 1 }} minimumValue={1} maximumValue={7} step={1} value={effort} onValueChange={(v: number) => setEffort(Math.round(v))} minimumTrackTintColor={tokens.textMuted} maximumTrackTintColor={tokens.border} thumbTintColor={tokens.textMuted} />
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: existingAgenda ? 10 : 16 }}>
                  <QuadPreview />
                  <Text style={s.previewLabel}>→ {quadrantLabels[quadrant as Quadrant]} · {quadrant}</Text>
                </View>

                {/* Quick actions (edit mode only) */}
                {existingAgenda && (
                  <View style={s.quickActions}>
                    <TouchableOpacity style={s.quickBtn} onPress={async () => { await completeAgenda(existingAgenda.id); onSave('Marked Completed'); }}>
                      <CheckIcon color={tokens.q2} size={14} />
                      <Text style={s.quickBtnText}>Complete</Text>
                    </TouchableOpacity>
                    {existingAgenda.status === 'active' && (
                      <TouchableOpacity style={s.quickBtn} onPress={async () => {
                        await toggleHold(existingAgenda.id);
                        onSave('On Hold');
                      }}>
                        <Text style={s.quickBtnText}>–</Text>
                        <Text style={s.quickBtnText}>Hold</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={s.quickBtn} onPress={async () => { await archiveAgenda(existingAgenda.id); onSave('Archived'); }}>
                      <Text style={s.quickBtnText}>↓</Text>
                      <Text style={s.quickBtnText}>Archive</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>

              {/* Submit */}
              <TouchableOpacity
                style={[s.submitBtn, { backgroundColor: canSave ? tokens.text : tokens.textGhost }]}
                onPress={handleSave}
                disabled={!canSave}
              >
                <Text style={s.submitText}>
                  {existingAgenda ? 'Save Changes' : `Place in ${quadrantLabels[quadrant as Quadrant]}`}
                </Text>
              </TouchableOpacity>
              {keyboardVisible && <View style={{ height: 16, backgroundColor: sheetTone }} />}
      </View>
    </KeyboardAvoidingView>
  );
}
