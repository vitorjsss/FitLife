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
    auth_id: number;
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

    async getById(id: number): Promise<any> {
        const endpoint = API_CONFIG.ENDPOINTS.PATIENT.GET_BY_ID.replace('{id}', id.toString());
        const response = await apiClient.get(endpoint);
        return response.data;
    }

    async update(id: number, data: Partial<PatientData>): Promise<any> {
        const endpoint = API_CONFIG.ENDPOINTS.PATIENT.UPDATE.replace('{id}', id.toString());
        const response = await apiClient.put(endpoint, data);
        return response.data;
    }
}

export const patientService = new PatientService();