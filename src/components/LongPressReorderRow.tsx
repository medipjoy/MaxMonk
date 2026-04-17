import React from 'react';
import { TouchableOpacity, View } from 'react-native';

interface Props {
  onPress: () => void;
  onMoveBy: (delta: number) => void;
  content: React.ReactNode;
  actions: React.ReactNode;
  borderColor: string;
}

export function LongPressReorderRow({ onPress, onMoveBy, content, actions, borderColor }: Props) {
  return (
    <View
      style={{
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: borderColor,
      }}
    >
      <TouchableOpacity
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 44 }}
        onPress={onPress}
        activeOpacity={0.6}
      >
        {content}
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>{actions}</View>
    </View>
  );
}
