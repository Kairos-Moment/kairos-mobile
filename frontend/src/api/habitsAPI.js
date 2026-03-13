import apiClient from './axios';

// --- HABIT DEFINITIONS ---

export const fetchHabits = async () => {
  const response = await apiClient.get('/habits');
  return response.data;
};

export const createHabit = async (habitData) => {
  // habitData: { title, description, frequency, is_active }
  const response = await apiClient.post('/habits', habitData);
  return response.data;
};

export const deleteHabit = async (id) => {
  return await apiClient.delete(`/habits/${id}`);
};

// --- HABIT LOGS (Checking them off) ---

// Helper to get local date string YYYY-MM-DD
const getLocalDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to get UTC date string YYYY-MM-DD
const getUTCDate = () => {
  return new Date().toISOString().split('T')[0];
};

export const logHabit = async (habitId, notes = "") => {
  const date = getLocalDate();

  const payload = {
    habit_id: habitId,
    completion_date: date,
    notes: notes
  };

  const response = await apiClient.post('/habit-logs', payload);
  return response.data;
};

export const undoHabitLog = async (habitId) => {
  const response = await apiClient.delete(`/habit-logs/habit/${habitId}/latest`);
  return response.data;
};

// We need this to check if a habit is already done today
export const fetchHabitLogs = async (habitId) => {
  const response = await apiClient.get(`/habit-logs/habit/${habitId}`);
  return response.data; // Returns array of logs
};