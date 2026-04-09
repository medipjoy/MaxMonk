import React, { useState, useContext, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useClearDayStore } from '../clearday/store';
import { ThemeTokens } from '../clearday/theme';
import { getFontSet } from '../clearday/fonts';
import { fontScale } from '../clearday/scale';
import { NavCtx } from '../clearday/ClarityApp';

interface Props {
  tokens: ThemeTokens;
  fontChoice: string;
  onClose: () => void;
}

export function SparksSheet({ tokens, fontChoice, onClose }: Props) {
  const fonts = getFontSet(fontChoice as any);
  const insets = useSafeAreaInsets();
  const nav = useContext(NavCtx);
  const { sparks, addSpark, removeSpark } = useClearDayStore();
  const fontSizeMultiplier = useClearDayStore(s => s.config?.fontSizeMultiplier ?? 1.0);

  const dismissPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
    onPanResponderMove: () => {},
    onPanResponderRelease: (_, gs) => { if (gs.dy > 50) onClose(); },
  })).current;

  const [input, setInput] = useState('');

  const handleAdd = async () => {
    if (!input.trim()) return;
    await addSpark(input.trim());
    setInput('');
  };

  const handleSendToMatrix = (spark: { id: string; text: string }) => {
    nav.setAddSheetPreset({ urgency: 50, importance: 50, defaultText: spark.text, sparkId: spark.id });
    nav.openPanel('add');
    onClose();
  };

  const s = StyleSheet.create({
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: tokens.overlay, justifyContent: 'flex-end' },
    sheet: { backgroundColor: tokens.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: insets.bottom + 12, maxHeight: '85%' },
    handleArea: { width: '100%', alignItems: 'center', paddingTop: 8, paddingBottom: 8 },
    handle: { width: 36, height: 3, backgroundColor: tokens.border, borderRadius: 2 },
    header: { paddingHorizontal: 16, marginBottom: 10 },
    title: { fontFamily: fonts.serif, fontSize: fontScale(18, fontSizeMultiplier), fontWeight: '300', color: tokens.text },
    subtitle: { fontFamily: fonts.serifItalic, fontSize: fontScale(9, fontSizeMultiplier), color: tokens.textGhost, marginTop: 2 },
    inputRow: { flexDirection: 'row', marginHorizontal: 16, gap: 8, marginBottom: 12, alignItems: 'center' },
    input: { flex: 1, borderWidth: 0.5, borderColor: tokens.borderMid, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: tokens.surface2, fontFamily: fonts.serifItalic, fontSize: fontScale(13, fontSizeMultiplier), color: tokens.text },
    addBtn: { fontFamily: fonts.serif, fontSize: fontScale(11, fontSizeMultiplier), color: tokens.accent },
    list: { flex: 1 },
    row: { height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: tokens.border },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: tokens.textGhost, marginRight: 10 },
    sparkText: { flex: 1, fontFamily: fonts.serif, fontSize: fontScale(12, fontSizeMultiplier), color: tokens.text },
    rowBtns: { flexDirection: 'row', gap: 8 },
    rowBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
    rowBtnText: { fontSize: fontScale(14, fontSizeMultiplier) },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={s.overlay}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1 }} />
      </TouchableWithoutFeedback>
      <View style={s.sheet}>
        <View style={s.handleArea} {...dismissPan.panHandlers}>
          <View style={s.handle} />
        </View>
        <View style={s.header}>
          <Text style={s.title}>Sparks</Text>
          <Text style={s.subtitle}>Raw thoughts, unfiltered.</Text>
        </View>
        <View style={s.inputRow}>
          <TextInput style={s.input} value={input} onChangeText={setInput} placeholder="Capture a spark…" placeholderTextColor={tokens.textGhost} returnKeyType="done" onSubmitEditing={handleAdd} />
          <TouchableOpacity onPress={handleAdd}><Text style={s.addBtn}>Add</Text></TouchableOpacity>
        </View>

        <ScrollView style={s.list} keyboardShouldPersistTaps="handled">
          {sparks.map(spark => (
            <View key={spark.id} style={s.row}>
              <View style={s.dot} />
              <Text style={s.sparkText} numberOfLines={2}>{spark.text}</Text>
              <View style={s.rowBtns}>
                <TouchableOpacity style={s.rowBtn} onPress={() => handleSendToMatrix(spark)}>
                  <Text style={[s.rowBtnText, { color: tokens.accent }]}>→</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.rowBtn} onPress={() => removeSpark(spark.id)}>
                  <Text style={[s.rowBtnText, { color: tokens.textGhost }]}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
