import FoodRepository from "../repositories/FoodRepository.js";

export const FoodService = {
    create: async (data) => {
        try {
            return await FoodRepository.create(data);
        } catch (error) {
            console.error("Erro no FoodService.create:", error);
            throw error;
        }
    },

    getAll: async () => {
        try {
            return await FoodRepository.findAll();
        } catch (error) {
            console.error("Erro no FoodService.getAll:", error);
            throw error;
        }
    },

    getById: async (id) => {
        try {
            return await FoodRepository.findById(id);
        } catch (error) {
            console.error("Erro no FoodService.getById:", error);
            throw error;
        }
    },

    searchByName: async (name) => {
        try {
            return await FoodRepository.findByName(name);
        } catch (error) {
            console.error("Erro no FoodService.searchByName:", error);
            throw error;
        }
    },

    update: async (id, data) => {
        try {
            return await FoodRepository.update(id, data);
        } catch (error) {
            console.error("Erro no FoodService.update:", error);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            return await FoodRepository.delete(id);
        } catch (error) {
            console.error("Erro no FoodService.delete:", error);
            throw error;
        }
    }
};