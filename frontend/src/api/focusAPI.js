// frontend/src/api/focusAPI.js
import apiClient from './axios';

export const createFocusSession = async (sessionData) => {
  // sessionData must include: { task_id, start_time, end_time, notes }
  const response = await apiClient.post('/focus-sessions', sessionData);
  return response.data;
};

export const getFocusHistory = async () => {
  const response = await apiClient.get('/focus-sessions');
  return response.data;
};