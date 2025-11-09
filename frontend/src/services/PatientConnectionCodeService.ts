import { apiClient } from './apiClient';

export interface ConnectionCode {
    id: string;
    patient_id: string;
    code: string;
    created_at: string;
    expires_at: string;
    used: boolean;
}

export interface ConnectResult {
    success: boolean;
    association: any;
    patient_name: string;
}

const PatientConnectionCodeService = {
    // Gera novo código para o paciente
    generateCode: async (patientId: string): Promise<ConnectionCode> => {
        return apiClient.post(`/patient-connection-code/generate/${patientId}`, {});
    },

    // Busca código ativo do paciente
    getActiveCode: async (patientId: string): Promise<ConnectionCode | null> => {
        return apiClient.get(`/patient-connection-code/active/${patientId}`);
    },

    // Conecta profissional ao paciente usando código
    connectWithCode: async (code: string): Promise<ConnectResult> => {
        return apiClient.post('/patient-connection-code/connect', { code });
    },

    // Deleta código do paciente
    deleteCode: async (patientId: string) => {
        return apiClient.delete(`/patient-connection-code/${patientId}`);
    },
};

export default PatientConnectionCodeService;
