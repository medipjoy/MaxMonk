import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, LayoutChangeEvent,
  TouchableOpacity, TouchableWithoutFeedback, PanResponder,
  Animated, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Text as SvgText, Rect } from 'react-native-svg';
import { useClearDayStore } from '../clearday/store';
import { ThemeTokens } from '../clearday/theme';
import { getFontSet } from '../clearday/fonts';
import { moderateScale, fontScale } from '../clearday/scale';
import { NavCtx } from '../clearday/ClarityApp';
import { MITStrip } from '../components/MITStrip';
import { Agenda, AgendaTime, MatrixStyle } from '../clearday/types';

const EFFORT_RADII: Record<string, number> = { quick: 20, short: 29, medium: 38, deep: 50 };

function getRadius(time: string) { return EFFORT_RADII[time] ?? 29; }

function qColor(q: string, tokens: ThemeTokens) {
  switch (q) { case 'Q1': return tokens.q1; case 'Q2': return tokens.q2; case 'Q3': return tokens.q3; default: return tokens.q4; }
}
function qWash(q: string, tokens: ThemeTokens) {
  switch (q) { case 'Q1': return tokens.q1Wash; case 'Q2': return tokens.q2Wash; case 'Q3': return tokens.q3Wash; default: return tokens.q4Wash; }
}

interface Props {
  tokens: ThemeTokens;
  fontChoice: string;
  matrixStyle: MatrixStyle;
  onPillToggle?: () => void;
}

