import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { useClearDayStore } from '../clearday/store';
import { ThemeTokens } from '../clearday/theme';
import { getFontSet } from '../clearday/fonts';
import { moderateScale } from '../clearday/scale';

interface Props {
  tokens: ThemeTokens;
  fontChoice: string;
  onCarry: () => void;
  onDismiss: () => void;
}

export function MITCarryForwardModal({ tokens, fontChoice, onCarry, onDismiss }: Props) {
  const fonts = getFontSet(fontChoice as any);
  const { mit, setMit } = useClearDayStore();

  const s = StyleSheet.create({
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: tokens.overlay, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    card: { backgroundColor: tokens.surface, borderRadius: 12, padding: 16, width: '100%' },
    label: { fontFamily: 'Inter_500Medium', fontSize: moderateScale(7.5), color: tokens.textGhost, letterSpacing: 0.1 * moderateScale(7.5), textTransform: 'uppercase', marginBottom: 8 },
    heading: { fontFamily: fonts.serif, fontSize: moderateScale(11), color: tokens.text, marginBottom: 6 },
    mitText: { fontFamily: fonts.serifItalic, fontSize: moderateScale(9), color: tokens.gold, marginBottom: 6 },
    body: { fontFamily: fonts.serif, fontSize: moderateScale(8.5), color: tokens.textMuted, marginBottom: 16 },
    buttons: { flexDirection: 'row', gap: 8 },
    btnOutline: { flex: 1, borderWidth: 0.5, borderColor: tokens.borderMid, borderRadius: 6, paddingVertical: 10, alignItems: 'center' },
    btnFill: { flex: 1, backgroundColor: tokens.text, borderRadius: 6, paddingVertical: 10, alignItems: 'center' },
    btnOutlineText: { fontFamily: fonts.serif, fontSize: moderateScale(11), color: tokens.text },
    btnFillText: { fontFamily: fonts.serif, fontSize: moderateScale(11), color: tokens.surface },
  });

  return (
    <View style={s.overlay}>
      <View style={s.card}>
        <Text style={s.label}>Good morning</Text>
        <Text style={s.heading}>Yesterday's MIT was unfinished.</Text>
        {mit ? <Text style={s.mitText}>"{mit}"</Text> : null}
        <Text style={s.body}>Carry it forward to today?</Text>
        <View style={s.buttons}>
          <TouchableOpacity style={s.btnOutline} onPress={onDismiss}>
            <Text style={s.btnOutlineText}>Not today</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnFill} onPress={onCarry}>
            <Text style={s.btnFillText}>Carry forward</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
