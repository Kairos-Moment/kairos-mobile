import apiClient from './axios';

export const getSavedTracks = async () => {
    const response = await apiClient.get('/saved-tracks');
    return response.data;
};

export const saveTrack = async (title, youtubeId) => {
    const response = await apiClient.post('/saved-tracks', { title, youtube_id: youtubeId });
    return response.data;
};

export const deleteTrack = async (id) => {
    const response = await apiClient.delete(`/saved-tracks/${id}`);
    return response.data;
};
