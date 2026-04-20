import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, RefreshControl, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Text, View } from '@/components/Themed';
import OracleInsight from '@/components/dashboard/OracleInsight';
import Timeline from '@/components/dashboard/Timeline';
import apiClient from '@/api/client';
import { getTasks, deleteTask, updateTask, Task } from '@/api/tasks';
import TaskModal from '@/components/tasks/TaskModal';

export default function DashboardScreen() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [insightData, setInsightData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, insightsRes] = await Promise.all([
        getTasks(),
        apiClient.get('/insights')
      ]);
      setTasks(tasksRes);
      setInsightData(insightsRes.data);
    } catch (error) {
      console.error("Dashboard failed to fetch data:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleTaskSaved = () => {
    fetchData(); // Refresh everything
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleToggleTask = async (task: Task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      const updated = await updateTask(task.id, {
        title: task.title,
        description: task.description || '',
        is_urgent: task.is_urgent,
        is_important: task.is_important,
        due_date: task.due_date || null,
        status: newStatus,
        goal_id: task.goal_id || null,
        subtasks: task.subtasks || [],
      });
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    } catch (error) {
      console.error("Failed to toggle task:", error);
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleStartFocus = (id: number) => {
    router.push(`/(tabs)/focus?taskId=${id}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0a0a14', '#1a1a2e']} style={styles.gradient}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#d4af37" />
          }
        >
          <View style={styles.header}>
            <Text style={styles.headerGreek}>ΑΓΟΡΑ</Text>
            <Text style={styles.headerTitle}>The Agora</Text>
            <View style={styles.headerDivider} />
          </View>

          <OracleInsight insightData={insightData} isLoading={isLoading} />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionSymbol}>◆</Text>
            <Text style={styles.sectionTitle}>Today's Labors</Text>
          </View>

          <Timeline
            tasks={tasks}
            isLoading={isLoading}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onToggle={handleToggleTask}
            onStartFocus={handleStartFocus}
          />
        </ScrollView>
      </LinearGradient>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => { setEditingTask(null); setIsModalOpen(true); }}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#1a1a2e" />
      </TouchableOpacity>

      <TaskModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskSaved={handleTaskSaved}
        taskToEdit={editingTask}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerGreek: {
    fontSize: 12,
    color: 'rgba(212,175,55,0.5)',
    letterSpacing: 6,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#d4af37',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  headerDivider: {
    width: 60,
    height: 1,
    backgroundColor: 'rgba(212,175,55,0.4)',
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionSymbol: {
    color: '#d4af37',
    fontSize: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#d4af37',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
});
