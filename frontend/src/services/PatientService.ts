import axios from 'axios';
import { API_CONFIG } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
});

apiClient.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('@fitlife:access_token');
    if (token) {
        if (!config.headers) {
            config.headers = {} as import('axios').AxiosRequestHeaders;
        }
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

export interface PatientData {
    name: string;
    birthdate: string;
    //sex: string;
    contact: string;
    auth_id: string; // UUID
}

class PatientService {
    async create(data: PatientData): Promise<any> {
        const response = await apiClient.post(API_CONFIG.ENDPOINTS.PATIENT.CREATE, data);
        return response.data;
    }

    async getAll(): Promise<any[]> {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.PATIENT.GET_ALL);
        return response.data;
    }

    async getById(id: string): Promise<any> {
        const endpoint = API_CONFIG.ENDPOINTS.PATIENT.GET_BY_ID.replace('{id}', id);
        console.log('Fetching patient with endpoint:', endpoint); // Debug log
        const response = await apiClient.get(endpoint);
        console.log('Received response:', response.data); // Debug log
        return response.data;
    }

    async getByAuthId(auth_id: string): Promise<any> {
        const endpoint = API_CONFIG.ENDPOINTS.PATIENT.GET_BY_AUTH_ID.replace('{auth_id}', auth_id);
        console.log('Fetching patient by auth_id with endpoint:', endpoint);
        const response = await apiClient.get(endpoint);
        console.log('Received response:', response.data);
        return response.data;
    }

    async update(id: string, data: Partial<PatientData>): Promise<any> {
        const endpoint = API_CONFIG.ENDPOINTS.PATIENT.UPDATE.replace('{id}', id);
        const response = await apiClient.put(endpoint, data);
        return response.data;
    }
}

export const patientService = new PatientService();