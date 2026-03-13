// frontend/src/api/tasksAPI.js

// 1. Import our pre-configured Axios instance, NOT fetch.
// This apiClient already knows the base URL (local or Render) and sends cookies.
import apiClient from './axios';

/**
 * Fetches all tasks for the currently logged-in user.
 * The backend gets the user ID from the session, so we don't need to send it.
 * @returns {Promise<Array>} A promise that resolves to an array of task objects.
 */
export const getTasks = async () => {
  try {
    // A GET request to /api/tasks (base URL is handled by apiClient)
    const response = await apiClient.get('/tasks');
    return response.data; // Return the array of tasks
  } catch (error) {
    console.error("API Error: Could not fetch tasks.", error);
    // In a real app, you might want to throw the error to be handled by the component
    throw error;
  }
};

/**
 * Fetches a single task by its ID.
 * The backend will verify that this task belongs to the logged-in user.
 * @param {number} id - The ID of the task to fetch.
 * @returns {Promise<object>} A promise that resolves to the task object.
 */
export const getTaskById = async (id) => {
  try {
    const response = await apiClient.get(`/tasks/${id}`);
    return response.data;
  } catch (error) {
    console.error(`API Error: Could not fetch task with ID ${id}.`, error);
    throw error;
  }
};

/**
 * Creates a new task for the logged-in user.
 * @param {object} taskData - An object containing the new task's details (title, description, etc.).
 *                            DO NOT include user_id. The backend handles this.
 * @returns {Promise<object>} A promise that resolves to the newly created task object.
 */
export const createTask = async (taskData) => {
  try {
    // A POST request with the task data in the body.
    const response = await apiClient.post('/tasks', taskData);
    return response.data;
  } catch (error) {
    console.error("API Error: Could not create task.", error);
    throw error;
  }
};

/**
 * Updates an existing task.
 * @param {number} id - The ID of the task to update.
 * @param {object} updatedData - An object containing the fields to be updated.
 * @returns {Promise<object>} A promise that resolves to the updated task object.
 */
export const updateTask = async (id, updatedData) => {
  try {
    // A PATCH request is conventional for partial updates.
    const response = await apiClient.patch(`/tasks/${id}`, updatedData);
    return response.data;
  } catch (error) {
    console.error(`API Error: Could not update task with ID ${id}.`, error);
    throw error;
  }
};

/**
 * Deletes a task by its ID.
 * @param {number} id - The ID of the task to delete.
 * @returns {Promise<object>} A promise that resolves to the success message from the API.
 */
export const deleteTask = async (id) => {
  try {
    const response = await apiClient.delete(`/tasks/${id}`);
    return response.data;
  } catch (error) {
    console.error(`API Error: Could not delete task with ID ${id}.`, error);
    throw error;
  }
};