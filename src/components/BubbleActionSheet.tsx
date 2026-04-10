import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useClearDayStore } from '../clearday/store';
import { ThemeTokens } from '../clearday/theme';
import { getFontSet } from '../clearday/fonts';
import { moderateScale, fontScale } from '../clearday/scale';
import { Quadrant } from '../clearday/types';
import { CheckIcon, PencilIcon } from './ActionIcons';

interface Props {
  tokens: ThemeTokens;
  fontChoice: string;
  agendaId: string;
  onClose: () => void;
  onAction: (msg: string) => void;
  onEdit: (id: string) => void;
}

const TIME_LABEL: Record<string, string> = { quick: '⚡ Quick', short: '◔ Short', medium: '◑ Medium', deep: '● Deep' };

export function BubbleActionSheet({ tokens, fontChoice, agendaId, onClose, onAction, onEdit }: Props) {
  const fonts = getFontSet(fontChoice as any);
  const insets = useSafeAreaInsets();
  const { agendas, completeAgenda, toggleHold, archiveAgenda, addAgenda } = useClearDayStore();
  const fontSizeMultiplier = useClearDayStore(s => s.config?.fontSizeMultiplier ?? 1.0);
  const quadrantLabels = useClearDayStore(s => s.config.quadrantLabels);
  const agenda = agendas.find(a => a.id === agendaId);

  const dismissPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
    onPanResponderMove: () => {},
    onPanResponderRelease: (_, gs) => { if (gs.dy > 80) onClose(); },
  })).current;

  if (!agenda) return null;

  const s = StyleSheet.create({
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: tokens.overlay, justifyContent: 'flex-end' },
    sheet: { backgroundColor: tokens.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: insets.bottom + 8 },
    handle: { width: 36, height: 3, backgroundColor: tokens.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 10 },
    header: { paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: tokens.border },
    title: { fontFamily: fonts.serifItalic, fontSize: fontScale(13, fontSizeMultiplier), color: tokens.text },
    meta: { fontFamily: fonts.serif, fontSize: fontScale(8, fontSizeMultiplier), color: tokens.textGhost, marginTop: 3 },
    row: { height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: tokens.border, gap: 12 },
    icon: { width: 20, fontSize: fontScale(14, fontSizeMultiplier) },
    rowText: { fontFamily: fonts.serif, fontSize: fontScale(13, fontSizeMultiplier), color: tokens.text },
    deleteText: { fontFamily: fonts.serif, fontSize: fontScale(13, fontSizeMultiplier), color: tokens.q1 },
  });

  const rows = [
    { label: 'Complete', icon: <CheckIcon color={tokens.q2} size={14} />, onPress: async () => { await completeAgenda(agendaId); onAction('Marked Completed'); } },
    { label: 'Edit', icon: <PencilIcon color={tokens.textMuted} size={14} />, onPress: () => onEdit(agendaId) },
    ...(agenda.status === 'active' ? [{ label: 'Hold', icon: <Text style={[s.rowText, { color: tokens.textMuted, width: 16, textAlign: 'center' }]}>–</Text>, onPress: async () => { await toggleHold(agendaId); onAction('On Hold'); } }] : []),
    { label: 'Archive', icon: <Text style={[s.rowText, { color: tokens.textMuted, width: 16, textAlign: 'center' }]}>↓</Text>, onPress: async () => { await archiveAgenda(agendaId); onAction('Archived'); } },
  ];

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={s.overlay}>
        <TouchableWithoutFeedback>
          <View style={s.sheet}>
            <View style={s.handle} {...dismissPan.panHandlers} />
            <View style={s.header}>
              <Text style={s.title} numberOfLines={2}>{agenda.text}</Text>
              <Text style={s.meta}>
                {quadrantLabels[agenda.quadrant as Quadrant]} · {agenda.domain} · {TIME_LABEL[agenda.time]}
              </Text>
            </View>
            {rows.map(r => (
              <TouchableOpacity key={r.label} style={s.row} onPress={r.onPress}>
                <View style={{ width: 16, alignItems: 'center' }}>{r.icon}</View>
                <Text style={[s.rowText, { flex: 1 }]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[s.row, { borderBottomWidth: 0 }]} onPress={() => {
              // Soft delete: archive
              archiveAgenda(agendaId);
              onAction('Deleted');
            }}>
              <Text style={[s.deleteText, { flex: 1 }]}>✕  Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
}
