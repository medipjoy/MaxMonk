import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Alert,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import Svg, { Circle } from 'react-native-svg';
import { useClearDayStore } from '../clearday/store';
import { AddDraft, clearAddDraft, loadAddDraft, saveAddDraft } from '../clearday/storage';
import { resolveTheme, ThemeTokens } from '../clearday/theme';
import {
  clamp,
  EXPIRY_DAYS,
  getR,
  isCenterPoint,
  getVaultDaysLeft,
  isExpired,
  posFromSliders,
  qFromPos,
  slidersFromPos,
  summarizeBubble,
} from '../clearday/helpers';
import {
  Agenda,
  AGENDA_TITLE_MAX_LENGTH,
  AgendaDomain,
  AgendaTime,
  QUADRANT_LABEL_MAX_LENGTH,
  QUADRANT_META,
  Quadrant,
  Spark,
  SparkSuggestion,
  TAG_MAX_LENGTH,
  ThemeMode,
} from '../clearday/types';

type Panel = 'add' | 'sparks' | 'hold' | 'vault' | 'detail' | 'reflect' | 'pulse' | 'settings' | 'agendaList' | null;

type IconName = 'menu';
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function Icon({ name, color = '#DDDDE8' }: { name: IconName; color?: string }) {
  if (name === 'menu') {
    return (
      <Svg width={13} height={13} viewBox="0 0 24 24">
        <Circle cx="6" cy="12" r="1.8" fill={color} />
        <Circle cx="12" cy="12" r="1.8" fill={color} />
        <Circle cx="18" cy="12" r="1.8" fill={color} />
      </Svg>
    );
  }
  return null;
}

function quadrantFromSliders(urgency: number, importance: number): Quadrant {
  const { cx, cy } = posFromSliders(urgency, importance);
  return qFromPos(cx, cy);
}

function effortToLevel(time: AgendaTime): number {
  if (time === 'quick') return 1;
  if (time === 'short') return 3;
  if (time === 'medium') return 5;
  return 7;
}

function levelToEffort(level: number): AgendaTime {
  if (level <= 2) return 'quick';
  if (level <= 4) return 'short';
  if (level <= 6) return 'medium';
  return 'deep';
}

function MiniMatrix({ urgency, importance }: { urgency: number; importance: number }) {
  const { cx, cy } = posFromSliders(urgency, importance);
  const q = quadrantFromSliders(urgency, importance);
  const left = 4 + cx * 36;
  const top = 4 + cy * 36;
  return (
    <View style={styles.miniMatrix}>
      <View style={styles.miniGrid}>
        <View style={styles.miniCell} />
        <View style={styles.miniCell} />
        <View style={styles.miniCell} />
        <View style={styles.miniCell} />
      </View>
      <View
        style={[
          styles.miniDot,
          {
            backgroundColor: QUADRANT_META[q].color,
            left,
            top,
          },
        ]}
      />
    </View>
  );
}

function Bubble({
  agenda,
  width,
  height,
  override,
  onDrag,
  onDrop,
  onPress,
  onReveal,
  onTouchStart,
  tokens,
}: {
  agenda: Agenda;
  width: number;
  height: number;
  override?: { cx: number; cy: number };
  onDrag: (id: string, cx: number, cy: number) => void;
  onDrop: (id: string, cx: number, cy: number, moved: boolean) => void;
  onPress: (agenda: Agenda) => void;
  onReveal: (agenda: Agenda) => void;
  onTouchStart: () => void;
  tokens: ThemeTokens;
}) {
  const start = useRef({ cx: agenda.cx, cy: agenda.cy });
  const moved = useRef(false);
  const revealed = useRef(false);
  const display = override ?? { cx: agenda.cx, cy: agenda.cy };
  const q = qFromPos(display.cx, display.cy);
  const meta = QUADRANT_META[q];
  const r = getR(agenda.time);
  const insetX = width > 0 ? clamp(r / width, 0.03, 0.2) : 0.03;
  const insetY = height > 0 ? clamp(r / height, 0.03, 0.2) : 0.03;
  const scale = useRef(new Animated.Value(0.35)).current;
  const isDragging = !!override;
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.07,
        duration: 220,
        easing: Easing.bezier(0.34, 1.56, 0.64, 1),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          onTouchStart();
          moved.current = false;
          revealed.current = false;
          start.current = { cx: agenda.cx, cy: agenda.cy };
          if (revealTimer.current) clearTimeout(revealTimer.current);
          revealTimer.current = setTimeout(() => {
            if (!moved.current) {
              revealed.current = true;
              onReveal(agenda);
            }
          }, 420);
        },
        onPanResponderMove: (_, gestureState) => {
          if (!width || !height) return;
          const cx = clamp(start.current.cx + gestureState.dx / width, insetX, 1 - insetX);
          const cy = clamp(start.current.cy + gestureState.dy / height, insetY, 1 - insetY);
          if (Math.abs(gestureState.dx) / width > 0.004 || Math.abs(gestureState.dy) / height > 0.004) {
            moved.current = true;
            if (revealTimer.current) clearTimeout(revealTimer.current);
          }
          onDrag(agenda.id, cx, cy);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (revealTimer.current) clearTimeout(revealTimer.current);
          if (!width || !height) return;
          const cx = clamp(start.current.cx + gestureState.dx / width, insetX, 1 - insetX);
          const cy = clamp(start.current.cy + gestureState.dy / height, insetY, 1 - insetY);
          onDrop(agenda.id, cx, cy, moved.current);
          if (!moved.current && !revealed.current) onPress(agenda);
        },
        onPanResponderTerminate: () => {
          if (revealTimer.current) clearTimeout(revealTimer.current);
        },
      }),
    [agenda, height, insetX, insetY, onDrag, onDrop, onPress, onReveal, onTouchStart, width],
  );

  const safeCx = clamp(display.cx, insetX, 1 - insetX);
  const safeCy = clamp(display.cy, insetY, 1 - insetY);
  const x = safeCx * width - r;
  const y = safeCy * height - r;

  return (
    <AnimatedPressable
      {...responder.panHandlers}
      onHoverIn={() => onReveal(agenda)}
      style={[
        styles.bubble,
        {
          width: r * 2,
          height: r * 2,
          borderRadius: r,
          left: x,
          top: y,
          backgroundColor: `${meta.color}${agenda.status === 'onhold' ? '20' : '28'}`,
          opacity: agenda.status === 'onhold' ? 0.42 : 1,
          transform: [{ scale: isDragging ? 1.08 : scale }],
          shadowColor: meta.color,
          shadowOpacity: isDragging ? 0.5 : 0.2,
          shadowRadius: isDragging ? 14 : 6,
          shadowOffset: { width: 0, height: 0 },
          elevation: isDragging ? 8 : 2,
          zIndex: isDragging ? 30 : 10,
        },
      ]}
    >
      <Text numberOfLines={1} style={[styles.bubbleText, { color: tokens.text, fontSize: r >= 38 ? 10 : 9.5 }]}>
        {summarizeBubble(agenda.text, agenda.time, r >= 38 ? 25 : r >= 29 ? 20 : 14)}
      </Text>
      {agenda.status === 'onhold' && <Text style={styles.holdOverlay}>⏸</Text>}
    </AnimatedPressable>
  );
}

