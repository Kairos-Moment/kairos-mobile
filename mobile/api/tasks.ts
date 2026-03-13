import apiClient from './client';

export interface Subtask {
    id?: number;
    title: string;
    is_completed: boolean;
}

export interface Task {
    id: number;
    title: string;
    description?: string;
    is_completed: boolean;
    is_urgent: boolean;
    is_important: boolean;
    due_date?: string;
    created_at: string;
    goal_id?: number | null;
    status: 'pending' | 'in-progress' | 'completed';
    subtasks?: Subtask[];
}

export const getTasks = async (): Promise<Task[]> => {
    try {
        const response = await apiClient.get('/tasks');
        return response.data;
    } catch (error) {
        console.error("API Error: Could not fetch tasks.", error);
        throw error;
    }
};

export const getTaskById = async (id: number): Promise<Task> => {
    try {
        const response = await apiClient.get(`/tasks/${id}`);
        return response.data;
    } catch (error) {
        console.error(`API Error: Could not fetch task with ID ${id}.`, error);
        throw error;
    }
};

export const createTask = async (taskData: Partial<Task>): Promise<Task> => {
    try {
        const response = await apiClient.post('/tasks', taskData);
        return response.data;
    } catch (error) {
        console.error("API Error: Could not create task.", error);
        throw error;
    }
};

export const updateTask = async (id: number, updatedData: Partial<Task>): Promise<Task> => {
    try {
        const response = await apiClient.put(`/tasks/${id}`, updatedData);
        return response.data;
    } catch (error) {
        console.error(`API Error: Could not update task with ID ${id}.`, error);
        throw error;
    }
};

export const deleteTask = async (id: number): Promise<{ message: string }> => {
    try {
        const response = await apiClient.delete(`/tasks/${id}`);
        return response.data;
    } catch (error) {
        console.error(`API Error: Could not delete task with ID ${id}.`, error);
        throw error;
    }
};

export const toggleSubtask = async (id: number): Promise<Subtask> => {
    try {
        const response = await apiClient.patch(`/tasks/subtasks/${id}/toggle`);
        return response.data;
    } catch (error) {
        console.error(`API Error: Could not toggle subtask with ID ${id}.`, error);
        throw error;
    }
};
