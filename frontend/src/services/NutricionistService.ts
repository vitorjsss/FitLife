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

export interface NutricionistData {
    name: string;
    birthdate: string;
    sex: string;
    contact: string;
    crn: string;
    auth_id: string; // UUID
}

class NutricionistService {
    async create(data: NutricionistData, config: { headers: { Authorization: string; }; }): Promise<any> {
        const response = await apiClient.post(API_CONFIG.ENDPOINTS.NUTRICIONIST.CREATE, data);
        return response.data;
    }

    async getAll(): Promise<any[]> {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.NUTRICIONIST.GET_ALL);
        return response.data;
    }

    async getById(id: string): Promise<any> {
        const endpoint = API_CONFIG.ENDPOINTS.NUTRICIONIST.GET_BY_ID.replace('{id}', id);
        const response = await apiClient.get(endpoint);
        return response.data;
    }

    async getByAuthId(auth_id: string): Promise<any> {
        const endpoint = API_CONFIG.ENDPOINTS.NUTRICIONIST.GET_BY_AUTH_ID.replace('{auth_id}', auth_id);
        console.log('[NutricionistService] getByAuthId - endpoint:', endpoint, 'auth_id:', auth_id);
        const response = await apiClient.get(endpoint);
        return response.data;
    }

    async update(id: string, data: Partial<NutricionistData>): Promise<any> {
        const endpoint = API_CONFIG.ENDPOINTS.NUTRICIONIST.UPDATE.replace('{id}', id);
        const response = await apiClient.put(endpoint, data);
        return response.data;
    }
}

export const nutricionistService = new NutricionistService();