import PatientConnectionCodeRepository from "../repositories/PatientConnectionCodeRepository.js";
import PatientProfessionalAssociationRepository from "../repositories/PatientProfessionalAssociationRepository.js";

export const PatientConnectionCodeService = {
    // Gera novo código para o paciente
    generateCode: async (patientId) => {
        try {
            return await PatientConnectionCodeRepository.createOrUpdate(patientId);
        } catch (error) {
            console.error("Erro no PatientConnectionCodeService.generateCode:", error);
            throw error;
        }
    },

    // Busca código ativo do paciente
    getActiveCode: async (patientId) => {
        try {
            return await PatientConnectionCodeRepository.findActiveByPatientId(patientId);
        } catch (error) {
            console.error("Erro no PatientConnectionCodeService.getActiveCode:", error);
            throw error;
        }
    },

    // Conecta profissional ao paciente usando código
    connectWithCode: async (code, professionalId, professionalType) => {
        try {
            console.log('[PatientConnectionCodeService] connectWithCode - Iniciando conexão');
            console.log('  - code:', code);
            console.log('  - professionalId:', professionalId);
            console.log('  - professionalType:', professionalType);

            // 1. Busca código válido
            const codeData = await PatientConnectionCodeRepository.findValidByCode(code);

            if (!codeData) {
                console.log('[PatientConnectionCodeService] Código inválido ou expirado');
                throw new Error('Código inválido ou expirado');
            }

            console.log('[PatientConnectionCodeService] Código válido encontrado:', codeData);

            // 2. Verifica se paciente já tem associação
            const existingAssociation = await PatientProfessionalAssociationRepository.findByPatientId(codeData.patient_id);
            console.log('[PatientConnectionCodeService] Associação existente?', existingAssociation ? 'SIM' : 'NÃO');

            if (existingAssociation) {
                // Verifica se já tem o tipo de profissional específico
                if (professionalType === 'Nutricionist' && existingAssociation.nutricionist_id) {
                    throw new Error('Paciente já possui um nutricionista associado');
                }
                if (professionalType === 'Physical_educator' && existingAssociation.physical_educator_id) {
                    throw new Error('Paciente já possui um educador físico associado');
                }

                // Atualiza associação existente
                const updateData = professionalType === 'Nutricionist'
                    ? { nutricionist_id: professionalId }
                    : { physical_educator_id: professionalId };

                console.log('[PatientConnectionCodeService] Atualizando associação existente:', updateData);
                const updated = await PatientProfessionalAssociationRepository.update(existingAssociation.id, updateData);
                console.log('[PatientConnectionCodeService] Associação atualizada:', updated);

                // Marca código como usado
                await PatientConnectionCodeRepository.markAsUsed(codeData.id);

                return {
                    success: true,
                    association: updated,
                    patient_name: codeData.patient_name
                };
            } else {
                // Cria nova associação
                const newAssociation = professionalType === 'Nutricionist'
                    ? {
                        patient_id: codeData.patient_id,
                        nutricionist_id: professionalId,
                        physical_educator_id: null
                    }
                    : {
                        patient_id: codeData.patient_id,
                        nutricionist_id: null,
                        physical_educator_id: professionalId
                    };

                console.log('[PatientConnectionCodeService] Criando nova associação:', newAssociation);
                const created = await PatientProfessionalAssociationRepository.create(newAssociation);
                console.log('[PatientConnectionCodeService] Associação criada:', created);

                // Marca código como usado
                await PatientConnectionCodeRepository.markAsUsed(codeData.id);

                return {
                    success: true,
                    association: created,
                    patient_name: codeData.patient_name
                };
            }
        } catch (error) {
            console.error("Erro no PatientConnectionCodeService.connectWithCode:", error);
            throw error;
        }
    },

    // Limpa códigos expirados (pode ser chamado periodicamente)
    cleanupExpiredCodes: async () => {
        try {
            return await PatientConnectionCodeRepository.deleteExpired();
        } catch (error) {
            console.error("Erro no PatientConnectionCodeService.cleanupExpiredCodes:", error);
            throw error;
        }
    },

    // Deleta código do paciente
    deleteCode: async (patientId) => {
        try {
            return await PatientConnectionCodeRepository.deleteByPatientId(patientId);
        } catch (error) {
            console.error("Erro no PatientConnectionCodeService.deleteCode:", error);
            throw error;
        }
    }
};

export default PatientConnectionCodeService;
