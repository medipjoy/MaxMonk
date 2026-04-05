import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useTaskStore } from '../store/taskStore';
import { QUADRANTS } from '../store/types';

export function StatsScreen() {
  const { loadTasks, getTasksByQuadrant, getCompletedTasks, getActiveTasks } = useTaskStore();
  useEffect(() => { loadTasks(); }, []);

  const completed = getCompletedTasks().length;
  const active = getActiveTasks().length;
  const total = completed + active;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const maxCount = Math.max(...QUADRANTS.map(q => getTasksByQuadrant(q.id).length), 1);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Stats</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{active}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: '#22c55e' }]}>{completed}</Text>
            <Text style={styles.summaryLabel}>Done</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: '#3b82f6' }]}>{completionRate}%</Text>
            <Text style={styles.summaryLabel}>Rate</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Tasks by Quadrant</Text>
        <View style={styles.chart}>
          {QUADRANTS.map(q => {
            const count = getTasksByQuadrant(q.id).length;
            const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return (
              <View key={q.id} style={styles.barRow}>
                <Text style={styles.barLabel}>{q.emoji} {q.label}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${barWidth}%`, backgroundColor: q.color }]} />
                </View>
                <Text style={[styles.barCount, { color: q.color }]}>{count}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Completion Rate</Text>
        <View style={styles.rateCard}>
          <View style={styles.rateTrack}>
            <View style={[styles.rateFill, { width: `${completionRate}%` }]} />
          </View>
          <Text style={styles.rateLabel}>{completionRate}% of all tasks completed</Text>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>💡 Insight</Text>
          {(() => {
            const q1 = getTasksByQuadrant('Q1').length;
            const q2 = getTasksByQuadrant('Q2').length;
            if (q1 > 5) return <Text style={styles.insightText}>You have many urgent tasks. Try to plan ahead (Q2) to reduce firefighting.</Text>;
            if (q2 > q1) return <Text style={styles.insightText}>Great balance! Most tasks are in Plan (Q2) — you're being proactive.</Text>;
            if (active === 0) return <Text style={styles.insightText}>All clear! Add new tasks to keep momentum going.</Text>;
            return <Text style={styles.insightText}>Keep going! Focus on Q1 tasks first, then work through Q2.</Text>;
          })()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '900', color: '#1a1a2e', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  summaryValue: { fontSize: 28, fontWeight: '900', color: '#1a1a2e' },
  summaryLabel: { fontSize: 12, color: '#6b7280', marginTop: 4, fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 12 },
  chart: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  barLabel: { fontSize: 13, fontWeight: '600', color: '#374151', width: 90 },
  barTrack: { flex: 1, height: 10, backgroundColor: '#f3f4f6', borderRadius: 5, marginHorizontal: 8 },
  barFill: { height: 10, borderRadius: 5 },
  barCount: { fontSize: 13, fontWeight: '700', width: 24, textAlign: 'right' },
  rateCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  rateTrack: { height: 12, backgroundColor: '#f3f4f6', borderRadius: 6, marginBottom: 8 },
  rateFill: { height: 12, backgroundColor: '#22c55e', borderRadius: 6 },
  rateLabel: { fontSize: 13, color: '#6b7280', textAlign: 'center' },
  insightCard: { backgroundColor: '#fffbeb', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#fef08a' },
  insightTitle: { fontSize: 15, fontWeight: '700', color: '#92400e', marginBottom: 6 },
  insightText: { fontSize: 14, color: '#78350f', lineHeight: 20 },
});
