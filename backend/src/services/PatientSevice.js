import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import PatientRepository from "../repositories/PatientRepository.js";

export const PatientService = {
    create: async (patientData) => {
        return await PatientRepository.create(patientData);
    },

    getAll: async () => {
        return await PatientRepository.findAll();
    },

    getById: async (id) => {
        return await PatientRepository.findById(id);
    },

    update: async (id, patientData) => {
        return await PatientRepository.update(id, patientData);
    },

    delete: async (id) => {
        return await PatientRepository.delete(id);
    }
};