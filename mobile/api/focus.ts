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
    file_path: string | null;
    created_at?: string;
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

export const uploadTrack = async (title: string, audioUri: string, fileName: string): Promise<SavedTrack> => {
    try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('audio', {
            uri: audioUri,
            name: fileName,
            type: 'audio/mpeg',
        } as unknown as Blob);

        const response = await apiClient.post('/saved-tracks', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    } catch (error) {
        console.error("API Error: Could not upload track.", error);
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
