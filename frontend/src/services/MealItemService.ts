export interface MealItemData {
    id?: string; // UUID, opcional ao criar
    food_name: string;
    quantity?: string;
    calories?: number;
    proteins?: number;
    carbs?: number;
    fats?: number;
    created_at?: string;
    updated_at?: string;
    meal_id: string; // UUID
}

import { apiClient } from './apiClient';

const MealItemService = {
    create: async (data: MealItemData) => {
        return apiClient.post('/meal-item', data);
    },

    getAll: async () => {
        return apiClient.get('/meal-item');
    },

    getById: async (id: string) => {
        return apiClient.get(`/meal-item/${id}`);
    },

    getByMeal: async (meal_id: string) => {
        return apiClient.get(`/meal-item?meal_id=${encodeURIComponent(meal_id)}`);
    },

    update: async (id: string, data: MealItemData) => {
        return apiClient.put(`/meal-item/${id}`, data);
    },

    delete: async (id: string) => {
        return apiClient.delete(`/meal-item/${id}`);
    },
};

export default MealItemService;
