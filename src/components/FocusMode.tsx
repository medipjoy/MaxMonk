import React from 'react';
import {
  View, Text, StyleSheet, Modal, SafeAreaView, FlatList,
  TouchableOpacity, Alert
} from 'react-native';
import { Quadrant, QUADRANTS } from '../store/types';
import { useTaskStore } from '../store/taskStore';
import { TaskCard } from './TaskCard';
import { getDeadlineLabel } from '../utils/deadlineEscalation';

interface Props {
  quadrant: Quadrant;
  onClose: () => void;
}

export function FocusMode({ quadrant, onClose }: Props) {
  const { getTasksByQuadrant, completeTask, deleteTask } = useTaskStore();
  const config = QUADRANTS.find(q => q.id === quadrant)!;
  const tasks = getTasksByQuadrant(quadrant);

  const handleComplete = (id: string) => {
    Alert.alert('Complete Task', 'Mark this task as done?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Complete ✓', onPress: () => completeTask(id) }
    ]);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Task', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTask(id) }
    ]);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={[styles.safe, { backgroundColor: config.bgColor }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{config.emoji} {config.label}</Text>
          <View style={[styles.countBadge, { backgroundColor: config.color }]}>
            <Text style={styles.countText}>{tasks.length}</Text>
          </View>
        </View>
        <Text style={styles.desc}>{config.description}</Text>
        <FlatList
          data={tasks}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.taskWrapper}>
              <TaskCard task={item} />
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#22c55e' }]} onPress={() => handleComplete(item.id)}>
                  <Text style={styles.actionText}>✓ Done</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ef4444' }]} onPress={() => handleDelete(item.id)}>
                  <Text style={styles.actionText}>✕ Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>{config.emoji}</Text>
              <Text style={styles.emptyText}>No tasks here!</Text>
              <Text style={styles.emptySub}>Tasks assigned to {config.label} will appear here.</Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { marginRight: 12 },
  backText: { fontSize: 15, color: '#374151', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '800', color: '#1a1a2e', flex: 1 },
  countBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  countText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  desc: { paddingHorizontal: 16, fontSize: 13, color: '#6b7280', marginBottom: 8 },
  list: { padding: 16, paddingBottom: 40 },
  taskWrapper: { marginBottom: 4 },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 12, marginTop: -4 },
  actionBtn: { flex: 1, borderRadius: 8, padding: 8, alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 4 },
  emptySub: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
});
