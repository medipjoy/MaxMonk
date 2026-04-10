import React, { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, View } from 'react-native';

interface Props {
  onPress: () => void;
  onMoveBy: (delta: number) => void;
  content: React.ReactNode;
  actions: React.ReactNode;
  borderColor: string;
}

export function LongPressReorderRow({ onPress, onMoveBy, content, actions, borderColor }: Props) {
  const translateY = useRef(new Animated.Value(0)).current;
  const [armed, setArmed] = useState(false);
  const [dragging, setDragging] = useState(false);

  const reset = () => {
    setArmed(false);
    setDragging(false);
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
  };

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gs) => armed && Math.abs(gs.dy) > 4,
    onMoveShouldSetPanResponderCapture: (_, gs) => armed && Math.abs(gs.dy) > 4,
    onPanResponderGrant: () => setDragging(true),
    onPanResponderMove: (_, gs) => {
      translateY.setValue(gs.dy);
    },
    onPanResponderRelease: (_, gs) => {
      const delta = Math.round(gs.dy / 48);
      reset();
      if (delta !== 0) onMoveBy(delta);
    },
    onPanResponderTerminate: reset,
  }), [armed, onMoveBy, translateY]);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: borderColor,
        transform: [{ translateY }],
        zIndex: dragging ? 10 : 0,
        opacity: dragging ? 0.94 : 1,
      }}
    >
      <Pressable
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 44 }}
        onPress={onPress}
        delayLongPress={260}
        onLongPress={() => setArmed(true)}
      >
        {content}
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>{actions}</View>
    </Animated.View>
  );
}
