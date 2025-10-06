import MealRecordRepository from "../repositories/MealRecordRepository.js";

export const MealRecordService = {
    create: async (data) => {
        try {
            return await MealRecordRepository.create(data);
        } catch (error) {
            console.error("Erro no MealRecordService.create:", error);
            throw error;
        }
    },

    getAll: async () => {
        try {
            return await MealRecordRepository.findAll();
        } catch (error) {
            console.error("Erro no MealRecordService.getAll:", error);
            throw error;
        }
    },

    getById: async (id) => {
        try {
            return await MealRecordRepository.findById(id);
        } catch (error) {
            console.error("Erro no MealRecordService.getById:", error);
            throw error;
        }
    },

    getByDailyMealRegistryId: async (dailyMealRegistryId) => {
        try {
            return await MealRecordRepository.findByDailyMealRegistryId(dailyMealRegistryId);
        } catch (error) {
            console.error("Erro no MealRecordService.getByDailyMealRegistryId:", error);
            throw error;
        }
    },

    getWithItems: async (id) => {
        try {
            return await MealRecordRepository.findWithItems(id);
        } catch (error) {
            console.error("Erro no MealRecordService.getWithItems:", error);
            throw error;
        }
    },

    update: async (id, data) => {
        try {
            return await MealRecordRepository.update(id, data);
        } catch (error) {
            console.error("Erro no MealRecordService.update:", error);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            return await MealRecordRepository.delete(id);
        } catch (error) {
            console.error("Erro no MealRecordService.delete:", error);
            throw error;
        }
    }
};