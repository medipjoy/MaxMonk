import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity
} from 'react-native';
import { useTaskStore } from '../store/taskStore';
import { Task, QUADRANTS } from '../store/types';
import { getDeadlineLabel } from '../utils/deadlineEscalation';

function groupByDate(tasks: Task[]): { date: string; tasks: Task[] }[] {
  const map = new Map<string, Task[]>();
  for (const task of tasks) {
    const dateStr = new Date(task.scheduledAt || task.dueDate || task.createdAt).toDateString();
    if (!map.has(dateStr)) map.set(dateStr, []);
    map.get(dateStr)!.push(task);
  }
  return Array.from(map.entries()).map(([date, tasks]) => ({ date, tasks }));
}

export function AgendaScreen() {
  const { loadTasks, getUpcomingTasks, completeTask } = useTaskStore();
  useEffect(() => { loadTasks(); }, []);

  const upcoming = getUpcomingTasks();
  const groups = groupByDate(upcoming);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Agenda</Text>
        <Text style={styles.subtitle}>{upcoming.length} upcoming task{upcoming.length !== 1 ? 's' : ''}</Text>
      </View>
      <FlatList
        data={groups}
        keyExtractor={item => item.date}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.group}>
            <Text style={styles.dateHeader}>{item.date}</Text>
            {item.tasks.map(task => {
              const qConfig = QUADRANTS.find(q => q.id === task.quadrant)!;
              const deadline = task.dueDate ? getDeadlineLabel(task.dueDate) : null;
              return (
                <View key={task.id} style={[styles.agendaItem, { borderLeftColor: qConfig.color }]}>
                  <View style={styles.itemMain}>
                    <Text style={styles.itemTitle}>{task.title}</Text>
                    <View style={[styles.qBadge, { backgroundColor: qConfig.color + '20' }]}>
                      <Text style={[styles.qBadgeText, { color: qConfig.color }]}>{qConfig.emoji} {qConfig.label}</Text>
                    </View>
                  </View>
                  {deadline && <Text style={[styles.itemDeadline, { color: deadline.color }]}>⏰ {deadline.label}</Text>}
                  <TouchableOpacity style={styles.completeBtn} onPress={() => completeTask(task.id)}>
                    <Text style={styles.completeBtnText}>Mark done</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyText}>No upcoming tasks</Text>
            <Text style={styles.emptySub}>Add tasks with due dates to see them here.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 24, fontWeight: '900', color: '#1a1a2e' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  list: { padding: 16, paddingBottom: 40 },
  group: { marginBottom: 24 },
  dateHeader: { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  agendaItem: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  itemMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  itemTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', flex: 1, marginRight: 8 },
  qBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  qBadgeText: { fontSize: 11, fontWeight: '600' },
  itemDeadline: { fontSize: 12, marginBottom: 8 },
  completeBtn: { alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f0fdf4', borderRadius: 6 },
  completeBtnText: { fontSize: 12, color: '#16a34a', fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 4 },
  emptySub: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
});
