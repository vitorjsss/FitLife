import NutricionistRepository from "../repositories/NutricionistRepository.js";

export const NutricionistService = {
    create: async (data) => NutricionistRepository.create(data),
    getAll: async () => NutricionistRepository.findAll(),
    getById: async (id) => NutricionistRepository.findById(id),
    update: async (id, data) => NutricionistRepository.update(id, data),
    delete: async (id) => NutricionistRepository.delete(id)
};