function createStyles(t: ThemeTokens, formal: boolean) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.bg },
    root: { flex: 1, paddingHorizontal: formal ? 14 : 12, paddingBottom: 14 },
    center: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: t.text },

    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 2, paddingBottom: 6 },
    iconBtn: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: t.surface2,
      borderWidth: 1,
      borderColor: t.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      position: 'absolute',
      right: -5,
      top: -5,
      minWidth: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: t.accent,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

    mitStrip: {
      minHeight: 40,
      marginBottom: 8,
      borderRadius: 12,
      backgroundColor: t.surface2,
      borderWidth: 1,
      borderColor: t.border,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      gap: 8,
    },
    mitStar: { color: t.accent, fontSize: 14 },
    mitText: { color: t.text, fontSize: 12, flex: 1 },
    mitPlaceholder: { color: `${t.muted}CC`, fontSize: 10.5, flex: 1 },
    mitInput: { color: t.text, flex: 1, paddingVertical: 6 },
    filterRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
    filterSegs: { flexDirection: 'row', gap: 5, flex: 1 },
    filterBtn: {
      flex: 1,
      height: 24,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surface2,
    },
    filterBtnActive: { borderColor: `${t.accent}66`, backgroundColor: `${t.accent}0D` },
    filterBtnText: { color: t.muted, fontSize: 10, fontWeight: '500' },
    filterBtnTextActive: { color: t.text },

    matrix: {
      flex: 1,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: `${t.border}`,
      borderRadius: 16,
      position: 'relative',
      overflow: 'hidden',
    },
    qOverlayTL: { position: 'absolute', left: 0, top: 0, width: '50%', height: '50%', backgroundColor: 'rgba(46,204,143,0.03)' },
    qOverlayTR: { position: 'absolute', right: 0, top: 0, width: '50%', height: '50%', backgroundColor: 'rgba(255,92,92,0.03)' },
    qOverlayBL: { position: 'absolute', left: 0, bottom: 0, width: '50%', height: '50%', backgroundColor: 'rgba(107,107,130,0.025)' },
    qOverlayBR: { position: 'absolute', right: 0, bottom: 0, width: '50%', height: '50%', backgroundColor: 'rgba(91,155,255,0.025)' },
    axisH: { position: 'absolute', left: 0, right: 0, top: '50%', height: 2, opacity: 0.78 },
    axisV: { position: 'absolute', top: 0, bottom: 0, left: '50%', width: 2, opacity: 0.78 },
    axisEdgeLabel: { position: 'absolute', color: t.muted, fontSize: 9, letterSpacing: 0.3, opacity: 0.9 },
    axisTickHLeft: { position: 'absolute', left: 14, top: '50%', width: 6, height: 2, marginTop: -1, backgroundColor: t.axis },
    axisTickHRight: { position: 'absolute', right: 14, top: '50%', width: 6, height: 2, marginTop: -1, backgroundColor: t.axis },
    axisTickVTop: { position: 'absolute', top: 14, left: '50%', width: 2, height: 6, marginLeft: -1, backgroundColor: t.axis },
    axisTickVBottom: { position: 'absolute', bottom: 14, left: '50%', width: 2, height: 6, marginLeft: -1, backgroundColor: t.axis },
    watermark: { position: 'absolute', fontSize: 10, opacity: 0.13, fontWeight: '600' },

    bubble: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      overflow: 'hidden',
    },
    bubbleText: { fontSize: 10, textAlign: 'center', fontWeight: '500', width: '86%' },
    holdOverlay: { position: 'absolute', right: 4, top: 4, color: t.text, fontSize: 10 },

    toast: {
      position: 'absolute',
      bottom: 18,
      left: 24,
      right: 24,
      borderRadius: 12,
      backgroundColor: t.surface2,
      borderWidth: 1,
      borderColor: t.border,
      paddingVertical: 9,
      paddingHorizontal: 12,
    },
    toastText: { color: t.text, textAlign: 'center', fontSize: 11 },

    backdrop: { flex: 1, backgroundColor: t.overlay },
    popoverBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)', zIndex: 70 },
    menuPopover: {
      position: 'absolute',
      top: 46,
      right: 14,
      minWidth: 180,
      borderRadius: 12,
      backgroundColor: t.surface2,
      borderWidth: 1,
      borderColor: t.border,
      paddingVertical: 8,
      paddingHorizontal: 10,
      zIndex: 80,
    },
    menuItem: { paddingVertical: 8 },
    menuItemText: { color: t.text, fontSize: 13, fontWeight: '500' },
    menuDivider: { height: 1, backgroundColor: t.border, opacity: 0.5, marginVertical: 7 },
    sheetWrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
    },
    sheet: {
      maxHeight: '82%',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 14,
      width: '100%',
      backgroundColor: t.surface2,
      borderTopWidth: 1,
      borderColor: t.border,
    },
    panelScrollContent: { paddingBottom: 30, paddingRight: 0 },

    panelTitle: { color: t.text, fontSize: 19, fontWeight: '800', marginBottom: 10, width: '100%', letterSpacing: -0.2 },
    textArea: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 12,
      height: 42,
      color: t.text,
      paddingHorizontal: 12,
      marginBottom: 10,
      textAlignVertical: 'center',
      backgroundColor: t.surface,
    },
    textInput: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 12,
      color: t.text,
      paddingHorizontal: 12,
      height: 40,
      width: '100%',
      backgroundColor: t.surface,
    },

    rowControl: { marginBottom: 9, width: '100%' },
    sliderHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    smallLabel: { color: t.text, fontSize: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.95, fontWeight: '700' },
    rowValue: { color: t.muted, fontSize: 11, fontWeight: '500' },
    metric: { color: t.muted, fontSize: 12, marginTop: 6 },
    metricBar: { height: 7, borderRadius: 4, backgroundColor: t.surface, overflow: 'hidden', marginTop: 4 },
    metricFill: { height: 7, borderRadius: 4 },

    addRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 10 },
    sliderCol: { flex: 1, minWidth: 0 },
    previewCol: {
      width: 88,
      minHeight: 90,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 10,
      backgroundColor: t.surface,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      paddingHorizontal: 6,
      gap: 4,
    },
    miniMatrix: { width: 44, height: 44, borderWidth: 1, borderColor: t.border, borderRadius: 8, position: 'relative' },
    miniGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
    miniCell: { width: '50%', height: '50%', borderColor: t.border, borderWidth: 0.3 },
    miniDot: { width: 8, height: 8, borderRadius: 4, position: 'absolute', marginLeft: -4, marginTop: -4 },
    tagWrap: { alignItems: 'center' },
    quadTag: { fontSize: 12, fontWeight: '700' },

    segmentRow: { flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
    effortSliderWrap: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingTop: 7,
      paddingBottom: 6,
      backgroundColor: t.surface,
      marginBottom: 8,
      width: '100%',
    },
    effortValue: { color: t.muted, fontSize: 12, fontWeight: '500' },
    segBtn: {
      flex: 1,
      height: 36,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surface,
    },
    segBtnActive: { borderColor: t.accent, backgroundColor: `${t.accent}1A` },
    segBtnText: { color: t.text, fontSize: 12, fontWeight: '600' },
    segBtnTextActive: { color: t.accent },

    domainBtn: {
      flex: 1,
      height: 38,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surface,
    },
    domainBtnActive: { borderColor: t.accent, backgroundColor: `${t.accent}1A` },
    domainBtnText: { color: t.text, fontSize: 12, fontWeight: '600' },

    submitBtn: {
      height: 40,
      borderRadius: 12,
      backgroundColor: t.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    disabled: { opacity: 0.35 },
    submitText: { color: '#fff', fontWeight: '700' },

    moveText: { color: t.text, fontSize: 13, lineHeight: 19, marginBottom: 8 },
    mutedLine: { color: t.muted, fontSize: 11, marginBottom: 6, lineHeight: 16 },
    metricsWrap: { marginBottom: 8 },

    actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    singleActionRow: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingBottom: 2, minWidth: '100%' },
    primaryBtn: { backgroundColor: t.accent, borderColor: t.accent },
    primaryBtnText: { color: '#fff', fontWeight: '700' },
    actionBtn: {
      minHeight: 36,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surface2,
      marginBottom: 4,
      minWidth: 86,
      flexShrink: 1,
    },
    compactBtn: { minWidth: 38, paddingHorizontal: 8 },
    actionBtnText: { color: t.text, fontSize: 12, fontWeight: '600' },

    sparkInputRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    smallIconBtn: {
      minWidth: 56,
      height: 38,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.surface,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 10,
    },
    smallIconTxt: { color: t.text, fontSize: 12, fontWeight: '600' },

    listItem: {
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.surface,
      borderRadius: 12,
      paddingHorizontal: 9,
      paddingVertical: 6,
      marginBottom: 6,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    listText: { color: t.text, fontSize: 12, lineHeight: 16, flex: 1, minWidth: 0 },
    rowGap: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
    checkBtn: {
      width: 18,
      height: 18,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: t.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surface2,
    },
    checkBtnOn: {
      borderColor: t.accent,
      backgroundColor: `${t.accent}28`,
    },
    checkGlyph: { color: t.accent, fontSize: 12, fontWeight: '700' },
    bulkBar: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 12,
      backgroundColor: t.surface,
      padding: 10,
      marginBottom: 10,
      gap: 8,
    },
    bulkUtilityRow: { flexDirection: 'row', gap: 8 },
    bulkActionRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', paddingTop: 2, justifyContent: 'space-between' },

    suggestionCard: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 12,
      padding: 12,
      marginTop: 10,
      backgroundColor: t.surface,
    },
    expiredText: { textDecorationLine: 'line-through', color: '#b95f5f' },
    settingsSection: { borderWidth: 1, borderColor: t.border, borderRadius: 10, padding: 10, backgroundColor: t.surface },
    settingsLabel: { color: t.text, fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
    settingsHint: { color: t.muted, fontSize: 12, marginTop: 6 },
    helperBtn: {
      minHeight: 34,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: t.border,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 10,
      backgroundColor: t.surface2,
      marginBottom: 8,
      alignSelf: 'flex-start',
    },
    helperBtnText: { color: t.text, fontSize: 12, fontWeight: '600' },
    explainBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.36)', zIndex: 120 },
    explainCard: {
      position: 'absolute',
      left: 20,
      right: 20,
      top: '26%',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.surface2,
      padding: 14,
      zIndex: 121,
    },
    explainTitle: { color: t.text, fontSize: 14, fontWeight: '700', marginBottom: 6 },
    explainText: { color: t.muted, fontSize: 12, lineHeight: 17, marginBottom: 10 },
    quickRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    sparkDockBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: t.surface2,
      borderWidth: 1,
      borderColor: t.border,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 5,
    },
    tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    tagInput: {
      flex: 1,
      minWidth: 0,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 10,
      color: t.text,
      backgroundColor: t.surface2,
      height: 36,
      paddingHorizontal: 10,
    },
    tinyBtn: {
      minHeight: 36,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.border,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surface2,
    },
    tinyBtnText: { color: t.text, fontSize: 11, fontWeight: '600' },
    actionGridCentered: { justifyContent: 'center', alignItems: 'center' },
  });
}

