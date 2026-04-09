import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, TouchableWithoutFeedback, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useClearDayStore } from '../clearday/store';
import { ThemeTokens } from '../clearday/theme';
import { getFontSet } from '../clearday/fonts';
import { moderateScale, fontScale } from '../clearday/scale';

const QUADRANT_ORDER = ['Q1', 'Q2', 'Q3', 'Q4'] as const;

interface Props {
  tokens: ThemeTokens;
  fontChoice: string;
  currentMit: string;
  onSelect: (text: string) => void;
  onClose: () => void;
}

export function MITSelector({ tokens, fontChoice, currentMit, onSelect, onClose }: Props) {
  const fonts = getFontSet(fontChoice as any);
  const insets = useSafeAreaInsets();
  const { agendas } = useClearDayStore();
  const fontSizeMultiplier = useClearDayStore(s => s.config?.fontSizeMultiplier ?? 1.0);
  const [inputText, setInputText] = useState('');

  const active = agendas.filter(a => a.status === 'active');
  const sorted = [...active].sort((a, b) => QUADRANT_ORDER.indexOf(a.quadrant as any) - QUADRANT_ORDER.indexOf(b.quadrant as any));

  const quadrantColor = (q: string) => {
    switch (q) { case 'Q1': return tokens.q1; case 'Q2': return tokens.q2; case 'Q3': return tokens.q3; default: return tokens.q4; }
  };

  const handleSubmit = () => {
    if (inputText.trim()) onSelect(inputText.trim());
  };

  const s = StyleSheet.create({
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: tokens.overlay, justifyContent: 'flex-end' },
    sheet: { backgroundColor: tokens.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: insets.bottom + 12 },
    handle: { width: 36, height: 3, backgroundColor: tokens.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
    title: { fontFamily: fonts.serifItalic, fontSize: fontScale(16, fontSizeMultiplier), color: tokens.text, paddingHorizontal: 16, marginBottom: 10 },
    inputRow: { flexDirection: 'row', marginHorizontal: 16, borderWidth: 0.5, borderColor: tokens.borderMid, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: tokens.surface2 },
    input: { flex: 1, fontFamily: fonts.serifItalic, fontSize: fontScale(13, fontSizeMultiplier), color: tokens.text },
    addBtn: { fontFamily: fonts.serifItalic, fontSize: fontScale(11, fontSizeMultiplier), color: tokens.accent, alignSelf: 'center', marginLeft: 8 },
    list: { maxHeight: 260, marginTop: 8 },
    row: { height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: tokens.border },
    dot: { width: 4, height: 4, borderRadius: 2, marginRight: 12 },
    rowText: { fontFamily: fonts.serif, fontSize: fontScale(13, fontSizeMultiplier), color: tokens.text, flex: 1 },
    clearBtn: { alignItems: 'center', paddingVertical: 14 },
    clearText: { fontFamily: fonts.serifItalic, fontSize: fontScale(11, fontSizeMultiplier), color: tokens.textGhost },
  });

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={s.overlay}>
        <TouchableWithoutFeedback>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={s.sheet}>
              <View style={s.handle} />
              <Text style={s.title}>Today's #1</Text>

              {/* Custom text input */}
              <View style={s.inputRow}>
                <TextInput
                  style={s.input}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Type a custom intention…"
                  placeholderTextColor={tokens.textGhost}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity onPress={handleSubmit}>
                  <Text style={s.addBtn}>Set</Text>
                </TouchableOpacity>
              </View>

              {/* Agenda list */}
              <ScrollView style={s.list} keyboardShouldPersistTaps="handled">
                {sorted.map(agenda => (
                  <TouchableOpacity key={agenda.id} onPress={() => onSelect(agenda.text)}>
                    <View style={s.row}>
                      <View style={[s.dot, { backgroundColor: quadrantColor(agenda.quadrant) }]} />
                      <Text style={s.rowText} numberOfLines={1}>{agenda.text}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Clear */}
              <TouchableOpacity style={s.clearBtn} onPress={() => onSelect('')}>
                <Text style={s.clearText}>Clear MIT</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
}
