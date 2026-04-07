import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeTokens } from '../clearday/theme';
import { getFontSet } from '../clearday/fonts';
import { moderateScale } from '../clearday/scale';
import { NavCtx, Screen } from '../clearday/ClarityApp';

interface Props {
  tokens: ThemeTokens;
  fontChoice: string;
}

const ITEMS: { label: string; screen: Screen }[] = [
  { label: 'Log', screen: 'reflect' },
  { label: 'On Hold', screen: 'hold' },
  { label: 'Archive', screen: 'vault' },
  { label: 'Settings', screen: 'settings' },
];

export function MoreSheet({ tokens, fontChoice }: Props) {
  const fonts = getFontSet(fontChoice as any);
  const insets = useSafeAreaInsets();
  const nav = useContext(NavCtx);

  const s = StyleSheet.create({
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: tokens.overlay, justifyContent: 'flex-end' },
    sheet: { backgroundColor: tokens.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: insets.bottom + 8 },
    handle: { width: 36, height: 3, backgroundColor: tokens.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
    row: { height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: tokens.border, justifyContent: 'space-between' },
    label: { fontFamily: fonts.serif, fontSize: moderateScale(14), color: tokens.text },
    arrow: { fontFamily: fonts.serif, fontSize: moderateScale(14), color: tokens.textGhost },
  });

  return (
    <TouchableWithoutFeedback onPress={nav.closePanel}>
      <View style={s.overlay}>
        <TouchableWithoutFeedback>
          <View style={s.sheet}>
            <View style={s.handle} />
            {ITEMS.map(item => (
              <TouchableOpacity key={item.screen} style={s.row} onPress={() => { nav.closePanel(); nav.goTo(item.screen); }}>
                <Text style={s.label}>{item.label}</Text>
                <Text style={s.arrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
}
