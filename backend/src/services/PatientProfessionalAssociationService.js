import PatientProfessionalAssociationRepository from "../repositories/PatientProfessionalAssociationRepository.js";

export const PatientProfessionalAssociationService = {
    create: async (data) => {
        try {
            return await PatientProfessionalAssociationRepository.create(data);
        } catch (error) {
            console.error("Erro no PatientProfessionalAssociationService.create:", error);
            throw error;
        }
    },

    getById: async (id) => {
        try {
            return await PatientProfessionalAssociationRepository.findById(id);
        } catch (error) {
            console.error("Erro no PatientProfessionalAssociationService.getById:", error);
            throw error;
        }
    },

    getByPatientId: async (patientId) => {
        try {
            return await PatientProfessionalAssociationRepository.findByPatientId(patientId);
        } catch (error) {
            console.error("Erro no PatientProfessionalAssociationService.getByPatientId:", error);
            throw error;
        }
    },

    getPatientsByNutricionistId: async (nutricionistId) => {
        try {
            console.log('[PatientProfessionalAssociationService] getPatientsByNutricionistId - nutricionistId:', nutricionistId);
            const patients = await PatientProfessionalAssociationRepository.findPatientsByNutricionistId(nutricionistId);
            console.log('[PatientProfessionalAssociationService] Pacientes encontrados:', patients.length);
            return patients;
        } catch (error) {
            console.error("Erro no PatientProfessionalAssociationService.getPatientsByNutricionistId:", error);
            throw error;
        }
    },

    getPatientsByPhysicalEducatorId: async (physicalEducatorId) => {
        try {
            console.log('[PatientProfessionalAssociationService] getPatientsByPhysicalEducatorId - physicalEducatorId:', physicalEducatorId);
            const patients = await PatientProfessionalAssociationRepository.findPatientsByPhysicalEducatorId(physicalEducatorId);
            console.log('[PatientProfessionalAssociationService] Pacientes encontrados:', patients.length);
            return patients;
        } catch (error) {
            console.error("Erro no PatientProfessionalAssociationService.getPatientsByPhysicalEducatorId:", error);
            throw error;
        }
    },

    update: async (id, data) => {
        try {
            return await PatientProfessionalAssociationRepository.update(id, data);
        } catch (error) {
            console.error("Erro no PatientProfessionalAssociationService.update:", error);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            return await PatientProfessionalAssociationRepository.delete(id);
        } catch (error) {
            console.error("Erro no PatientProfessionalAssociationService.delete:", error);
            throw error;
        }
    },

    deactivate: async (id) => {
        try {
            return await PatientProfessionalAssociationRepository.deactivate(id);
        } catch (error) {
            console.error("Erro no PatientProfessionalAssociationService.deactivate:", error);
            throw error;
        }
    }
};

export default PatientProfessionalAssociationService;
