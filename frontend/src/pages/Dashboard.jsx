// frontend/src/pages/DashboardPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import Navigate
import styles from './Dashboard.module.css';
import apiClient from '../api/axios';
import { useNotifications } from '../contexts/NotificationContext';

import { getTasks, deleteTask } from '../api/tasksAPI';
import OracleInsight from '../components/dashboard/OracleInsight';
import Timeline from '../components/dashboard/Timeline';
import Modal from '../components/tasks/Modal';

import { IoAdd, IoMic } from 'react-icons/io5';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { processCommand } from '../utils/speech';

const Dashboard = () => {
  const navigate = useNavigate(); // 2. Initialize Navigate
  const { addNotification } = useNotifications();

  // --- STATE MANAGEMENT ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [insightData, setInsightData] = useState(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [oracleSubtitle, setOracleSubtitle] = useState(''); // New Subtitle State

  const { isListening, transcript, startListening, stopListening, hasSupport } = useSpeechRecognition();

  // --- DATA FETCHING ---
  const fetchOracleInsights = useCallback(async () => {
    try {
      const response = await apiClient.get('/insights');
      setInsightData(response.data);
    } catch (error) {
      console.error("Failed to refresh Oracle insights:", error);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const tasksData = await getTasks();
      setTasks(tasksData);
    } catch (error) {
      console.error("Dashboard failed to fetch tasks.", error);
    }
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingTasks(true);
      setIsLoadingInsights(true);
      await Promise.all([fetchOracleInsights(), fetchTasks()]);
      setIsLoadingTasks(false);
      setIsLoadingInsights(false);
    };
    fetchInitialData();
  }, [fetchOracleInsights, fetchTasks]);

  // --- VOICE COMMAND HANDLER ---
  useEffect(() => {
    if (!isListening && transcript) {
      processCommand(transcript, insightData, (text) => {
        setOracleSubtitle(text);
        // Clear subtitle after a dynamic delay based on text length (min 3s, max 10s)
        const displayDuration = Math.max(5000, Math.min(10000, text.length * 60));
        setTimeout(() => setOracleSubtitle(''), displayDuration);
      });
    }
  }, [transcript, isListening, insightData]);

  // --- EVENT HANDLERS ---

  // 3. NEW: Launch Dynamic Focus Session
  const handleStartFocus = (taskId) => {
    // Navigate to focus page with the task ID as a query parameter
    navigate(`/focus-sessions?taskId=${taskId}`);
  };

  const handleTaskSaved = async (savedTask) => {
    setIsModalOpen(false);
    setEditingTask(null);
    await fetchTasks();
    await fetchOracleInsights();

    // Notify if Urgent
    if (savedTask.is_urgent) {
      addNotification(`Urgent Task Created: ${savedTask.title}`, 'urgent');
    }
  };

  const handleDeleteClick = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTask(taskId);
        setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
        fetchOracleInsights();
      } catch (error) {
        console.error("Failed to delete task", error);
        alert("Could not delete task.");
        fetchTasks();
      }
    }
  };

  const handleTaskUpdate = async () => {
    await fetchTasks();
    await fetchOracleInsights();
  };

  const openNewTaskModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (taskToEdit) => {
    setEditingTask(taskToEdit);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  return (
    <div className={styles.dashboardContent}>
      <div className={styles.oracleSection}>
        <OracleInsight insightData={insightData} isLoading={isLoadingInsights} />
        {hasSupport && (
          <button
            className={`${styles.micButton} ${isListening ? styles.listening : ''}`}
            onClick={isListening ? stopListening : startListening}
            title="Ask the Oracle"
          >
            <IoMic size={28} />
          </button>
        )}
      </div>

      <div className={styles.timelineSection}>
        <h2 className={styles.timelineHeader}>Today's Timeline</h2>

        <Timeline
          tasks={tasks}
          isLoading={isLoadingTasks}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onTaskUpdate={handleTaskUpdate}
          onStartFocus={handleStartFocus} // 4. Pass the new handler down
        />

        <button
          className={styles.floatingActionButton}
          onClick={openNewTaskModal}
        >
          <IoAdd size={32} />
        </button>
      </div>

      {isListening && <div className={styles.transcriptOverlay}>Listening...</div>}

      {oracleSubtitle && (
        <div className={styles.subtitleOverlay}>
          {oracleSubtitle}
        </div>
      )}

      {isModalOpen && (
        <Modal
          taskToEdit={editingTask}
          onTaskSaved={handleTaskSaved}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default Dashboard;