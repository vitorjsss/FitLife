import DailyMealRegistryRepository from "../repositories/DailyMealRegistryRepository.js";

export const DailyMealRegistryService = {
    create: async (data) => {
        try {
            return await DailyMealRegistryRepository.create(data);
        } catch (error) {
            console.error("Erro no DailyMealRegistryService.create:", error);
            throw error;
        }
    },

    getAll: async () => {
        try {
            return await DailyMealRegistryRepository.findAll();
        } catch (error) {
            console.error("Erro no DailyMealRegistryService.getAll:", error);
            throw error;
        }
    },

    getById: async (id) => {
        try {
            return await DailyMealRegistryRepository.findById(id);
        } catch (error) {
            console.error("Erro no DailyMealRegistryService.getById:", error);
            throw error;
        }
    },

    getByPatientId: async (patientId) => {
        try {
            return await DailyMealRegistryRepository.findByPatientId(patientId);
        } catch (error) {
            console.error("Erro no DailyMealRegistryService.getByPatientId:", error);
            throw error;
        }
    },

    getByDate: async (date) => {
        try {
            return await DailyMealRegistryRepository.findByDate(date);
        } catch (error) {
            console.error("Erro no DailyMealRegistryService.getByDate:", error);
            throw error;
        }
    },

    update: async (id, data) => {
        try {
            return await DailyMealRegistryRepository.update(id, data);
        } catch (error) {
            console.error("Erro no DailyMealRegistryService.update:", error);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            return await DailyMealRegistryRepository.delete(id);
        } catch (error) {
            console.error("Erro no DailyMealRegistryService.delete:", error);
            throw error;
        }
    }
};