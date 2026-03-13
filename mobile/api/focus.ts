import apiClient from './client';

export interface FocusSession {
    id: number;
    task_id: number;
    start_time: string;
    end_time: string;
    notes?: string;
}

export interface SavedTrack {
    id: number;
    title: string;
    youtube_id: string;
}

export const createFocusSession = async (sessionData: Partial<FocusSession>): Promise<FocusSession> => {
    try {
        const response = await apiClient.post('/focus-sessions', sessionData);
        return response.data;
    } catch (error) {
        console.error("API Error: Could not create focus session.", error);
        throw error;
    }
};

export const getSavedTracks = async (): Promise<SavedTrack[]> => {
    try {
        const response = await apiClient.get('/saved-tracks');
        return response.data;
    } catch (error) {
        console.error("API Error: Could not fetch saved tracks.", error);
        throw error;
    }
};

export const saveTrack = async (title: string, youtubeId: string): Promise<SavedTrack> => {
    try {
        const response = await apiClient.post('/saved-tracks', { title, youtube_id: youtubeId });
        return response.data;
    } catch (error) {
        console.error("API Error: Could not save track.", error);
        throw error;
    }
};

export const deleteTrack = async (id: number): Promise<void> => {
    try {
        await apiClient.delete(`/saved-tracks/${id}`);
    } catch (error) {
        console.error("API Error: Could not delete track.", error);
        throw error;
    }
};
