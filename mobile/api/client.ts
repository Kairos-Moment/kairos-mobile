import axios from 'axios';

const BASE_URL = 'https://kairos-time-management.onrender.com/api';

const apiClient = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

export default apiClient;
