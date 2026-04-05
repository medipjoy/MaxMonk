import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Task, QUADRANTS } from '../store/types';
import { getDeadlineLabel } from '../utils/deadlineEscalation';

interface Props {
  task: Task;
  onPress?: () => void;
}

export function TaskCard({ task, onPress }: Props) {
  const qConfig = QUADRANTS.find(q => q.id === task.quadrant)!;
  const deadline = task.dueDate ? getDeadlineLabel(task.dueDate) : null;

  return (
    <TouchableOpacity style={[styles.card, { borderLeftColor: qConfig.color }]} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.title} numberOfLines={2}>{task.title}</Text>
      {task.description ? <Text style={styles.desc} numberOfLines={1}>{task.description}</Text> : null}
      {deadline ? (
        <View style={styles.deadline}>
          <Text style={[styles.deadlineText, { color: deadline.color }]}>⏰ {deadline.label}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  title: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginBottom: 2 },
  desc: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  deadline: { flexDirection: 'row', alignItems: 'center' },
  deadlineText: { fontSize: 11, fontWeight: '500' },
});