let styles = createStyles(resolveTheme('dark', 'dark'), true);

export function ClearDayScreen() {
  const systemScheme = useColorScheme();
  const {
    ready,
    agendas,
    vault,
    sparks,
    mit,
    reflection,
    weeklyPulse,
    monthlyPulse,
    bootstrap,
    config,
    setThemeMode,
    setVaultExpiryDefault,
    setHoldExpiryDefault,
    setQuadrantLabel,
    addTag,
    removeTag,
    renameTag,
    setMit,
    addAgenda,
    addSpark,
    removeSpark,
    suggestSpark,
    acceptSpark,
    updateAgendaPosition,
    completeAgenda,
    toggleHold,
    setAgendaMit,
    updateAgenda,
    archiveAgenda,
    restoreVaultAgenda,
    deleteVaultAgenda,
    bulkArchiveToVault,
    bulkHold,
    bulkResume,
    bulkDelete,
    runReflection,
    runPulse,
  } = useClearDayStore();
  const tokens = resolveTheme(config.themeMode, systemScheme);
  styles = useMemo(() => createStyles(tokens, true), [tokens]);

  const [panel, setPanel] = useState<Panel>(null);
  const [selectedAgendaId, setSelectedAgendaId] = useState<string | null>(null);
  const [matrixSize, setMatrixSize] = useState({ width: 1, height: 1 });
  const [dragPos, setDragPos] = useState<Record<string, { cx: number; cy: number }>>({});
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreMatrixTapUntil = useRef(0);

  const [newText, setNewText] = useState('');
  const [newUrgency, setNewUrgency] = useState(50);
  const [newImportance, setNewImportance] = useState(50);
  const [newDomain, setNewDomain] = useState<AgendaDomain>('Professional');
  const [newTime, setNewTime] = useState<AgendaTime>('short');
  const [lastAddTap, setLastAddTap] = useState<{ urgency: number; importance: number } | null>(null);
  const [addDraft, setAddDraft] = useState<AddDraft | null>(null);
  const draftReady = useRef(false);
  const draftSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedFilterTags, setSelectedFilterTags] = useState<string[]>([]);

  const [sparkText, setSparkText] = useState('');
  const [sparkSuggestion, setSparkSuggestion] = useState<SparkSuggestion | null>(null);
  const [sparkTarget, setSparkTarget] = useState<Spark | null>(null);
  const [sparkMode, setSparkMode] = useState<'auto' | 'create'>('auto');
  const [craftText, setCraftText] = useState('');
  const [craftUrgency, setCraftUrgency] = useState(50);
  const [craftImportance, setCraftImportance] = useState(50);
  const [craftDomain, setCraftDomain] = useState<AgendaDomain>('Professional');
  const [craftTime, setCraftTime] = useState<AgendaTime>('short');
  const [sparkLoading, setSparkLoading] = useState(false);
  const [sparkBlink] = useState(new Animated.Value(0.4));
  const [isMitEdit, setIsMitEdit] = useState(false);
  const [mitDraft, setMitDraft] = useState('');
  const [editText, setEditText] = useState('');
  const [editDomain, setEditDomain] = useState<AgendaDomain>('Professional');
  const [editTime, setEditTime] = useState<AgendaTime>('short');
  const [editUrgency, setEditUrgency] = useState(50);
  const [editImportance, setEditImportance] = useState(50);
  const [selectedAgendaIds, setSelectedAgendaIds] = useState<string[]>([]);
  const [tagDrafts, setTagDrafts] = useState<Record<string, string>>({});
  const [newTagDraft, setNewTagDraft] = useState('');
  const [quadrantDrafts, setQuadrantDrafts] = useState<Record<Quadrant, string>>(config.quadrantLabels);
  const [showQuadrantExplain, setShowQuadrantExplain] = useState(false);
  const [quadrantEditUnlocked, setQuadrantEditUnlocked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const selectedAgenda = selectedAgendaId ? agendas.find((m) => m.id === selectedAgendaId) ?? null : null;
  const activeTagSet = useMemo(() => new Set(selectedFilterTags.map((t) => t.toLowerCase())), [selectedFilterTags]);
  const activeOnCanvasAgendas = agendas.filter(
    (m) =>
      (m.status === 'active' || m.status === 'onhold') &&
      (activeTagSet.size === 0 || activeTagSet.has(m.domain.toLowerCase())),
  );
  const doneAgendas = agendas.filter((m) => m.status === 'done');
  const onHoldAgendas = agendas.filter((m) => m.status === 'onhold');
  const allAgendas = agendas.filter((m) => m.status !== 'done');
  const vaultExpiryOn = config.vaultExpiryDefault === 'on_60d';
  const holdExpiryOn = config.holdExpiryDefault === 'on_60d';
  const vaultActive = vaultExpiryOn ? vault.filter((v) => !isExpired(v.archivedAt)) : vault;
  const vaultExpired = vaultExpiryOn ? vault.filter((v) => isExpired(v.archivedAt)) : [];

  useEffect(() => {
    bootstrap();
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
    };
  }, [bootstrap]);

  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await loadAddDraft();
      if (!active) return;
      if (stored && stored.text.trim()) {
        setAddDraft(stored);
        setNewText(stored.text);
        setNewUrgency(sanitizeSliderValue(stored.urgency));
        setNewImportance(sanitizeSliderValue(stored.importance));
        setNewDomain(stored.domain);
        setNewTime(stored.time);
      } else {
        setAddDraft(null);
      }
      draftReady.current = true;
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!sparkLoading) {
      sparkBlink.stopAnimation();
      sparkBlink.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkBlink, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(sparkBlink, { toValue: 0.35, duration: 420, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [sparkBlink, sparkLoading]);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 1800);
  }

  function sanitizeSliderValue(value: number): number {
    return Number.isFinite(value) ? Math.round(clamp(value, 5, 95)) : 50;
  }

  function getQuadrantName(quadrant: Quadrant): string {
    return config.quadrantLabels[quadrant] || QUADRANT_META[quadrant].label;
  }

  function getCenterAwareLabel(urgency: number, importance: number): string {
    const pos = posFromSliders(urgency, importance);
    if (isCenterPoint(pos.cx, pos.cy)) return 'Center';
    return getQuadrantName(qFromPos(pos.cx, pos.cy));
  }

  function alignToQuadrant(suggestion: SparkSuggestion): SparkSuggestion {
    let urgency = sanitizeSliderValue(suggestion.urgency);
    let importance = sanitizeSliderValue(suggestion.importance);
    const squeeze = (min: number, max: number, v: number) => clamp(v, min, max);
    if (suggestion.quadrant === 'Q1') {
      urgency = squeeze(58, 92, urgency);
      importance = squeeze(58, 92, importance);
    } else if (suggestion.quadrant === 'Q2') {
      urgency = squeeze(8, 42, urgency);
      importance = squeeze(58, 92, importance);
    } else if (suggestion.quadrant === 'Q3') {
      urgency = squeeze(58, 92, urgency);
      importance = squeeze(8, 42, importance);
    } else {
      urgency = squeeze(8, 42, urgency);
      importance = squeeze(8, 42, importance);
    }
    return { ...suggestion, urgency, importance };
  }

  useEffect(() => {
    if (!selectedAgenda) return;
    setEditText(selectedAgenda.text);
    setEditDomain(selectedAgenda.domain);
    setEditTime(selectedAgenda.time);
    const sliders = slidersFromPos(selectedAgenda.cx, selectedAgenda.cy);
    setEditUrgency(sliders.urgency);
    setEditImportance(sliders.importance);
  }, [selectedAgenda]);

  useEffect(() => {
    const tags = config.tags ?? [];
    setSelectedFilterTags((prev) => {
      if (prev.length === 0) return [...tags];
      const next = prev.filter((p) => tags.some((t) => t.toLowerCase() === p.toLowerCase()));
      return next.length > 0 ? next : [...tags];
    });
    setNewDomain((prev) => tags.find((t) => t.toLowerCase() === prev.toLowerCase()) || tags[0] || prev);
    setCraftDomain((prev) => tags.find((t) => t.toLowerCase() === prev.toLowerCase()) || tags[0] || prev);
    setEditDomain((prev) => tags.find((t) => t.toLowerCase() === prev.toLowerCase()) || tags[0] || prev);
  }, [config.tags]);

  useEffect(() => {
    if (panel !== 'agendaList') clearAgendaSelection();
  }, [panel]);

  useEffect(() => {
    if (panel) setMenuOpen(false);
  }, [panel]);

  useEffect(() => {
    if (panel !== 'settings') return;
    const drafts: Record<string, string> = {};
    config.tags.forEach((tag) => {
      drafts[tag] = tag;
    });
    setTagDrafts(drafts);
    setQuadrantDrafts(config.quadrantLabels);
    setQuadrantEditUnlocked(false);
  }, [panel, config.tags, config.quadrantLabels]);

  useEffect(() => {
    if (!draftReady.current || panel !== 'add') return;
    if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
    draftSaveTimer.current = setTimeout(async () => {
      const clean = newText.trim();
      if (!clean) {
        setAddDraft(null);
        await clearAddDraft();
        return;
      }
      const next: AddDraft = {
        text: clean,
        urgency: sanitizeSliderValue(newUrgency),
        importance: sanitizeSliderValue(newImportance),
        domain: newDomain,
        time: newTime,
        updatedAt: Date.now(),
      };
      setAddDraft(next);
      await saveAddDraft(next);
    }, 220);
  }, [newText, newUrgency, newImportance, newDomain, newTime, panel]);

  async function submitAgenda() {
    const agenda = await addAgenda({
      text: newText,
      domain: newDomain,
      time: newTime,
      urgency: newUrgency,
      importance: newImportance,
    });
    if (!agenda) return;
    setNewText('');
    setAddDraft(null);
    await clearAddDraft();
    setPanel(null);
    showToast(`Placed in ${getQuadrantName(agenda.quadrant)}`);
  }

  async function openAddAtTap(x: number, y: number) {
    if (Date.now() < ignoreMatrixTapUntil.current) return;
    const width = matrixSize.width > 1 ? matrixSize.width : 1;
    const height = matrixSize.height > 1 ? matrixSize.height : 1;
    const xNorm = clamp(x / width, 0, 1);
    const yNorm = clamp(y / height, 0, 1);
    const hitBubble = activeOnCanvasAgendas.some((a) => {
      const r = getR(a.time);
      const mx = a.cx * width;
      const my = a.cy * height;
      const dx = x - mx;
      const dy = y - my;
      return Math.sqrt(dx * dx + dy * dy) <= r + 6;
    });
    if (hitBubble) return;
    const tappedUrgency = matrixSize.width > 1 ? Math.round(clamp(xNorm * 100, 5, 95)) : lastAddTap?.urgency ?? 50;
    const tappedImportance = matrixSize.height > 1 ? Math.round(clamp((1 - yNorm) * 100, 5, 95)) : lastAddTap?.importance ?? 50;
    setLastAddTap({ urgency: tappedUrgency, importance: tappedImportance });
    if (addDraft && addDraft.text.trim()) {
      setNewText(addDraft.text);
      setNewUrgency(sanitizeSliderValue(addDraft.urgency));
      setNewImportance(sanitizeSliderValue(addDraft.importance));
      setNewDomain(addDraft.domain);
      setNewTime(addDraft.time);
    } else {
      setNewUrgency(tappedUrgency);
      setNewImportance(tappedImportance);
    }
    setPanel('add');
  }

  function toggleAgendaSelection(id: string) {
    setSelectedAgendaIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  function clearAgendaSelection() {
    setSelectedAgendaIds([]);
  }

  function toggleFilterTag(tag: string) {
    setSelectedFilterTags((prev) => {
      const exists = prev.some((t) => t.toLowerCase() === tag.toLowerCase());
      if (exists) {
        if (prev.length <= 1) return prev;
        return prev.filter((t) => t.toLowerCase() !== tag.toLowerCase());
      }
      return [...prev, tag];
    });
  }

  async function onSaveTagRename(oldTag: string) {
    const next = (tagDrafts[oldTag] ?? '').trim();
    if (!next || next.toLowerCase() === oldTag.toLowerCase()) return;
    const ok = await renameTag(oldTag, next);
    showToast(ok ? 'Tag renamed' : 'Tag rename failed');
  }

  async function onRemoveTag(tag: string) {
    const ok = await removeTag(tag);
    showToast(ok ? 'Tag removed' : 'At least one tag is required');
  }

  async function onAddTag() {
    const clean = newTagDraft.trim();
    if (!clean) return;
    const ok = await addTag(clean);
    if (ok) {
      setNewTagDraft('');
      showToast('Tag added');
    } else {
      showToast('Tag add failed');
    }
  }

  async function onSaveQuadrantLabels() {
    const keys: Quadrant[] = ['Q1', 'Q2', 'Q3', 'Q4'];
    for (const q of keys) {
      const value = (quadrantDrafts[q] ?? '').trim().slice(0, QUADRANT_LABEL_MAX_LENGTH);
      if (!value) {
        showToast('All quadrant names are required');
        return;
      }
    }
    const results = await Promise.all(
      keys.map((q) => setQuadrantLabel(q, (quadrantDrafts[q] ?? '').trim().slice(0, QUADRANT_LABEL_MAX_LENGTH))),
    );
    if (results.every(Boolean)) showToast('Quadrant labels updated');
    else showToast('Could not update labels');
  }

  if (!ready) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={styles.loadingText}>Loading ClearDay…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>
        <View style={styles.topBar}>
          <Pressable
            style={[styles.mitStrip, { marginBottom: 0, flex: 1, marginRight: 8 }]}
            onPress={() => {
              setMitDraft(mit);
              setIsMitEdit(true);
            }}
          >
            <Text style={styles.mitStar}>🧘</Text>
            {isMitEdit ? (
              <TextInput
                value={mitDraft}
                onChangeText={setMitDraft}
                onBlur={async () => {
                  await setMit(mitDraft);
                  setIsMitEdit(false);
                }}
                onSubmitEditing={async () => {
                  await setMit(mitDraft);
                  setIsMitEdit(false);
                }}
                onKeyPress={async (e) => {
                  if (e.nativeEvent.key === 'Escape') {
                    setMitDraft(mit);
                    setIsMitEdit(false);
                  }
                }}
                autoFocus
                style={styles.mitInput}
                placeholder="Set MIT"
                placeholderTextColor={tokens.muted}
                returnKeyType="done"
              />
            ) : (
              <Text numberOfLines={1} style={mit ? styles.mitText : styles.mitPlaceholder}>
                {mit || 'Set MIT. Choose one meaningful agenda and give it your best energy today.'}
              </Text>
            )}
          </Pressable>
          <IconBtn icon="menu" color={tokens.text} onPress={() => setMenuOpen((v) => !v)} />
        </View>
        {showQuadrantExplain ? (
          <>
            <Pressable style={styles.explainBackdrop} onPress={() => setShowQuadrantExplain(false)} />
            <View style={styles.explainCard}>
              <Text style={styles.explainTitle}>Why these 4 labels?</Text>
              <Text style={styles.explainText}>
                The Eisenhower matrix separates urgency and importance so you can focus on what matters before reacting to noise.
              </Text>
              <View style={styles.rowGap}>
                <ActionBtn
                  label="Continue"
                  onPress={() => {
                    setShowQuadrantExplain(false);
                    setQuadrantEditUnlocked(true);
                  }}
                />
                <ActionBtn label="Cancel" onPress={() => setShowQuadrantExplain(false)} />
              </View>
            </View>
          </>
        ) : null}
        <Pressable
          style={styles.matrix}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setMatrixSize({ width, height });
          }}
          onPress={(e) => openAddAtTap(e.nativeEvent.locationX, e.nativeEvent.locationY)}
        >
          <View style={styles.qOverlayTL} />
          <View style={styles.qOverlayTR} />
          <View style={styles.qOverlayBL} />
          <View style={styles.qOverlayBR} />
          <LinearGradient
            colors={[tokens.axisSoft, tokens.axis, tokens.axisSoft]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.axisH}
          />
          <LinearGradient
            colors={[tokens.axisSoft, tokens.axis, tokens.axisSoft]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.axisV}
          />
          <View style={styles.axisTickHLeft} />
          <View style={styles.axisTickHRight} />
          <View style={styles.axisTickVTop} />
          <View style={styles.axisTickVBottom} />
          <Text style={[styles.axisEdgeLabel, { left: 10, top: '50%', marginTop: 6 }]}>Urgency Low</Text>
          <Text style={[styles.axisEdgeLabel, { right: 10, top: '50%', marginTop: 6 }]}>Urgency High</Text>
          <Text style={[styles.axisEdgeLabel, { left: '50%', marginLeft: -36, top: 10 }]}>Importance High</Text>
          <Text style={[styles.axisEdgeLabel, { left: '50%', marginLeft: -34, bottom: 10 }]}>Importance Low</Text>
          <Text style={[styles.watermark, { color: QUADRANT_META.Q1.color, right: 12, top: 8 }]}>{getQuadrantName('Q1').toUpperCase()}</Text>
          <Text style={[styles.watermark, { color: QUADRANT_META.Q2.color, left: 12, top: 8 }]}>{getQuadrantName('Q2').toUpperCase()}</Text>
          <Text style={[styles.watermark, { color: QUADRANT_META.Q3.color, right: 12, bottom: 8 }]}>{getQuadrantName('Q3').toUpperCase()}</Text>
          <Text style={[styles.watermark, { color: QUADRANT_META.Q4.color, left: 12, bottom: 8 }]}>{getQuadrantName('Q4').toUpperCase()}</Text>

          {activeOnCanvasAgendas.map((agenda) => (
            <Bubble
              key={agenda.id}
              agenda={agenda}
              width={matrixSize.width}
              height={matrixSize.height}
              override={dragPos[agenda.id]}
              onDrag={(id, cx, cy) => setDragPos((prev) => ({ ...prev, [id]: { cx, cy } }))}
              onDrop={async (id, cx, cy, moved) => {
                ignoreMatrixTapUntil.current = Date.now() + 240;
                setDragPos((prev) => {
                  const next = { ...prev };
                  delete next[id];
                  return next;
                });
                if (moved) {
                  await updateAgendaPosition(id, cx, cy);
                  showToast(`Moved to ${getQuadrantName(qFromPos(cx, cy))}`);
                }
              }}
              onPress={(agendaValue) => {
                ignoreMatrixTapUntil.current = Date.now() + 320;
                setSelectedAgendaId(agendaValue.id);
                setPanel('detail');
              }}
              onReveal={(agendaValue) => showToast(agendaValue.text)}
              onTouchStart={() => {
                ignoreMatrixTapUntil.current = Date.now() + 340;
              }}
              tokens={tokens}
            />
          ))}
        </Pressable>

        <View style={styles.filterRow}>
          <View style={styles.filterSegs}>
            {config.tags.map((tag) => {
              const active = selectedFilterTags.some((t) => t.toLowerCase() === tag.toLowerCase());
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.filterBtn, active && styles.filterBtnActive]}
                  onPress={() => toggleFilterTag(tag)}
                >
                  <Text style={[styles.filterBtnText, active && styles.filterBtnTextActive]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={styles.sparkDockBtn}
            onPress={() => setPanel('sparks')}
            accessibilityRole="button"
            accessibilityLabel="Open Sparks"
          >
            <Text style={styles.smallIconTxt}>✎</Text>
          </TouchableOpacity>
        </View>
        {menuOpen ? (
          <>
            <Pressable style={styles.popoverBackdrop} onPress={() => setMenuOpen(false)} />
            <View style={styles.menuPopover}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuOpen(false);
                  setPanel('agendaList');
                }}
              >
                <Text style={styles.menuItemText}>Agendas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuOpen(false);
                  setPanel('hold');
                }}
              >
                <Text style={styles.menuItemText}>On Holds</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuOpen(false);
                  setPanel('vault');
                }}
              >
                <Text style={styles.menuItemText}>Archived</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuOpen(false);
                  setPanel('reflect');
                }}
              >
                <Text style={styles.menuItemText}>Reflection</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuOpen(false);
                  setPanel('pulse');
                }}
              >
                <Text style={styles.menuItemText}>Pulse</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuOpen(false);
                  setPanel('settings');
                }}
              >
                <Text style={styles.menuItemText}>Settings</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        {toast ? (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        ) : null}
      </View>

      <BottomPanel visible={panel !== null} onClose={() => setPanel(null)}>
        {panel === 'add' && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.panelScrollContent}>
            <Text style={styles.panelTitle}>Add Agenda</Text>
            <TextInput
              value={newText}
              onChangeText={setNewText}
              style={styles.textArea}
              placeholder="What is the agenda?"
              placeholderTextColor={tokens.muted}
              maxLength={AGENDA_TITLE_MAX_LENGTH}
              onSubmitEditing={async () => {
                if (!newText.trim()) return;
                await submitAgenda();
              }}
              blurOnSubmit
              returnKeyType="done"
            />

            <View style={styles.addRow}>
              <View style={styles.sliderCol}>
                <RowControl
                  label="URGENCY"
                  value={newUrgency}
                  color={QUADRANT_META.Q1.color}
                  onChange={(v) => setNewUrgency(sanitizeSliderValue(v))}
                />
                <RowControl
                  label="IMPORTANCE"
                  value={newImportance}
                  color={QUADRANT_META.Q2.color}
                  onChange={(v) => setNewImportance(sanitizeSliderValue(v))}
                />
              </View>
              <View style={styles.previewCol}>
                <MiniMatrix urgency={newUrgency} importance={newImportance} />
                <View style={styles.tagWrap}>
                  <Text style={styles.smallLabel}>Quadrant</Text>
                  <Text
                    style={[
                      styles.quadTag,
                      {
                        color: isCenterPoint(posFromSliders(newUrgency, newImportance).cx, posFromSliders(newUrgency, newImportance).cy)
                          ? tokens.muted
                          : QUADRANT_META[quadrantFromSliders(newUrgency, newImportance)].color,
                      },
                    ]}
                  >
                    {getCenterAwareLabel(newUrgency, newImportance)}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.smallLabel}>Effort</Text>
            <View style={styles.effortSliderWrap}>
              <View style={styles.sliderHead}>
                <Text style={styles.smallLabel}>EFFORT</Text>
                <Text style={styles.effortValue}>{effortToLevel(newTime)}</Text>
              </View>
              <Slider
                minimumValue={1}
                maximumValue={7}
                step={1}
                value={effortToLevel(newTime)}
                onValueChange={(v) => setNewTime(levelToEffort(Math.round(v)))}
                minimumTrackTintColor={tokens.accent}
                maximumTrackTintColor={tokens.border}
                thumbTintColor={tokens.accent}
              />
            </View>

            <View style={styles.segmentRow}>
              {config.tags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.domainBtn, newDomain.toLowerCase() === tag.toLowerCase() && styles.domainBtnActive]}
                  onPress={() => setNewDomain(tag)}
                >
                  <Text style={styles.domainBtnText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity disabled={!newText.trim()} style={[styles.submitBtn, !newText.trim() && styles.disabled]} onPress={submitAgenda}>
              <Text style={styles.submitText}>Place in {getCenterAwareLabel(newUrgency, newImportance)}</Text>
            </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {panel === 'detail' && selectedAgenda && (
          <ScrollView contentContainerStyle={styles.panelScrollContent}>
            <Text style={styles.panelTitle}>Edit Agenda</Text>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              style={styles.textInput}
              placeholder="Edit agenda text"
              placeholderTextColor={tokens.muted}
              maxLength={AGENDA_TITLE_MAX_LENGTH}
            />
            <Text style={styles.mutedLine}>{getQuadrantName(selectedAgenda.quadrant)} · {editDomain} · {editTime}</Text>
            <View style={styles.addRow}>
              <View style={styles.sliderCol}>
                <RowControl
                  label="URGENCY"
                  value={editUrgency}
                  color={QUADRANT_META.Q1.color}
                  onChange={(v) => setEditUrgency(sanitizeSliderValue(v))}
                />
                <RowControl
                  label="IMPORTANCE"
                  value={editImportance}
                  color={QUADRANT_META.Q2.color}
                  onChange={(v) => setEditImportance(sanitizeSliderValue(v))}
                />
              </View>
              <View style={styles.previewCol}>
                <MiniMatrix urgency={editUrgency} importance={editImportance} />
                <View style={styles.tagWrap}>
                  <Text style={styles.smallLabel}>Quadrant</Text>
                  <Text
                    style={[
                      styles.quadTag,
                      {
                        color: isCenterPoint(posFromSliders(editUrgency, editImportance).cx, posFromSliders(editUrgency, editImportance).cy)
                          ? tokens.muted
                          : QUADRANT_META[quadrantFromSliders(editUrgency, editImportance)].color,
                      },
                    ]}
                  >
                    {getCenterAwareLabel(editUrgency, editImportance)}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.effortSliderWrap}>
              <View style={styles.sliderHead}>
                <Text style={styles.smallLabel}>EFFORT</Text>
                <Text style={styles.effortValue}>{effortToLevel(editTime)}</Text>
              </View>
              <Slider
                minimumValue={1}
                maximumValue={7}
                step={1}
                value={effortToLevel(editTime)}
                onValueChange={(v) => setEditTime(levelToEffort(Math.round(v)))}
                minimumTrackTintColor={tokens.accent}
                maximumTrackTintColor={tokens.border}
                thumbTintColor={tokens.accent}
              />
            </View>
            <View style={styles.segmentRow}>
              {config.tags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.domainBtn, editDomain.toLowerCase() === tag.toLowerCase() && styles.domainBtnActive]}
                  onPress={() => setEditDomain(tag)}
                >
                  <Text style={styles.domainBtnText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <ActionBtn
              label="Save Edits"
              primary
              onPress={async () => {
                const pos = posFromSliders(editUrgency, editImportance);
                await updateAgenda(selectedAgenda.id, {
                  text: editText.trim() || selectedAgenda.text,
                  domain: editDomain,
                  time: editTime,
                  cx: pos.cx,
                  cy: pos.cy,
                });
                showToast('Agenda updated');
              }}
            />

            <View style={styles.actionGrid}>
              <ActionBtn label="Completed" onPress={async () => { await completeAgenda(selectedAgenda.id); setPanel(null); showToast('Agenda completed'); }} />
              <ActionBtn label="Set MIT" onPress={async () => { await setAgendaMit(selectedAgenda.id); setPanel(null); showToast('MIT updated'); }} />
              <ActionBtn label={selectedAgenda.status === 'onhold' ? 'Bring Back' : 'Put On Hold'} onPress={async () => { await toggleHold(selectedAgenda.id); setPanel(null); showToast(selectedAgenda.status === 'onhold' ? 'Brought back' : 'Moved to On Hold'); }} />
              <ActionBtn label="Archive It" onPress={async () => { await archiveAgenda(selectedAgenda.id); setPanel(null); showToast('Archived'); }} />
            </View>
          </ScrollView>
        )}

        {panel === 'sparks' && (
          <View>
            <Text style={styles.panelTitle}>Sparks</Text>
            <View style={styles.sparkInputRow}>
                <TextInput
                  value={sparkText}
                  onChangeText={setSparkText}
                  placeholder="Capture a raw thought"
                  placeholderTextColor={tokens.muted}
                  maxLength={AGENDA_TITLE_MAX_LENGTH}
                style={[styles.textInput, { flex: 1 }]}
                onSubmitEditing={async () => {
                  if (!sparkText.trim()) return;
                  await addSpark(sparkText);
                  setSparkText('');
                }}
              />
              <TouchableOpacity
                style={styles.smallIconBtn}
                onPress={async () => {
                  if (!sparkText.trim()) return;
                  await addSpark(sparkText);
                  setSparkText('');
                }}
              >
                <Text style={styles.smallIconTxt}>⏎</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {sparks.map((s) => (
                <View key={s.id} style={styles.listItem}>
                  <Text style={styles.listText}>{s.text}</Text>
                  <View style={styles.rowGap}>
                    <ActionBtn
                      compact
                      label="↗"
                      onPress={async () => {
                        setSparkTarget(s);
                        setSparkLoading(true);
                        const result = alignToQuadrant(await suggestSpark(s));
                        setSparkSuggestion(result);
                        setCraftText(result.refined);
                        setCraftUrgency(result.urgency);
                        setCraftImportance(result.importance);
                        setCraftDomain(result.domain);
                        setCraftTime(result.time);
                        setSparkMode('auto');
                        setSparkLoading(false);
                      }}
                    />
                    <ActionBtn compact label="✕" onPress={async () => { await removeSpark(s.id); }} />
                  </View>
                </View>
              ))}
            </ScrollView>

            {sparkLoading && (
              <Animated.Text style={[styles.mutedLine, { opacity: sparkBlink }]}>AI is thinking…</Animated.Text>
            )}

            {sparkSuggestion && sparkTarget && (
              <View style={styles.suggestionCard}>
                <Text style={styles.smallLabel}>AI Suggestion</Text>
                <View style={styles.segmentRow}>
                  <TouchableOpacity style={[styles.domainBtn, sparkMode === 'auto' && styles.domainBtnActive]} onPress={() => setSparkMode('auto')}>
                    <Text style={styles.domainBtnText}>Auto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.domainBtn, sparkMode === 'create' && styles.domainBtnActive]} onPress={() => setSparkMode('create')}>
                    <Text style={styles.domainBtnText}>Create</Text>
                  </TouchableOpacity>
                </View>
                {sparkMode === 'auto' ? (
                  <>
                    <Text style={styles.moveText}>{sparkSuggestion.refined}</Text>
                    <Text style={styles.mutedLine}>{sparkSuggestion.reason}</Text>
                    <Text style={styles.mutedLine}>Quadrant: {getQuadrantName(sparkSuggestion.quadrant)}</Text>
                    <View style={styles.rowGap}>
                      <ActionBtn
                        label="Auto-add"
                        onPress={async () => {
                          await acceptSpark(sparkTarget.id, sparkSuggestion);
                          setSparkSuggestion(null);
                          setSparkTarget(null);
                          showToast('Spark auto-added to matrix');
                        }}
                      />
                      <ActionBtn
                        label="Discard"
                        onPress={() => {
                          setSparkSuggestion(null);
                          setSparkTarget(null);
                        }}
                      />
                    </View>
                  </>
                ) : (
                  <>
                    <TextInput
                      value={craftText}
                      onChangeText={setCraftText}
                      style={styles.textInput}
                      placeholder="Refine this agenda"
                      placeholderTextColor={tokens.muted}
                      maxLength={AGENDA_TITLE_MAX_LENGTH}
                    />
                    <RowControl
                      label="URGENCY"
                      value={craftUrgency}
                      color={QUADRANT_META.Q1.color}
                      onChange={(v) => setCraftUrgency(sanitizeSliderValue(v))}
                    />
                    <RowControl
                      label="IMPORTANCE"
                      value={craftImportance}
                      color={QUADRANT_META.Q2.color}
                      onChange={(v) => setCraftImportance(sanitizeSliderValue(v))}
                    />
                    <View style={styles.segmentRow}>
                      {config.tags.map((tag) => (
                        <TouchableOpacity
                          key={tag}
                          style={[styles.domainBtn, craftDomain.toLowerCase() === tag.toLowerCase() && styles.domainBtnActive]}
                          onPress={() => setCraftDomain(tag)}
                        >
                          <Text style={styles.domainBtnText}>{tag}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.effortSliderWrap}>
                      <View style={styles.sliderHead}>
                        <Text style={styles.smallLabel}>EFFORT</Text>
                        <Text style={styles.effortValue}>{effortToLevel(craftTime)}</Text>
                      </View>
                      <Slider
                        minimumValue={1}
                        maximumValue={7}
                        step={1}
                        value={effortToLevel(craftTime)}
                        onValueChange={(v) => setCraftTime(levelToEffort(Math.round(v)))}
                        minimumTrackTintColor={tokens.accent}
                        maximumTrackTintColor={tokens.border}
                        thumbTintColor={tokens.accent}
                      />
                    </View>
                    <View style={styles.rowGap}>
                      <ActionBtn
                        label="Add to Matrix"
                        onPress={async () => {
                          await addAgenda({
                            text: craftText.trim() || sparkSuggestion.refined,
                            domain: craftDomain,
                            time: craftTime,
                            urgency: craftUrgency,
                            importance: craftImportance,
                          });
                          await removeSpark(sparkTarget.id);
                          setSparkSuggestion(null);
                          setSparkTarget(null);
                          showToast('Spark added with custom settings');
                        }}
                      />
                      <ActionBtn
                        label="Discard"
                        onPress={() => {
                          setSparkSuggestion(null);
                          setSparkTarget(null);
                        }}
                      />
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        )}

        {panel === 'agendaList' && (
          <ScrollView>
            <Text style={styles.panelTitle}>Agenda List</Text>
            <View style={styles.bulkBar}>
              <Text style={styles.mutedLine}>{selectedAgendaIds.length} selected</Text>
              <View style={styles.bulkUtilityRow}>
                <ActionBtn label="Select All" onPress={() => setSelectedAgendaIds(allAgendas.map((a) => a.id))} />
                <ActionBtn label="Clear All" onPress={clearAgendaSelection} />
              </View>
              <View style={styles.menuDivider} />
              <View style={styles.bulkActionRow}>
                <ActionBtn
                  label="Archive It"
                  onPress={async () => {
                    if (selectedAgendaIds.length === 0) return;
                    await bulkArchiveToVault(selectedAgendaIds);
                    clearAgendaSelection();
                    showToast('Archived');
                  }}
                />
                <ActionBtn
                  label="Put On Hold"
                  onPress={async () => {
                    if (selectedAgendaIds.length === 0) return;
                    await bulkHold(selectedAgendaIds);
                    clearAgendaSelection();
                    showToast('Moved to On Hold');
                  }}
                />
                <ActionBtn
                  label="Bring Back"
                  onPress={async () => {
                    if (selectedAgendaIds.length === 0) return;
                    await bulkResume(selectedAgendaIds);
                    clearAgendaSelection();
                    showToast('Brought back');
                  }}
                />
                <ActionBtn
                  label="Delete"
                  onPress={() => {
                    if (selectedAgendaIds.length === 0) return;
                    Alert.alert('Delete selected agendas?', 'This cannot be undone.', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                          await bulkDelete(selectedAgendaIds);
                          clearAgendaSelection();
                          showToast('Deleted selected agendas');
                        },
                      },
                    ]);
                  }}
                />
              </View>
            </View>
            {allAgendas.map((a) => (
              <View key={a.id} style={styles.listItem}>
                <TouchableOpacity
                  style={[styles.checkBtn, selectedAgendaIds.includes(a.id) && styles.checkBtnOn]}
                  onPress={() => toggleAgendaSelection(a.id)}
                >
                  {selectedAgendaIds.includes(a.id) ? <Text style={styles.checkGlyph}>✓</Text> : null}
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listText}>{a.text}</Text>
                  <Text style={styles.mutedLine}>{getQuadrantName(a.quadrant)} · {a.status}</Text>
                </View>
              </View>
            ))}
            {allAgendas.length === 0 && <Text style={styles.mutedLine}>No agendas available</Text>}
          </ScrollView>
        )}

        {panel === 'hold' && (
          <ScrollView>
            <Text style={styles.panelTitle}>On Holds</Text>
            <Text style={styles.mutedLine}>
              Expiry: {holdExpiryOn ? `On (${EXPIRY_DAYS} days, then Archive)` : 'Off'}
            </Text>
            {onHoldAgendas.map((m) => (
              <View key={m.id} style={styles.listItem}>
                <Text style={styles.listText}>{m.text}</Text>
                <View style={styles.rowGap}>
                  <ActionBtn label="Bring Back" onPress={async () => { await toggleHold(m.id); showToast('Brought back'); }} />
                  <ActionBtn label="Archive" onPress={async () => { await archiveAgenda(m.id); showToast('Archived'); }} />
                </View>
              </View>
            ))}
            {onHoldAgendas.length === 0 && <Text style={styles.mutedLine}>No on-hold agendas</Text>}
          </ScrollView>
        )}

        {panel === 'vault' && (
          <ScrollView>
            <Text style={styles.panelTitle}>Archived</Text>
            <Text style={styles.mutedLine}>Expiry: {vaultExpiryOn ? `On (${EXPIRY_DAYS} days)` : 'Off'}</Text>
            <Text style={styles.smallLabel}>Active</Text>
            {vaultActive.map((v) => {
              const days = getVaultDaysLeft(v.archivedAt);
              return (
                <View key={v.id} style={styles.listItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listText}>{v.text}</Text>
                    {vaultExpiryOn ? (
                      <Text style={[styles.mutedLine, days < 10 && { color: QUADRANT_META.Q1.color }]}>{`${days} days left`}</Text>
                    ) : (
                      <Text style={styles.mutedLine}>No expiry</Text>
                    )}
                  </View>
                  <View style={styles.rowGap}>
                    <ActionBtn label="Bring Back" onPress={async () => { await restoreVaultAgenda(v.id); showToast('Brought back'); }} />
                    <ActionBtn label="Delete" onPress={async () => { await deleteVaultAgenda(v.id); showToast('Deleted'); }} />
                  </View>
                </View>
              );
            })}
            {vaultExpiryOn && <Text style={styles.smallLabel}>Expired</Text>}
            {vaultExpired.map((v) => (
              <View key={v.id} style={styles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.listText, styles.expiredText]}>{v.text}</Text>
                  <Text style={styles.mutedLine}>Expired</Text>
                </View>
                <View style={styles.rowGap}>
                  <ActionBtn label="Delete" onPress={async () => { await deleteVaultAgenda(v.id); showToast('Deleted'); }} />
                </View>
              </View>
            ))}
            {vault.length === 0 && <Text style={styles.mutedLine}>Archive is empty</Text>}
          </ScrollView>
        )}

        {panel === 'reflect' && (
          <View>
            <Text style={styles.panelTitle}>End of Day Reflection</Text>
            <ActionBtn label="Generate" onPress={async () => { await runReflection(); }} />
            <Text style={styles.moveText}>{reflection || `Done agendas: ${doneAgendas.length}. MIT: ${mit || 'not set'}.`}</Text>
          </View>
        )}

        {panel === 'pulse' && (
          <View>
            <Text style={styles.panelTitle}>Pulse</Text>
            <View style={styles.rowGap}>
              <ActionBtn label="This Week" onPress={async () => runPulse('week')} />
              <ActionBtn label="This Month" onPress={async () => runPulse('month')} />
            </View>
            {weeklyPulse && (
              <View style={styles.suggestionCard}>
                <Text style={styles.smallLabel}>{weeklyPulse.title}</Text>
                {weeklyPulse.lines.map((line) => (
                  <Text key={line} style={styles.mutedLine}>{line}</Text>
                ))}
              </View>
            )}
            {monthlyPulse && (
              <View style={styles.suggestionCard}>
                <Text style={styles.smallLabel}>{monthlyPulse.title}</Text>
                {monthlyPulse.lines.map((line) => (
                  <Text key={line} style={styles.mutedLine}>{line}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {panel === 'settings' && (
          <View>
            <Text style={styles.panelTitle}>Settings</Text>
            <View style={styles.settingsSection}>
              <Text style={styles.settingsLabel}>Appearance</Text>
              <View style={styles.segmentRow}>
                {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.domainBtn, config.themeMode === mode && styles.domainBtnActive]}
                    onPress={async () => setThemeMode(mode)}
                  >
                    <Text style={styles.domainBtnText}>{mode[0].toUpperCase() + mode.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.settingsLabel}>Archive Expiry Default</Text>
              <View style={styles.segmentRow}>
                <TouchableOpacity
                  style={[styles.domainBtn, config.vaultExpiryDefault === 'off' && styles.domainBtnActive]}
                  onPress={async () => setVaultExpiryDefault('off')}
                >
                  <Text style={styles.domainBtnText}>Off</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.domainBtn, config.vaultExpiryDefault === 'on_60d' && styles.domainBtnActive]}
                  onPress={async () => setVaultExpiryDefault('on_60d')}
                >
                  <Text style={styles.domainBtnText}>On · 60 Days</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.settingsLabel}>On Hold Expiry Default</Text>
              <View style={styles.segmentRow}>
                <TouchableOpacity
                  style={[styles.domainBtn, config.holdExpiryDefault === 'off' && styles.domainBtnActive]}
                  onPress={async () => setHoldExpiryDefault('off')}
                >
                  <Text style={styles.domainBtnText}>Off</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.domainBtn, config.holdExpiryDefault === 'on_60d' && styles.domainBtnActive]}
                  onPress={async () => setHoldExpiryDefault('on_60d')}
                >
                  <Text style={styles.domainBtnText}>On · 60 Days</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.settingsLabel}>Tags</Text>
              {config.tags.map((tag) => (
                <View key={tag} style={styles.tagRow}>
                  <TextInput
                    value={tagDrafts[tag] ?? tag}
                    onChangeText={(value) =>
                      setTagDrafts((prev) => ({
                        ...prev,
                        [tag]: value,
                      }))
                    }
                    style={styles.tagInput}
                    placeholder="Tag name"
                    placeholderTextColor={tokens.muted}
                    maxLength={TAG_MAX_LENGTH}
                  />
                  <TouchableOpacity style={styles.tinyBtn} onPress={() => onSaveTagRename(tag)}>
                    <Text style={styles.tinyBtnText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.tinyBtn} onPress={() => onRemoveTag(tag)}>
                    <Text style={styles.tinyBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {config.tags.length < 4 && (
                <View style={styles.tagRow}>
                  <TextInput
                    value={newTagDraft}
                    onChangeText={setNewTagDraft}
                    style={styles.tagInput}
                    placeholder="Add tag"
                    placeholderTextColor={tokens.muted}
                    maxLength={TAG_MAX_LENGTH}
                  />
                  <TouchableOpacity style={styles.tinyBtn} onPress={onAddTag}>
                    <Text style={styles.tinyBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              )}
              <Text style={styles.settingsLabel}>Quadrant Labels</Text>
              {!quadrantEditUnlocked ? (
                <TouchableOpacity style={styles.helperBtn} onPress={() => setShowQuadrantExplain(true)}>
                  <Text style={styles.helperBtnText}>Edit Labels</Text>
                </TouchableOpacity>
              ) : null}
              {quadrantEditUnlocked ? (
                <>
                  {(['Q1', 'Q2', 'Q3', 'Q4'] as Quadrant[]).map((q) => (
                    <View key={q} style={styles.tagRow}>
                      <Text style={[styles.smallLabel, { width: 26, marginBottom: 0 }]}>{q}</Text>
                      <TextInput
                        value={quadrantDrafts[q] ?? ''}
                        onChangeText={(value) =>
                          setQuadrantDrafts((prev) => ({
                            ...prev,
                            [q]: value,
                          }))
                        }
                        style={styles.tagInput}
                        placeholder="Label"
                        placeholderTextColor={tokens.muted}
                        maxLength={QUADRANT_LABEL_MAX_LENGTH}
                      />
                    </View>
                  ))}
                  <TouchableOpacity style={styles.tinyBtn} onPress={onSaveQuadrantLabels}>
                    <Text style={styles.tinyBtnText}>Save Labels</Text>
                  </TouchableOpacity>
                </>
              ) : null}
              <Text style={styles.settingsHint}>On Hold expiry moves expired agendas to Archive automatically.</Text>
            </View>
          </View>
        )}
      </BottomPanel>
    </SafeAreaView>
  );
}

function BottomPanel({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const panelWidth = Platform.OS === 'web' ? Math.min(Math.max(width - 24, 320), 560) : width;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheetWrap}>
        <View style={[styles.sheet, { width: panelWidth }]}>{children}</View>
      </View>
    </Modal>
  );
}

function IconBtn({ icon, color, onPress, badge }: { icon: IconName; color: string; onPress: () => void; badge?: number }) {
  return (
    <TouchableOpacity style={styles.iconBtn} onPress={onPress}>
      <Icon name={icon} color={color} />
      {!!badge && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function ActionBtn({
  label,
  onPress,
  compact = false,
  primary = false,
}: {
  label: string;
  onPress: () => void;
  compact?: boolean;
  primary?: boolean;
}) {
  return (
    <TouchableOpacity style={[styles.actionBtn, compact && styles.compactBtn, primary && styles.primaryBtn]} onPress={onPress}>
      <Text style={[styles.actionBtnText, primary && styles.primaryBtnText]}>{label}</Text>
    </TouchableOpacity>
  );
}

function RowControl({
  label,
  value,
  color,
  onChange,
}: {
  label: string;
  value: number;
  color: string;
  onChange: (value: number) => void;
}) {
  const safeValue = Number.isFinite(value) ? Math.round(clamp(value, 5, 95)) : 50;
  return (
    <View style={styles.rowControl}>
      <View style={styles.sliderHead}>
        <Text style={styles.smallLabel}>{label}</Text>
        <Text style={styles.rowValue}>{safeValue}</Text>
      </View>
      <Slider
        minimumValue={5}
        maximumValue={95}
        step={1}
        value={safeValue}
        onValueChange={(v) => onChange(Number.isFinite(v) ? v : 50)}
        minimumTrackTintColor={color}
        maximumTrackTintColor="rgba(255,255,255,0.12)"
        thumbTintColor="#A78BFA"
      />
    </View>
  );
}
