import apiClient from './client';

export interface Habit {
    id: number;
    title: string;
    description?: string;
    frequency: number;
    target_count: number;
    is_active: boolean;
    created_at: string;
}

export interface HabitLog {
    id: number;
    habit_id: number;
    completion_date: string;
    notes?: string;
}

export const fetchHabits = async (): Promise<Habit[]> => {
    const response = await apiClient.get('/habits');
    return response.data;
};

export const createHabit = async (habitData: Partial<Habit>): Promise<Habit> => {
    const response = await apiClient.post('/habits', habitData);
    return response.data;
};

export const deleteHabit = async (id: number): Promise<void> => {
    await apiClient.delete(`/habits/${id}`);
};

const getLocalDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const logHabit = async (habitId: number, notes = ""): Promise<HabitLog> => {
    const date = getLocalDate();
    const payload = {
        habit_id: habitId,
        completion_date: date,
        notes: notes
    };
    const response = await apiClient.post('/habit-logs', payload);
    return response.data;
};

export const undoHabitLog = async (habitId: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/habit-logs/habit/${habitId}/latest`);
    return response.data;
};

export const fetchHabitLogs = async (habitId: number): Promise<HabitLog[]> => {
    const response = await apiClient.get(`/habit-logs/habit/${habitId}`);
    return response.data;
};
