import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar } from 'react-native';
import { useTaskStore } from '../store/taskStore';
import { QUADRANTS, Quadrant } from '../store/types';
import { QuadrantCell } from '../components/QuadrantCell';
import { AddTaskSheet } from '../components/AddTaskSheet';
import { FocusMode } from '../components/FocusMode';

export function MatrixScreen() {
  const { loadTasks, getTasksByQuadrant } = useTaskStore();
  const [showAdd, setShowAdd] = useState(false);
  const [focusQuadrant, setFocusQuadrant] = useState<Quadrant | null>(null);

  useEffect(() => { loadTasks(); }, []);

  const totalActive = QUADRANTS.reduce((sum, q) => sum + getTasksByQuadrant(q.id).length, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>MaxMonk</Text>
          <Text style={styles.subtitle}>{totalActive} active task{totalActive !== 1 ? 's' : ''}</Text>
        </View>
        <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.row}>
          <QuadrantCell
            config={QUADRANTS[0]}
            tasks={getTasksByQuadrant('Q1')}
            onPress={() => setFocusQuadrant('Q1')}
          />
          <QuadrantCell
            config={QUADRANTS[1]}
            tasks={getTasksByQuadrant('Q2')}
            onPress={() => setFocusQuadrant('Q2')}
          />
        </View>
        <View style={styles.row}>
          <QuadrantCell
            config={QUADRANTS[2]}
            tasks={getTasksByQuadrant('Q3')}
            onPress={() => setFocusQuadrant('Q3')}
          />
          <QuadrantCell
            config={QUADRANTS[3]}
            tasks={getTasksByQuadrant('Q4')}
            onPress={() => setFocusQuadrant('Q4')}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AddTaskSheet visible={showAdd} onClose={() => setShowAdd(false)} />

      {focusQuadrant && (
        <FocusMode quadrant={focusQuadrant} onClose={() => setFocusQuadrant(null)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  appName: { fontSize: 24, fontWeight: '900', color: '#1a1a2e' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  date: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  grid: { flex: 1, padding: 8 },
  row: { flex: 1, flexDirection: 'row' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
});
