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
        return apiClient.post('/daily-meals', data);
    },

    getAll: async () => {
        return apiClient.get('/daily-meals');
    },

    getById: async (id: string) => {
        return apiClient.get(`/daily-meals/${id}`);
    },

    getByPatientId: async (patientId: string) => {
        return apiClient.get(`/daily-meals?patientId=${encodeURIComponent(patientId)}`);
    },

    getByDate: async (date: string) => {
        return apiClient.get(`/daily-meals?date=${encodeURIComponent(date)}`);
    },

    update: async (id: string, data: DailyMealData) => {
        return apiClient.put(`/daily-meals/${id}`, data);
    },

    delete: async (id: string) => {
        return apiClient.delete(`/daily-meals/${id}`);
    },
};

export default DailyMealService;