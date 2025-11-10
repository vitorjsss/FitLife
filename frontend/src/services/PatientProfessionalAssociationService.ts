import { apiClient } from './apiClient';

export interface PatientProfessionalAssociation {
    id?: string;
    patient_id: string;
    nutricionist_id?: string;
    physical_educator_id?: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    // Dados do nutricionista
    nutricionist_name?: string;
    nutricionist_contact?: string;
    nutricionist_crn?: string;
    nutricionist_avatar?: string;
    // Dados do educador físico
    physical_educator_name?: string;
    physical_educator_contact?: string;
    physical_educator_cref?: string;
    physical_educator_avatar?: string;
}

export interface PatientInfo {
    patient_id: string;
    patient_name: string;
    birthdate: string;
    sex: string;
    contact: string;
    avatar_path?: string;
}

const PatientProfessionalAssociationService = {
    create: async (data: PatientProfessionalAssociation) => {
        return apiClient.post('/patient-professional-association', data);
    },

    getById: async (id: string) => {
        return apiClient.get(`/patient-professional-association/${id}`);
    },

    getByPatientId: async (patientId: string) => {
        return apiClient.get(`/patient-professional-association/patient/${patientId}`);
    },

    getPatientsByNutricionistId: async (nutricionistId: string): Promise<PatientInfo[]> => {
        return apiClient.get(`/patient-professional-association/nutricionist/${nutricionistId}/patients`);
    },

    getPatientsByPhysicalEducatorId: async (physicalEducatorId: string): Promise<PatientInfo[]> => {
        return apiClient.get(`/patient-professional-association/physical-educator/${physicalEducatorId}/patients`);
    },

    update: async (id: string, data: Partial<PatientProfessionalAssociation>) => {
        return apiClient.put(`/patient-professional-association/${id}`, data);
    },

    deactivate: async (id: string) => {
        return apiClient.put(`/patient-professional-association/${id}/deactivate`, {});
    },

    delete: async (id: string) => {
        return apiClient.delete(`/patient-professional-association/${id}`);
    },
};

export default PatientProfessionalAssociationService;
