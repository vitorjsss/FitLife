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
    food_id: string; // UUID
    meal_id: string; // UUID
}

import { apiClient } from './apiClient';

const MealItemService = {
    create: async (data: MealItemData) => {
        return apiClient.post('/meal-items', data);
    },

    getAll: async () => {
        return apiClient.get('/meal-items');
    },

    getById: async (id: string) => {
        return apiClient.get(`/meal-items/${id}`);
    },

    getByMeal: async (meal_id: string) => {
        return apiClient.get(`/meal-items?meal_id=${encodeURIComponent(meal_id)}`);
    },

    update: async (id: string, data: MealItemData) => {
        return apiClient.put(`/meal-items/${id}`, data);
    },

    delete: async (id: string) => {
        return apiClient.delete(`/meal-items/${id}`);
    },
};

export default MealItemService;
