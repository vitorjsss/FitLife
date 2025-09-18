import PhysicalEducatorRepository from "../repositories/PhysicalEducatorRepository.js";

export const PhysicalEducatorService = {
    create: async (data) => PhysicalEducatorRepository.create(data),
    getAll: async () => PhysicalEducatorRepository.findAll(),
    getById: async (id) => PhysicalEducatorRepository.findById(id),
    update: async (id, data) => PhysicalEducatorRepository.update(id, data),
    delete: async (id) => PhysicalEducatorRepository.delete(id)
};