export function MatrixScreen({ tokens, fontChoice, matrixStyle, onPillToggle }: Props) {
  const insets = useSafeAreaInsets();
  const fonts = getFontSet(fontChoice as any);
  const nav = useContext(NavCtx);
  const { agendas, mit, updateAgendaPosition, updateAgenda } = useClearDayStore();

  const [selectedTags, setSelectedTags] = useState<Set<string> | null>(null); // null = all
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<View>(null);
  // Single vs double tap detection
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tapCountRef = useRef(0);
  const lastTapPositionRef = useRef({ x: 0, y: 0 });

  const config = useClearDayStore(s => s.config);
  const allTags = config.tags;
  const quadrantLabels = config.quadrantLabels;
  const fontSizeMultiplier = useClearDayStore(s => s.config?.fontSizeMultiplier ?? 1.0);

  const effectiveTags = selectedTags ?? new Set(allTags);

  const activeAgendas = agendas.filter(a =>
    a.status === 'active' &&
    effectiveTags.has(a.domain)
  );

  const q1Count = agendas.filter(a => a.status === 'active' && a.quadrant === 'Q1').length;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setCanvasSize({ width, height });
  }, []);

  const openAddAtPosition = (locationX: number, locationY: number) => {
    if (canvasSize.width === 0) return;
    const urgency = Math.max(0, Math.min(100, Math.round((locationX / canvasSize.width) * 100)));
    const importance = Math.max(0, Math.min(100, Math.round((1 - locationY / canvasSize.height) * 100)));
    // If a single tag filter is active, pre-select that domain
    const defaultDomain = selectedTags && selectedTags.size === 1 ? Array.from(selectedTags)[0] : undefined;
    nav.setAddSheetPreset({ urgency, importance, defaultDomain });
    nav.openPanel('add');
  };

  const handleCanvasTap = (evt: any) => {
    const { locationX, locationY } = evt.nativeEvent;
    lastTapPositionRef.current = { x: locationX, y: locationY };
    tapCountRef.current += 1;

    if (tapCountRef.current === 1) {
      // Wait to see if a second tap arrives
      tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
        // Single tap → toggle pill
        if (onPillToggle) onPillToggle();
      }, 280);
    } else if (tapCountRef.current === 2) {
      // Double tap → open add sheet at position
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      tapCountRef.current = 0;
      openAddAtPosition(lastTapPositionRef.current.x, lastTapPositionRef.current.y);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: tokens.bg },
    filterRow: { height: 26, paddingHorizontal: 10, flexDirection: 'row', gap: 2, alignItems: 'center', justifyContent: 'center' },
    chip: { flexDirection: 'row', alignItems: 'center', borderRadius: 2, paddingHorizontal: 6, paddingVertical: 1, gap: 4 },
    chipDot: { width: 3, height: 3, borderRadius: 1.5 },
    chipText: { fontSize: fontScale(8.5, fontSizeMultiplier) },
    canvas: { flex: 1, position: 'relative' },
    q1Warning: {
      position: 'absolute', right: 6, bottom: canvasSize.height / 2 + 4,
      backgroundColor: 'rgba(184,50,50,0.08)', borderWidth: 1, borderColor: 'rgba(184,50,50,0.22)',
      borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2,
    },
  });

  const renderBackground = () => {
    const { width: W, height: H } = canvasSize;
    if (W === 0) return null;

    const svgW = W;
    const svgH = H;

    if (matrixStyle === 'editorial') {
      return (
        <Svg width={svgW} height={svgH} style={{ position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
          <Line x1={svgW / 2} y1={0} x2={svgW / 2} y2={svgH} stroke={tokens.axisLine} strokeWidth={1} />
          <Line x1={0} y1={svgH / 2} x2={svgW} y2={svgH / 2} stroke={tokens.axisLine} strokeWidth={1} />
          <SvgText x={svgW / 2 - 4} y={svgH / 2 - 6} fontSize={10.5 * fontSizeMultiplier} fill={tokens.q2} opacity={0.24} fontStyle="italic" textAnchor="end">{quadrantLabels.Q2}</SvgText>
          <SvgText x={svgW / 2 + 4} y={svgH / 2 - 6} fontSize={10.5 * fontSizeMultiplier} fill={tokens.q1} opacity={0.24} fontStyle="italic">{quadrantLabels.Q1}</SvgText>
          <SvgText x={svgW / 2 - 4} y={svgH / 2 + 14} fontSize={10.5 * fontSizeMultiplier} fill={tokens.q4} opacity={0.24} fontStyle="italic" textAnchor="end">{quadrantLabels.Q4}</SvgText>
          <SvgText x={svgW / 2 + 4} y={svgH / 2 + 14} fontSize={10.5 * fontSizeMultiplier} fill={tokens.q3} opacity={0.24} fontStyle="italic">{quadrantLabels.Q3}</SvgText>
        </Svg>
      );
    }

    if (matrixStyle === 'paper') {
      const minorLines: React.ReactElement[] = [];
      const majorLines: React.ReactElement[] = [];
      const gridStep = 10;
      const centerX = Math.round(svgW / (gridStep * 2)) * (gridStep * 2);
      for (let x = 0; x <= svgW; x += gridStep) {
        (x % 50 === 0 ? majorLines : minorLines).push(
          <Line key={`vx${x}`} x1={x} y1={0} x2={x} y2={svgH} stroke="rgba(0,0,0,0.04)" strokeWidth={1} />
        );
      }
      for (let y = 0; y <= svgH; y += gridStep) {
        (y % 50 === 0 ? majorLines : minorLines).push(
          <Line key={`hy${y}`} x1={0} y1={y} x2={svgW} y2={y} stroke="rgba(0,0,0,0.04)" strokeWidth={1} />
        );
      }
      return (
        <Svg width={svgW} height={svgH} style={{ position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
          <Rect width={svgW} height={svgH} fill="white" />
          {minorLines}
          {majorLines.map((l, i) => <Line key={`mj${i}`} x1={(l.props as any).x1} y1={(l.props as any).y1} x2={(l.props as any).x2} y2={(l.props as any).y2} stroke="rgba(0,0,0,0.08)" strokeWidth={1} />)}
          <Line x1={centerX} y1={0} x2={centerX} y2={svgH} stroke="rgba(0,0,0,0.14)" strokeWidth={1} />
          <Line x1={0} y1={svgH / 2} x2={svgW} y2={svgH / 2} stroke="rgba(0,0,0,0.14)" strokeWidth={1} />
          <SvgText x={centerX + 8} y={22} fontSize={8.5 * fontSizeMultiplier} fill={tokens.textGhost} fontStyle="italic">Important →</SvgText>
          <SvgText x={svgW - 4} y={svgH / 2 - 4} fontSize={8.5 * fontSizeMultiplier} fill={tokens.textGhost} textAnchor="end" fontStyle="italic">Urgency →</SvgText>
        </Svg>
      );
    }

    // Tinted (default)
    return (
      <Svg width={svgW} height={svgH} style={{ position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
        <Rect x={0} y={0} width={svgW / 2} height={svgH / 2} fill={tokens.q2Wash} />
        <Rect x={svgW / 2} y={0} width={svgW / 2} height={svgH / 2} fill={tokens.q1Wash} />
        <Rect x={0} y={svgH / 2} width={svgW / 2} height={svgH / 2} fill={tokens.q4Wash} />
        <Rect x={svgW / 2} y={svgH / 2} width={svgW / 2} height={svgH / 2} fill={tokens.q3Wash} />
        <Line x1={0} y1={svgH / 2} x2={svgW} y2={svgH / 2} stroke={tokens.axisLine} strokeWidth={1} />
        <Line x1={svgW / 2} y1={0} x2={svgW / 2} y2={svgH} stroke={tokens.axisLine} strokeWidth={1} />
        {/* Watermarks — near axis center */}
        <SvgText x={svgW / 2 - 4} y={svgH / 2 - 6} fontSize={9.5 * fontSizeMultiplier} fill={tokens.q2} opacity={0.38} fontStyle="italic" textAnchor="end">{quadrantLabels.Q2}</SvgText>
        <SvgText x={svgW / 2 + 4} y={svgH / 2 - 6} fontSize={9.5 * fontSizeMultiplier} fill={tokens.q1} opacity={0.38} fontStyle="italic">{quadrantLabels.Q1}</SvgText>
        <SvgText x={svgW / 2 - 4} y={svgH / 2 + 14} fontSize={9.5 * fontSizeMultiplier} fill={tokens.q4} opacity={0.38} fontStyle="italic" textAnchor="end">{quadrantLabels.Q4}</SvgText>
        <SvgText x={svgW / 2 + 4} y={svgH / 2 + 14} fontSize={9.5 * fontSizeMultiplier} fill={tokens.q3} opacity={0.38} fontStyle="italic">{quadrantLabels.Q3}</SvgText>
      </Svg>
    );
  };

  // Canvas dimensions (no padding — full edge-to-edge)
  const innerW = canvasSize.width;
  const innerH = canvasSize.height;

  return (
    <View style={s.container}>
      {/* MIT Strip */}
      <MITStrip tokens={tokens} fontChoice={fontChoice} mitText={mit} onPress={() => nav.openPanel('mitSelector')} />

      {/* Filter Row */}
      <View style={s.filterRow}>
        {allTags.map((tag, i) => {
          const isSelected = selectedTags === null || selectedTags.has(tag);
          const tagColor = tokens.accent;
          return (
            <TouchableOpacity
              key={tag}
              onPress={() => {
                if (selectedTags === null) {
                  setSelectedTags(new Set([tag]));
                } else {
                  const next = new Set(selectedTags);
                  if (next.has(tag)) { next.delete(tag); if (next.size === 0) setSelectedTags(null); else setSelectedTags(next); }
                  else { next.add(tag); if (next.size === allTags.length) setSelectedTags(null); else setSelectedTags(next); }
                }
              }}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <View style={[s.chip, {
                borderWidth: isSelected ? 1 : 0.5,
                borderColor: isSelected ? tokens.accent : tokens.borderMid,
              }]}>
                <View style={[s.chipDot, { backgroundColor: tagColor }]} />
                <Text style={[s.chipText, { fontFamily: fonts.label, color: isSelected ? tokens.accent : tokens.textGhost }]}>
                  {tag.slice(0, 3)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Matrix Canvas */}
      <View ref={canvasRef} style={s.canvas} onLayout={onLayout}>
        {/* Background — tappable for single/double-tap */}
        <TouchableWithoutFeedback onPress={handleCanvasTap}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            {renderBackground()}
          </View>
        </TouchableWithoutFeedback>

        {/* Bubbles — rendered above background, each owns its own gesture */}
        {innerW > 0 && activeAgendas.map(agenda => (
          <Bubble
            key={agenda.id}
            agenda={agenda}
            tokens={tokens}
            fonts={fonts}
            canvasWidth={innerW}
            canvasHeight={innerH}
            onTap={() => { nav.setBubbleActionId(agenda.id); nav.openPanel('bubbleAction'); }}
            onEdit={() => { nav.setEditAgendaId(agenda.id); nav.openPanel('edit'); }}
            onDrop={(cx, cy) => updateAgendaPosition(agenda.id, cx, cy)}
            onResize={(time) => updateAgenda(agenda.id, { time })}
          />
        ))}

        {q1Count > 5 && (
          <View style={s.q1Warning}>
            <Text style={{ fontFamily: fonts.serifItalic, fontSize: 6.5, color: tokens.q1 }}>
              5+ items — consider delegating
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ---- Bubble Component ----
interface BubbleProps {
  agenda: Agenda;
  tokens: ThemeTokens;
  fonts: any;
  canvasWidth: number;
  canvasHeight: number;
  onTap: () => void;
  onEdit: () => void;
  onDrop: (cx: number, cy: number) => void;
  onResize: (time: AgendaTime) => void;
}

const EFFORT_STEPS: AgendaTime[] = ['quick', 'short', 'medium', 'deep'];

function Bubble({ agenda, tokens, fonts, canvasWidth, canvasHeight, onTap, onEdit, onDrop, onResize }: BubbleProps) {
  const radius = getRadius(agenda.time);
  const color = qColor(agenda.quadrant, tokens);
  const wash = qWash(agenda.quadrant, tokens);
  const fontSizeMultiplier = useClearDayStore(s => s.config?.fontSizeMultiplier ?? 1.0);
  // Clamp cx/cy so bubbles near edges remain fully visible
  const clampedCx = Math.max(0.03, Math.min(0.97, agenda.cx));
  const clampedCy = Math.max(0.03, Math.min(0.97, agenda.cy));

  const posX = useRef(new Animated.Value(clampedCx * canvasWidth - radius)).current;
  const posY = useRef(new Animated.Value(clampedCy * canvasHeight - radius)).current;

  const dragging = useRef(false);
  const lastPos = useRef({ x: clampedCx * canvasWidth, y: clampedCy * canvasHeight });
  const didMove = useRef(false);
  const lastTapTime = useRef(0);
  const resizeMode = useRef(false);
  const resizeStartIndex = useRef(0);
  const [previewTime, setPreviewTime] = useState<AgendaTime>(agenda.time);
  const previewTimeRef = useRef<AgendaTime>(agenda.time);

  // Stable refs for values used inside PanResponder callbacks
  const sizeRef = useRef({ w: canvasWidth, h: canvasHeight, r: radius });
  sizeRef.current = { w: canvasWidth, h: canvasHeight, r: radius };
  const cbRef = useRef({ onTap, onEdit, onDrop });
  cbRef.current = { onTap, onEdit, onDrop };

  useEffect(() => {
    setPreviewTime(agenda.time);
    previewTimeRef.current = agenda.time;
  }, [agenda.time]);

  const fontSize = radius > 40 ? 8 : radius > 28 ? 7 : 6.5;
  const isOnHold = agenda.status === 'onhold';

  useEffect(() => {
    if (dragging.current) return;
    const nextX = clampedCx * canvasWidth - radius;
    const nextY = clampedCy * canvasHeight - radius;
    lastPos.current = { x: clampedCx * canvasWidth, y: clampedCy * canvasHeight };
    Animated.spring(posX, { toValue: nextX, useNativeDriver: false }).start();
    Animated.spring(posY, { toValue: nextY, useNativeDriver: false }).start();
  }, [clampedCx, clampedCy, canvasWidth, canvasHeight, radius, posX, posY]);

  // Single stable PanResponder — tap opens action sheet, drag moves bubble, double-tap edits
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 3 || Math.abs(gs.dy) > 3,

    onPanResponderGrant: (evt) => {
      dragging.current = true;
      didMove.current = false;
      resizeMode.current = false;

      // Only enter resize when grabbing the outline ring (not the center).
      const lx = evt?.nativeEvent?.locationX ?? radius;
      const ly = evt?.nativeEvent?.locationY ?? radius;
      const dx = lx - radius;
      const dy = ly - radius;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const tol = Math.max(8, radius * 0.18);
      if (Math.abs(dist - radius) <= tol) {
        resizeMode.current = true;
        resizeStartIndex.current = Math.max(0, EFFORT_STEPS.indexOf(agenda.time));
        setPreviewTime(agenda.time);
      }
    },

    onPanResponderMove: (_, gs) => {
      if (Math.abs(gs.dx) > 3 || Math.abs(gs.dy) > 3) {
        didMove.current = true;
      }
      if (resizeMode.current) {
        const stepDelta = -Math.trunc(gs.dy / 36);
        const nextIndex = Math.max(0, Math.min(EFFORT_STEPS.length - 1, resizeStartIndex.current + stepDelta));
        const next = EFFORT_STEPS[nextIndex];
        previewTimeRef.current = next;
        setPreviewTime(next);
        return;
      }
      const { w, h, r } = sizeRef.current;
      const nx = Math.max(r, Math.min(w - r, lastPos.current.x + gs.dx));
      const ny = Math.max(r, Math.min(h - r, lastPos.current.y + gs.dy));
      posX.setValue(nx - r);
      posY.setValue(ny - r);
    },

    onPanResponderRelease: (_, gs) => {
      dragging.current = false;

      if (resizeMode.current) {
        resizeMode.current = false;
        if (previewTimeRef.current !== agenda.time) onResize(previewTimeRef.current);
        return;
      }
      if (!didMove.current) {
        // Tap (no drag) — detect single vs double
        const now = Date.now();
        if (now - lastTapTime.current < 300) {
          cbRef.current.onEdit();
          lastTapTime.current = 0;
        } else {
          lastTapTime.current = now;
          cbRef.current.onTap();
        }
        return;
      }

      // Drag completed — commit new position
      const { w, h, r } = sizeRef.current;
      const nx = Math.max(r, Math.min(w - r, lastPos.current.x + gs.dx));
      const ny = Math.max(r, Math.min(h - r, lastPos.current.y + gs.dy));
      const newCx = Math.max(0.03, Math.min(0.97, nx / w));
      const newCy = Math.max(0.03, Math.min(0.97, ny / h));
      lastPos.current = { x: newCx * w, y: newCy * h };
      posX.setValue(newCx * w - r);
      posY.setValue(newCy * h - r);
      cbRef.current.onDrop(newCx, newCy);
    },
  }), [agenda.time, onResize, posX, posY, radius]);

  const size = radius * 2;
  const previewRadius = getRadius(previewTime);
  const previewSize = previewRadius * 2;
  const centerOffset = radius - previewRadius;
  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        {
          position: 'absolute',
          width: previewSize,
          height: previewSize,
          borderRadius: previewRadius,
          backgroundColor: wash,
          borderWidth: 1.5,
          borderColor: color + 'BF', // 75% opacity
          justifyContent: 'center',
          alignItems: 'center',
          opacity: isOnHold ? 0.42 : 1,
        },
        { transform: [{ translateX: posX }, { translateY: posY }, { translateX: centerOffset }, { translateY: centerOffset }] },
      ]}
    >
      <Text
        style={{
          fontFamily: fonts.serif,
          fontSize: fontScale(fontSize, fontSizeMultiplier),
          color: tokens.text,
          textAlign: 'center',
          paddingHorizontal: 4,
        }}
        numberOfLines={2}
      >
        {agenda.text}
      </Text>
      {isOnHold && (
        <Text style={{ position: 'absolute', top: 2, right: 3, fontSize: fontScale(8, fontSizeMultiplier), color: tokens.textGhost }}>–</Text>
      )}
    </Animated.View>
  );
}
