import axios from 'axios';

export const API_ORIGIN = 'https://kairos-time-management.onrender.com';
const BASE_URL = `${API_ORIGIN}/api`;

const apiClient = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

export default apiClient;
