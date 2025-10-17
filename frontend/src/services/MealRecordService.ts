export interface MealRecordData {
    id?: string; // UUID, opcional ao criar
    name: string;
    icon_path?: string;
    created_at?: string;
    updated_at?: string;
    daily_meal_registry_id: string; // UUID
}

import { apiClient } from './apiClient';

const MealRecordService = {
    create: async (data: MealRecordData) => {
        return apiClient.post('/meal-records', data);
    },

    getAll: async () => {
        return apiClient.get('/meal-records');
    },

    getById: async (id: string) => {
        return apiClient.get(`/meal-records/${id}`);
    },

    getByRegistry: async (daily_meal_registry_id: string) => {
        return apiClient.get(`/meal-records?daily_meal_registry_id=${encodeURIComponent(daily_meal_registry_id)}`);
    },

    update: async (id: string, data: MealRecordData) => {
        return apiClient.put(`/meal-records/${id}`, data);
    },

    delete: async (id: string) => {
        return apiClient.delete(`/meal-records/${id}`);
    },
};

export default MealRecordService;
