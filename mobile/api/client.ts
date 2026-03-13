import axios from 'axios';
import { Platform } from 'react-native';

// Use your computer's local IP address so physical devices can reach it
const LOCAL_IP = '192.168.1.103';
const BASE_URL = `http://${LOCAL_IP}:5001/api`;

const apiClient = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

export default apiClient;
