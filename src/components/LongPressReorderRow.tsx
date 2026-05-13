import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';

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
const MOVE_CANCEL_PX = 6;

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

  const armedRef = useRef(false);
  const movedBeforeArmRef = useRef(false);
  const pressAtRef = useRef(0);
  const armDyRef = useRef(0);
  const lastStepRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  useEffect(() => () => clearTimer(), []);

  const resetState = () => {
    clearTimer();
    armedRef.current = false;
    movedBeforeArmRef.current = false;
    armDyRef.current = 0;
    lastStepRef.current = 0;
    setDragging(false);
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: () => armedRef.current,
        onMoveShouldSetPanResponderCapture: () => armedRef.current,
        onPanResponderTerminationRequest: () => !armedRef.current,
        onShouldBlockNativeResponder: () => false,

        onPanResponderGrant: () => {
          pressAtRef.current = Date.now();
          armedRef.current = false;
          movedBeforeArmRef.current = false;
          armDyRef.current = 0;
          lastStepRef.current = 0;
          clearTimer();
          timerRef.current = setTimeout(() => {
            if (!movedBeforeArmRef.current) {
              armedRef.current = true;
              setDragging(true);
            }
          }, LONG_PRESS_MS);
        },

        onPanResponderMove: (_, gs) => {
          if (!armedRef.current) {
            if (Math.abs(gs.dx) > MOVE_CANCEL_PX || Math.abs(gs.dy) > MOVE_CANCEL_PX) {
              movedBeforeArmRef.current = true;
              clearTimer();
            }
            return;
          }

          if (armDyRef.current === 0 && lastStepRef.current === 0) {
            armDyRef.current = gs.dy;
          }
          const dy = gs.dy - armDyRef.current;
          const step = Math.trunc(dy / ROW_HEIGHT);
          const delta = step - lastStepRef.current;
          if (delta !== 0) {
            lastStepRef.current = step;
            onMoveBy(delta);
          }
        },

        onPanResponderRelease: () => {
          const elapsed = Date.now() - pressAtRef.current;
          const wasTap =
            !armedRef.current && !movedBeforeArmRef.current && elapsed < LONG_PRESS_MS;
          resetState();
          if (wasTap) onPress();
        },

        onPanResponderTerminate: () => {
          resetState();
        },
      }),
    [onMoveBy, onPress],
  );

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
        {...responder.panHandlers}
      >
        {content}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>{actions}</View>
    </View>
  );
}
