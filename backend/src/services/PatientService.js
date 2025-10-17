import PatientRepository from "../repositories/PatientRepository.js";

export const PatientService = {
    create: async (data) => {
        // Aqui você pode adicionar validações ou lógica extra se necessário
        return await PatientRepository.create(data);
    },
    getAll: async () => {
        return await PatientRepository.findAll();
    },
    getById: async (id) => {
        return await PatientRepository.findByAuthId(id);
    },
    update: async (id, data) => {
        return await PatientRepository.update(id, data);
    }
};
