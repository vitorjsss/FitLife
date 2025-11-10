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

export interface PhysicalEducatorData {
    name: string;
    birthdate: string;
    sex: string;
    contact: string;
    cref: string;
    auth_id: string; // UUID
}

class PhysicalEducatorService {
    async create(data: PhysicalEducatorData, config: { headers: { Authorization: string; }; }): Promise<any> {
        const response = await apiClient.post(API_CONFIG.ENDPOINTS.PHYSICAL_EDUCATOR.CREATE, data);
        return response.data;
    }

    async getAll(): Promise<any[]> {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.PHYSICAL_EDUCATOR.GET_ALL);
        return response.data;
    }

    async getById(id: string): Promise<any> {
        const endpoint = API_CONFIG.ENDPOINTS.PHYSICAL_EDUCATOR.GET_BY_ID.replace('{id}', id);
        const response = await apiClient.get(endpoint);
        return response.data;
    }

    async getByAuthId(auth_id: string): Promise<any> {
        const endpoint = API_CONFIG.ENDPOINTS.PHYSICAL_EDUCATOR.GET_BY_AUTH_ID.replace('{auth_id}', auth_id);
        const response = await apiClient.get(endpoint);
        return response.data;
    }

    async update(id: string, data: Partial<PhysicalEducatorData>): Promise<any> {
        const endpoint = API_CONFIG.ENDPOINTS.PHYSICAL_EDUCATOR.UPDATE.replace('{id}', id);
        const response = await apiClient.put(endpoint, data);
        return response.data;
    }

    async uploadAvatar(id: string, file: { uri: string; type: string; name: string }): Promise<any> {
        const formData = new FormData();
        formData.append('avatar', {
            uri: file.uri,
            type: file.type,
            name: file.name,
        } as any);

        const endpoint = API_CONFIG.ENDPOINTS.PHYSICAL_EDUCATOR.UPLOAD_AVATAR.replace('{id}', id);
        const token = await AsyncStorage.getItem('@fitlife:access_token');

        const response = await apiClient.patch(endpoint, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`,
            },
        });
        return response.data;
    }
}

export const physicalEducatorService = new PhysicalEducatorService();