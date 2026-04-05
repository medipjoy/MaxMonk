import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Task, QuadrantConfig } from '../store/types';

interface Props {
  config: QuadrantConfig;
  tasks: Task[];
  onPress: () => void;
}

export function QuadrantCell({ config, tasks, onPress }: Props) {
  const preview = tasks.slice(0, 3);
  const extra = tasks.length - 3;

  return (
    <TouchableOpacity style={[styles.cell, { backgroundColor: config.bgColor, borderColor: config.color + '40' }]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{config.emoji}</Text>
        <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
        <View style={[styles.badge, { backgroundColor: config.color }]}>
          <Text style={styles.badgeText}>{tasks.length}</Text>
        </View>
      </View>
      <View style={styles.tasks}>
        {preview.map(t => (
          <View key={t.id} style={styles.taskRow}>
            <View style={[styles.dot, { backgroundColor: config.color }]} />
            <Text style={styles.taskTitle} numberOfLines={1}>{t.title}</Text>
          </View>
        ))}
        {extra > 0 && <Text style={[styles.more, { color: config.color }]}>+{extra} more</Text>}
        {tasks.length === 0 && <Text style={styles.empty}>No tasks</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    margin: 4,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    minHeight: 140,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  emoji: { fontSize: 16, marginRight: 4 },
  label: { fontSize: 13, fontWeight: '700', flex: 1 },
  badge: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  tasks: { flex: 1 },
  taskRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  taskTitle: { fontSize: 12, color: '#374151', flex: 1 },
  more: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  empty: { fontSize: 12, color: '#9ca3af', fontStyle: 'italic' },
});
