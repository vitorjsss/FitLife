import MealItemRepository from "../repositories/MealItemRepository.js";

export const MealItemService = {
    create: async (data) => {
        try {
            return await MealItemRepository.create(data);
        } catch (error) {
            console.error("Erro no MealItemService.create:", error);
            throw error;
        }
    },

    getAll: async () => {
        try {
            return await MealItemRepository.findAll();
        } catch (error) {
            console.error("Erro no MealItemService.getAll:", error);
            throw error;
        }
    },

    getById: async (id) => {
        try {
            return await MealItemRepository.findById(id);
        } catch (error) {
            console.error("Erro no MealItemService.getById:", error);
            throw error;
        }
    },

    getByMealId: async (mealId) => {
        try {
            return await MealItemRepository.findByMealId(mealId);
        } catch (error) {
            console.error("Erro no MealItemService.getByMealId:", error);
            throw error;
        }
    },

    getByFoodId: async (foodId) => {
        try {
            return await MealItemRepository.findByFoodId(foodId);
        } catch (error) {
            console.error("Erro no MealItemService.getByFoodId:", error);
            throw error;
        }
    },

    getWithFoodDetails: async (id) => {
        try {
            return await MealItemRepository.findWithFoodDetails(id);
        } catch (error) {
            console.error("Erro no MealItemService.getWithFoodDetails:", error);
            throw error;
        }
    },

    update: async (id, data) => {
        try {
            return await MealItemRepository.update(id, data);
        } catch (error) {
            console.error("Erro no MealItemService.update:", error);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            return await MealItemRepository.delete(id);
        } catch (error) {
            console.error("Erro no MealItemService.delete:", error);
            throw error;
        }
    }
};