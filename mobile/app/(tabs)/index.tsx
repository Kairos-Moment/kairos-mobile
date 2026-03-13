import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

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
      const updated = await updateTask(task.id, { is_completed: !task.is_completed });
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <OracleInsight insightData={insightData} isLoading={isLoading} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Timeline</Text>
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

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditingTask(null);
          setIsModalOpen(true);
        }}
      >
        <FontAwesome name="plus" size={24} color="#fff" />
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
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196f3',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
