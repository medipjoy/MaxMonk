import React, { useRef, useState } from 'react';
import { Animated, PanResponder } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface Props {
  color: string;
  onMoveBy: (delta: number) => void;
}

export function ReorderHandle({ color, onMoveBy }: Props) {
  const translateY = useRef(new Animated.Value(0)).current;
  const [dragging, setDragging] = useState(false);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 3,
    onPanResponderGrant: () => setDragging(true),
    onPanResponderMove: (_, gestureState) => {
      translateY.setValue(gestureState.dy);
    },
    onPanResponderRelease: (_, gestureState) => {
      setDragging(false);
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
      const delta = Math.round(gestureState.dy / 44);
      if (delta !== 0) onMoveBy(delta);
    },
    onPanResponderTerminate: () => {
      setDragging(false);
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
    },
  })).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{ width: 28, height: 28, justifyContent: 'center', alignItems: 'center', opacity: dragging ? 0.8 : 0.55, transform: [{ translateY }] }}
    >
      <Svg width={10} height={16} viewBox="0 0 10 16">
        {[3, 8, 13].map((y) => (
          <React.Fragment key={y}>
            <Circle cx={3} cy={y} r={1.1} fill={color} />
            <Circle cx={7} cy={y} r={1.1} fill={color} />
          </React.Fragment>
        ))}
      </Svg>
    </Animated.View>
  );
}
