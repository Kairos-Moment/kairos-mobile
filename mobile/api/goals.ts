import apiClient from './client';

export interface Goal {
    id: number;
    title: string;
    description?: string;
    status: 'active' | 'completed' | 'archived';
    user_id: string;
    created_at: string;
}

export const getGoals = async (): Promise<Goal[]> => {
    try {
        const response = await apiClient.get('/goals');
        return response.data;
    } catch (error) {
        console.error("API Error: Could not fetch goals.", error);
        throw error;
    }
};

export const createGoal = async (goalData: Partial<Goal>): Promise<Goal> => {
    try {
        const response = await apiClient.post('/goals', goalData);
        return response.data;
    } catch (error) {
        console.error("API Error: Could not create goal.", error);
        throw error;
    }
};
