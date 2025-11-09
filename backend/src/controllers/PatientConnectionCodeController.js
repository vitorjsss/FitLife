import { PatientConnectionCodeService } from "../services/PatientConnectionCodeService.js";
import { LogService } from "../services/LogService.js";
import { NutricionistService } from "../services/NutricionistService.js";
import { PhysicalEducatorService } from "../services/PhysicalEducatorService.js";
import { AuthRepository } from "../repositories/AuthRepository.js";

export const PatientConnectionCodeController = {
    // Gera novo código para o paciente
    generateCode: async (req, res) => {
        const { patientId } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const codeData = await PatientConnectionCodeService.generateCode(patientId);

            await LogService.createLog({
                action: "GENERATE_CONNECTION_CODE",
                logType: "CREATE",
                description: `Código de conexão gerado para paciente ${patientId}`,
                ip,
                oldValue: null,
                newValue: codeData,
                status: "SUCCESS",
                userId: userId
            });

            res.status(201).json(codeData);
        } catch (err) {
            await LogService.createLog({
                action: "GENERATE_CONNECTION_CODE",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { patientId },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao gerar código de conexão", error: err.message });
        }
    },

    // Busca código ativo do paciente
    getActiveCode: async (req, res) => {
        const { patientId } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const codeData = await PatientConnectionCodeService.getActiveCode(patientId);

            await LogService.createLog({
                action: "GET_ACTIVE_CONNECTION_CODE",
                logType: "READ",
                description: `Código de conexão do paciente ${patientId} consultado`,
                ip,
                oldValue: null,
                newValue: null,
                status: "SUCCESS",
                userId: userId
            });

            res.json(codeData || {});
        } catch (err) {
            await LogService.createLog({
                action: "GET_ACTIVE_CONNECTION_CODE",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: null,
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao buscar código de conexão", error: err.message });
        }
    },

    // Conecta profissional ao paciente usando código
    connectWithCode: async (req, res) => {
        const { code } = req.body;
        const ip = req.ip;
        const userEmail = req.user?.email;
        const userType = req.user?.user_type;
        let authUserId = null;

        try {
            if (!code) {
                return res.status(400).json({ message: "Código é obrigatório" });
            }

            if (!userType || (userType !== 'Nutricionist' && userType !== 'Physical_educator')) {
                return res.status(403).json({ message: "Apenas nutricionistas e educadores físicos podem usar códigos de conexão" });
            }

            // Busca o auth_id do usuário através do email
            const authUser = await AuthRepository.findByEmail(userEmail);
            if (!authUser) {
                return res.status(404).json({ message: "Usuário não encontrado" });
            }

            authUserId = authUser.id;

            // Busca o ID do profissional baseado no auth_id
            let professionalId;

            if (userType === 'Nutricionist') {
                const nutricionist = await NutricionistService.getByAuthId(authUser.id);
                if (!nutricionist) {
                    return res.status(404).json({ message: "Nutricionista não encontrado" });
                }
                professionalId = nutricionist.id;
            } else {
                const physicalEducator = await PhysicalEducatorService.getByAuthId(authUser.id);
                if (!physicalEducator) {
                    return res.status(404).json({ message: "Educador físico não encontrado" });
                }
                professionalId = physicalEducator.id;
            }

            console.log('[PatientConnectionCodeController] Professional found:', { id: professionalId, email: userEmail, type: userType });

            const result = await PatientConnectionCodeService.connectWithCode(code, professionalId, userType);

            await LogService.createLog({
                action: "CONNECT_WITH_CODE",
                logType: "CREATE",
                description: `${userType} ${professionalId} conectado ao paciente ${result.patient_name} via código`,
                ip,
                oldValue: null,
                newValue: result,
                status: "SUCCESS",
                userId: authUserId
            });

            res.status(200).json(result);
        } catch (err) {
            console.error('[PatientConnectionCodeController] Erro ao conectar com código:', err);

            await LogService.createLog({
                action: "CONNECT_WITH_CODE",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { code },
                status: "FAILURE",
                userId: authUserId
            }).catch(logErr => console.error('[PatientConnectionCodeController] Erro ao criar log de erro:', logErr));

            // Retorna erro específico para o cliente
            const statusCode = err.message.includes('inválido') || err.message.includes('expirado') ? 404 :
                err.message.includes('já possui') ? 409 : 500;

            res.status(statusCode).json({ message: err.message });
        }
    },

    // Deleta código do paciente
    deleteCode: async (req, res) => {
        const { patientId } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            await PatientConnectionCodeService.deleteCode(patientId);

            await LogService.createLog({
                action: "DELETE_CONNECTION_CODE",
                logType: "DELETE",
                description: `Código de conexão do paciente ${patientId} deletado`,
                ip,
                oldValue: null,
                newValue: null,
                status: "SUCCESS",
                userId: userId
            });

            res.json({ message: "Código deletado com sucesso" });
        } catch (err) {
            await LogService.createLog({
                action: "DELETE_CONNECTION_CODE",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: null,
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao deletar código", error: err.message });
        }
    },

    // Limpa códigos expirados (endpoint admin)
    cleanupExpired: async (req, res) => {
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const deleted = await PatientConnectionCodeService.cleanupExpiredCodes();

            await LogService.createLog({
                action: "CLEANUP_EXPIRED_CODES",
                logType: "DELETE",
                description: `${deleted.length} códigos expirados removidos`,
                ip,
                oldValue: null,
                newValue: { count: deleted.length },
                status: "SUCCESS",
                userId: userId
            });

            res.json({ message: `${deleted.length} códigos expirados removidos`, count: deleted.length });
        } catch (err) {
            await LogService.createLog({
                action: "CLEANUP_EXPIRED_CODES",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: null,
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao limpar códigos expirados", error: err.message });
        }
    }
};

export default PatientConnectionCodeController;
