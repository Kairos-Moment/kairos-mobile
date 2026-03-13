import React, { useState, useEffect, useCallback } from 'react';
import { fetchHabits, createHabit, deleteHabit, logHabit, undoHabitLog, fetchHabitLogs } from '../api/habitsAPI';
import apiClient from '../api/axios'; // Import for Oracle sync
import styles from './Habits.module.css';
import { IoLeaf, IoCheckmarkCircle, IoAdd, IoTrashBin, IoMic, IoCalendar, IoTime, IoArrowUndo } from 'react-icons/io5';

// Components & Hooks
import OracleInsight from '../components/dashboard/OracleInsight';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useNotifications } from '../contexts/NotificationContext';

const AFFIRMATIONS = [
  "We are what we repeatedly do. Excellence, then, is not an act, but a habit. — Aristotle",
  "Small actions, done consistently, create giant results.",
  "Focus on the process, not the outcome. The seed will grow.",
  "Discipline is the bridge between goals and accomplishment."
];

import { isToday, isSameWeek, isSameMonth, parseISO } from 'date-fns';

const Habits = () => {
  const [habits, setHabits] = useState([]);
  const [completedMap, setCompletedMap] = useState({});
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Oracle State
  const [insightData, setInsightData] = useState(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);

  // UI State
  const [quote, setQuote] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [frequency, setFrequency] = useState(1);
  const [targetCount, setTargetCount] = useState(1);

  // Speech Recognition
  const { isListening, transcript, startListening, stopListening, hasSupport } = useSpeechRecognition();
  const { addNotification } = useNotifications();

  // --- DATA FETCHING ---

  const refreshOracle = useCallback(async () => {
    try {
      const response = await apiClient.get('/insights');
      setInsightData(response.data);
    } catch (error) {
      console.error("Oracle failed to perceive your habits:", error);
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    setIsLoadingInsights(true);
    try {
      const habitsData = await fetchHabits();
      setHabits(habitsData);

      const statusMap = {};
      const progMap = {};
      const now = new Date();

      await Promise.all(habitsData.map(async (habit) => {
        try {
          const logs = await fetchHabitLogs(habit.id);
          const target = habit.target_count || 1;

          let periodLogs = [];
          const now = new Date();

          if (habit.frequency === 1) { // Daily
            periodLogs = logs.filter(log => isToday(parseISO(log.completion_date)));
          } else if (habit.frequency === 2) { // Weekly
            periodLogs = logs.filter(log => isSameWeek(parseISO(log.completion_date), now));
          } else if (habit.frequency === 3) { // Monthly
            periodLogs = logs.filter(log => isSameMonth(parseISO(log.completion_date), now));
          }

          console.log(`[loadData] Habit: ${habit.title} | Logs In Period: ${periodLogs.length} | Target: ${target}`);
          progMap[habit.id] = periodLogs.length;
          statusMap[habit.id] = periodLogs.length >= target;

        } catch (e) {
          console.error(`Could not fetch logs for habit ${habit.id}`);
        }
      }));

      setCompletedMap(statusMap);
      setProgressMap(progMap);
      await refreshOracle();
    } catch (err) {
      console.error("Error loading habits:", err);
    } finally {
      setLoading(false);
      setIsLoadingInsights(false);
    }
  };

  useEffect(() => {
    loadData();
    setQuote(AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);
  }, []);

  // --- VOICE COMMAND LOGIC ---
  useEffect(() => {
    if (!isListening && transcript) {
      handleVoiceCommand(transcript.toLowerCase());
    }
  }, [transcript, isListening]);

  const handleVoiceCommand = async (command) => {
    console.log("🎤 Voice Command Received:", command); // DEBUG
    // Example: "Log reading habit" or "Done with meditation"
    const habitToLog = habits.find(h => command.includes(h.title.toLowerCase()));

    if (habitToLog) {
      console.log("✅ Habit Matched:", habitToLog.title); // DEBUG
      if (command.includes('undo') || command.includes('cancel') || command.includes('remove') || command.includes('not done')) {
        console.log("🔄 Undo Action Detected"); // DEBUG
        handleUndoLog(habitToLog.id);
      } else {
        console.log("📝 Log Action Detected"); // DEBUG
        handleLog(habitToLog.id);
      }
    } else {
      console.log("❌ No Habit Matched in command"); // DEBUG
    }
  };

  const handleUndoLog = async (id) => {
    // Optimistic Update
    setProgressMap(prev => {
      const current = prev[id] || 0;
      return { ...prev, [id]: Math.max(0, current - 1) };
    });
    setCompletedMap(prev => ({ ...prev, [id]: false })); // Ensure not done if we just undid

    console.log(`🔄 Attempting to undo log for habit ID: ${id}`); // DEBUG

    try {
      const response = await undoHabitLog(id);
      console.log("✅ Undo API Success:", response);
      await refreshOracle();
      const habitTitle = habits.find(h => h.id === id)?.title;
      addNotification(`Habit Progress Reversed: ${habitTitle}`, 'info');
    } catch (err) {
      console.error("❌ Undo API Failed:", err);
      loadData(); // Re-fetch on error to be safe
      addNotification("Could not undo habit.", "error");
    }
  };

  // --- HANDLERS ---

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle) return;
    try {
      await createHabit({
        title: newTitle,
        frequency,
        target_count: targetCount,
        is_active: true,
        description: ""
      });
      setShowModal(false);
      setNewTitle("");
      setTargetCount(1);
      loadData();
      addNotification(`New Habit Planted: ${newTitle}`, 'info');
    } catch (err) {
      addNotification("Failed to create habit", "error");
    }
  };

  const handleLog = async (id) => {
    // Find target
    const habit = habits.find(h => h.id === id);
    const target = habit?.target_count || 1;

    // Optimistic Update
    setProgressMap(prev => {
      const current = prev[id] || 0;
      return { ...prev, [id]: current + 1 };
    });

    // Check if this move completes it
    if ((progressMap[id] || 0) + 1 >= target) {
      setCompletedMap(prev => ({ ...prev, [id]: true }));
    }

    try {
      const response = await logHabit(id);
      console.log("✅ Log API Success:", response);
      // REFRESH ORACLE: Immediately update insights after logging
      await refreshOracle();
      const habitTitle = habit?.title;
      addNotification(`Habit Record Appended: ${habitTitle}`, 'success');
    } catch (err) {
      console.error("❌ Log API Failed:", err);
      loadData(); // Re-fetch on error
      addNotification("Could not log habit.", "error");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Do you want to uproot this habit?")) {
      await deleteHabit(id);
      loadData();
    }
  };

  // Calculate pending daily habits
  const dailyHabits = habits.filter(h => h.frequency === 1);
  const pendingCount = dailyHabits.filter(h => !completedMap[h.id]).length;
  const allCleared = dailyHabits.length > 0 && pendingCount === 0;

  return (
    <div className={styles.container}>
      {/* ORACLE SYNC SECTION */}
      <div className={styles.oracleWrapper}>
        <OracleInsight insightData={insightData} isLoading={isLoadingInsights} />

        {hasSupport && (
          <button
            className={`${styles.micButton} ${isListening ? styles.listening : ''}`}
            onClick={isListening ? stopListening : startListening}
            title="Tell the Oracle you have practiced a virtue"
          >
            <IoMic size={24} />
          </button>
        )}
      </div>

      <header className={styles.header}>
        <h1>Garden of Habits</h1>
        <div className={`${styles.reminderCard} ${allCleared ? styles.allCleared : ''}`}>
          <IoLeaf className={styles.leafIcon} />
          <div className={styles.reminderText}>
            <p className={styles.mainMessage}>
              {allCleared
                ? "All virtues practiced. The garden is in full bloom."
                : pendingCount > 0
                  ? `You have ${pendingCount} habit${pendingCount > 1 ? 's' : ''} pending for today.`
                  : "Plant a seed to begin your daily rhythm."
              }
            </p>
            <p className={styles.quoteSub}>"{quote}"</p>
          </div>
        </div>
      </header>

      <div className={styles.controls}>
        <button onClick={() => setShowModal(true)} className={styles.addBtn}>
          <IoAdd /> Plant New Seed
        </button>
      </div>

      {isListening && <div className={styles.voiceOverlay}>The Oracle is listening... "{transcript}"</div>}

      {loading ? <p className={styles.loading}>Tending the garden...</p> : (
        <div className={styles.grid}>
          <div className={styles.column}>
            <h3>Daily Rhythms</h3>
            {habits.filter(h => h.frequency === 1).map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                isDone={completedMap[habit.id]}
                progress={progressMap[habit.id] || 0}
                onLog={() => handleLog(habit.id)}
                onUndo={() => handleUndoLog(habit.id)}
                onDelete={() => handleDelete(habit.id)}
              />
            ))}
          </div>

          <div className={styles.column}>
            <h3>Longer Term Growth</h3>
            {habits.filter(h => h.frequency !== 1).map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                isDone={completedMap[habit.id]}
                progress={progressMap[habit.id] || 0}
                onLog={() => handleLog(habit.id)}
                onUndo={() => handleUndoLog(habit.id)}
                onDelete={() => handleDelete(habit.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* MODAL (unchanged) */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Plant a New Habit</h2>
            <form onSubmit={handleCreate}>
              <input
                type="text" placeholder="What virtue will you practice?"
                value={newTitle} onChange={e => setNewTitle(e.target.value)} autoFocus
              />
              <div className={styles.selectGroup}>
                <div className={styles.selectWrapper}>
                  <label>Frequency:</label>
                  <select value={frequency} onChange={e => setFrequency(Number(e.target.value))}>
                    <option value={1}>Daily</option>
                    <option value={2}>Weekly</option>
                    <option value={3}>Monthly</option>
                  </select>
                </div>
                <div className={styles.selectWrapper}>
                  <label>Target Count:</label>
                  <input
                    type="number" min="1" max="31"
                    value={targetCount} onChange={e => setTargetCount(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>Plant</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const HabitCard = ({ habit, isDone, progress, onLog, onUndo, onDelete }) => {
  const target = habit.target_count || 1;
  const percentage = Math.min((progress / target) * 100, 100);

  const getFrequencyLabel = () => {
    if (habit.frequency === 1) return "Daily";
    if (habit.frequency === 2) return "Weekly";
    if (habit.frequency === 3) return "Monthly";
    return "";
  };

  const getStatusText = () => {
    if (isDone) return "Virtue Practiced";
    if (target > 1) return `${progress} / ${target} completed`;
    return "Awaiting Practice";
  };

  return (
    <div className={`${styles.card} ${isDone ? styles.completed : ''}`}>
      <div className={styles.cardInfo}>
        <div className={styles.cardHeader}>
          <h4>{habit.title}</h4>
          <span className={styles.freqTag}>{getFrequencyLabel()}</span>
        </div>

        {target > 1 && (
          <div className={styles.progressContainer}>
            <div className={styles.progressBar} style={{ width: `${percentage}%` }} />
          </div>
        )}

        <span className={styles.streak}>
          {getStatusText()}
        </span>
      </div>
      <div className={styles.cardActions}>
        {progress > 0 && (
          <button
            onClick={onUndo}
            className={styles.undoBtn}
            title="Undo last progress"
          >
            <IoArrowUndo />
          </button>
        )}

        <button
          onClick={onLog}
          className={`${styles.checkBtn} ${isDone ? styles.activeCheck : ''}`}
          title={isDone ? "Done for current period" : "Log session"}
          disabled={isDone}
        >
          <IoCheckmarkCircle />
        </button>
        <button onClick={onDelete} className={styles.deleteBtn}>
          <IoTrashBin />
        </button>
      </div>
    </div>
  );
};

export default Habits;