import React from 'react';
import Svg, { Line, Polygon } from 'react-native-svg';

export function CheckIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Line x1={3} y1={8.5} x2={6.5} y2={12} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={6.5} y1={12} x2={13} y2={4} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function PencilIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Line x1={4} y1={12} x2={11.5} y2={4.5} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={10.8} y1={3.8} x2={12.8} y2={5.8} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Polygon points="3.4,12.6 4.9,12.2 3.8,11.1" fill={color} />
    </Svg>
  );
}
