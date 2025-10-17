import { apiClient } from './apiClient';

export interface DailyMealData {
    id?: string;
    date: string;
    created_at?: string;
    updated_at?: string;
    patient_id: string;
}

const DailyMealService = {
    create: async (data: DailyMealData) => {
        return apiClient.post('/daily-meal-registry', data);
    },

    getAll: async () => {
        return apiClient.get('/daily-meal-registry');
    },

    getById: async (id: string) => {
        return apiClient.get(`/daily-meal-registry/${id}`);
    },

    getByPatientId: async (patientId: string) => {
        return apiClient.get(`/daily-meal-registry?patientId=${encodeURIComponent(patientId)}`);
    },

    getByDate: async (date: string) => {
        return apiClient.get(`/daily-meal-registry?date=${encodeURIComponent(date)}`);
    },

    update: async (id: string, data: DailyMealData) => {
        return apiClient.put(`/daily-meal-registry/${id}`, data);
    },

    delete: async (id: string) => {
        return apiClient.delete(`/daily-meal-registry/${id}`);
    },
};

export default DailyMealService;