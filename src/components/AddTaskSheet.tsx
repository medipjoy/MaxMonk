import React, { useState, useRef } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Animated
} from 'react-native';
import { QUADRANTS } from '../store/types';
import { assignQuadrant } from '../utils/quadrant';
import { useTaskStore } from '../store/taskStore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AddTaskSheet({ visible, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState(5);
  const [importance, setImportance] = useState(5);
  const [dueDate, setDueDate] = useState('');
  const addTask = useTaskStore(s => s.addTask);

  const quadrant = assignQuadrant(urgency, importance);
  const qConfig = QUADRANTS.find(q => q.id === quadrant)!;

  const handleSave = async () => {
    if (!title.trim()) return;
    await addTask({
      title: title.trim(),
      description: description.trim() || undefined,
      urgency,
      importance,
      dueDate: dueDate.trim() || undefined,
    });
    setTitle(''); setDescription(''); setUrgency(5); setImportance(5); setDueDate('');
    onClose();
  };

  const Stepper = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(Math.max(0, value - 1))}>
          <Text style={styles.stepBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.stepValue}>{value}</Text>
        <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(Math.min(10, value + 1))}>
          <Text style={styles.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.barOuter}>
        <View style={[styles.barInner, { width: `${value * 10}%`, backgroundColor: qConfig.color }]} />
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrapper}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>New Task</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <TextInput
              style={styles.input}
              placeholder="Task title..."
              placeholderTextColor="#9ca3af"
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="Description (optional)"
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
            />
            <Stepper label="Urgency" value={urgency} onChange={setUrgency} />
            <Stepper label="Importance" value={importance} onChange={setImportance} />
            <View style={[styles.preview, { backgroundColor: qConfig.bgColor, borderColor: qConfig.color + '60' }]}>
              <Text style={[styles.previewText, { color: qConfig.color }]}>
                {qConfig.emoji} Will go to: <Text style={{ fontWeight: '800' }}>{qConfig.label}</Text>
              </Text>
              <Text style={[styles.previewSub, { color: qConfig.color + 'aa' }]}>{qConfig.description}</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Due date (YYYY-MM-DD, optional)"
              placeholderTextColor="#9ca3af"
              value={dueDate}
              onChangeText={setDueDate}
            />
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: title.trim() ? qConfig.color : '#d1d5db' }]}
              onPress={handleSave}
              disabled={!title.trim()}
            >
              <Text style={styles.saveBtnText}>Save Task</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheetWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, maxHeight: '85%' },
  handle: { width: 40, height: 4, backgroundColor: '#d1d5db', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a2e', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 15, color: '#1a1a2e', marginBottom: 12 },
  inputMulti: { height: 64, textAlignVertical: 'top' },
  stepperRow: { marginBottom: 14 },
  stepperLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  stepperControls: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  stepBtn: { width: 32, height: 32, backgroundColor: '#f3f4f6', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontSize: 18, fontWeight: '700', color: '#374151' },
  stepValue: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', minWidth: 36, textAlign: 'center' },
  barOuter: { height: 6, backgroundColor: '#f3f4f6', borderRadius: 3 },
  barInner: { height: 6, borderRadius: 3 },
  preview: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12 },
  previewText: { fontSize: 15, fontWeight: '600' },
  previewSub: { fontSize: 12, marginTop: 2 },
  saveBtn: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
