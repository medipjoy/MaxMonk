import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

interface Props {
  onPress: () => void;
  onMoveBy: (delta: number) => void;
  content: React.ReactNode;
  actions: React.ReactNode;
  borderColor: string;
  backgroundColor?: string;
  dragBackgroundColor?: string;
}

const ROW_HEIGHT = 44;
const LONG_PRESS_MS = 260;

export function LongPressReorderRow({
  onPress,
  onMoveBy,
  content,
  actions,
  borderColor,
  backgroundColor,
  dragBackgroundColor,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const armedRef = useRef(false);
  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const lastStepRef = useRef(0);
  const movedRef = useRef(false);
  const pressAtRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const contentHandlers = useMemo(() => {
    return {
      onTouchStart: (e: any) => {
        movedRef.current = false;
        armedRef.current = false;
        lastStepRef.current = 0;
        pressAtRef.current = Date.now();
        startYRef.current = e?.nativeEvent?.pageY ?? 0;
        startXRef.current = e?.nativeEvent?.pageX ?? 0;
        clearTimer();
        timerRef.current = setTimeout(() => {
          armedRef.current = true;
        }, LONG_PRESS_MS);
      },
      onTouchMove: (e: any) => {
        const y = e?.nativeEvent?.pageY ?? 0;
        const x = e?.nativeEvent?.pageX ?? 0;
        const dy = y - startYRef.current;
        const dx = x - startXRef.current;
        if (!movedRef.current && (Math.abs(dy) > 6 || Math.abs(dx) > 6)) {
          movedRef.current = true;
          // If they start scrolling before long-press arms, don't intercept.
          if (!armedRef.current) clearTimer();
        }
      },
      onTouchEnd: () => {
        clearTimer();
        // If we never armed and didn't move, treat it as a normal tap.
        if (!dragging && !armedRef.current && !movedRef.current && Date.now() - pressAtRef.current < LONG_PRESS_MS) {
          onPress();
        }
        armedRef.current = false;
        setDragging(false);
        lastStepRef.current = 0;
      },
      onTouchCancel: () => {
        clearTimer();
        armedRef.current = false;
        setDragging(false);
        lastStepRef.current = 0;
      },
      onMoveShouldSetResponder: () => armedRef.current,
      onResponderGrant: () => {
        // Now we own the responder: stop scroll and start reordering.
        setDragging(true);
      },
      onResponderMove: (e: any) => {
        if (!armedRef.current) return;
        const y = e?.nativeEvent?.pageY ?? 0;
        const dy = y - startYRef.current;
        const step = Math.trunc(dy / ROW_HEIGHT);
        const delta = step - lastStepRef.current;
        if (delta !== 0) {
          lastStepRef.current = step;
          onMoveBy(delta);
        }
      },
      onResponderRelease: () => {
        clearTimer();
        armedRef.current = false;
        setDragging(false);
        lastStepRef.current = 0;
      },
      onResponderTerminate: () => {
        clearTimer();
        armedRef.current = false;
        setDragging(false);
        lastStepRef.current = 0;
      },
    };
  }, [dragging, onMoveBy, onPress]);

  return (
    <View
      style={{
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: borderColor,
        backgroundColor: dragging ? (dragBackgroundColor ?? backgroundColor) : backgroundColor,
      }}
    >
      <View
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 44 }}
        {...(contentHandlers as any)}
      >
        {content}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>{actions}</View>
    </View>
  );
}
