import { PatientProfessionalAssociationService } from "../services/PatientProfessionalAssociationService.js";
import { LogService } from "../services/LogService.js";

export const PatientProfessionalAssociationController = {
    create: async (req, res) => {
        const data = req.body;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const association = await PatientProfessionalAssociationService.create(data);

            await LogService.createLog({
                action: "CREATE_PATIENT_ASSOCIATION",
                logType: "CREATE",
                description: `Associação de paciente criada com sucesso`,
                ip,
                oldValue: null,
                newValue: association,
                status: "SUCCESS",
                userId: userId
            });

            res.status(201).json(association);
        } catch (err) {
            await LogService.createLog({
                action: "CREATE_PATIENT_ASSOCIATION",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: data,
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao criar associação", error: err.message });
        }
    },

    getById: async (req, res) => {
        const { id } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const association = await PatientProfessionalAssociationService.getById(id);

            if (!association) {
                return res.status(404).json({ message: "Associação não encontrada" });
            }

            await LogService.createLog({
                action: "GET_PATIENT_ASSOCIATION",
                logType: "READ",
                description: `Associação ${id} recuperada`,
                ip,
                oldValue: null,
                newValue: null,
                status: "SUCCESS",
                userId: userId
            });

            res.json(association);
        } catch (err) {
            await LogService.createLog({
                action: "GET_PATIENT_ASSOCIATION",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: null,
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao buscar associação", error: err.message });
        }
    },

    getByPatientId: async (req, res) => {
        const { patientId } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const association = await PatientProfessionalAssociationService.getByPatientId(patientId);

            await LogService.createLog({
                action: "GET_PATIENT_ASSOCIATION_BY_PATIENT",
                logType: "READ",
                description: `Associação do paciente ${patientId} recuperada`,
                ip,
                oldValue: null,
                newValue: null,
                status: "SUCCESS",
                userId: userId
            });

            res.json(association || {});
        } catch (err) {
            await LogService.createLog({
                action: "GET_PATIENT_ASSOCIATION_BY_PATIENT",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: null,
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao buscar associação do paciente", error: err.message });
        }
    },

    getPatientsByNutricionistId: async (req, res) => {
        const { nutricionistId } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const patients = await PatientProfessionalAssociationService.getPatientsByNutricionistId(nutricionistId);

            await LogService.createLog({
                action: "GET_PATIENTS_BY_NUTRICIONIST",
                logType: "READ",
                description: `${patients.length} pacientes do nutricionista ${nutricionistId} recuperados`,
                ip,
                oldValue: null,
                newValue: null,
                status: "SUCCESS",
                userId: userId
            });

            res.json(patients);
        } catch (err) {
            await LogService.createLog({
                action: "GET_PATIENTS_BY_NUTRICIONIST",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: null,
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao buscar pacientes do nutricionista", error: err.message });
        }
    },

    getPatientsByPhysicalEducatorId: async (req, res) => {
        const { physicalEducatorId } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const patients = await PatientProfessionalAssociationService.getPatientsByPhysicalEducatorId(physicalEducatorId);

            await LogService.createLog({
                action: "GET_PATIENTS_BY_PHYSICAL_EDUCATOR",
                logType: "READ",
                description: `${patients.length} pacientes do educador físico ${physicalEducatorId} recuperados`,
                ip,
                oldValue: null,
                newValue: null,
                status: "SUCCESS",
                userId: userId
            });

            res.json(patients);
        } catch (err) {
            await LogService.createLog({
                action: "GET_PATIENTS_BY_PHYSICAL_EDUCATOR",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: null,
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao buscar pacientes do educador físico", error: err.message });
        }
    },

    update: async (req, res) => {
        const { id } = req.params;
        const data = req.body;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const oldAssociation = await PatientProfessionalAssociationService.getById(id);
            const updatedAssociation = await PatientProfessionalAssociationService.update(id, data);

            await LogService.createLog({
                action: "UPDATE_PATIENT_ASSOCIATION",
                logType: "UPDATE",
                description: `Associação ${id} atualizada`,
                ip,
                oldValue: oldAssociation,
                newValue: updatedAssociation,
                status: "SUCCESS",
                userId: userId
            });

            res.json(updatedAssociation);
        } catch (err) {
            await LogService.createLog({
                action: "UPDATE_PATIENT_ASSOCIATION",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: data,
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao atualizar associação", error: err.message });
        }
    },

    delete: async (req, res) => {
        const { id } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const association = await PatientProfessionalAssociationService.getById(id);
            await PatientProfessionalAssociationService.delete(id);

            await LogService.createLog({
                action: "DELETE_PATIENT_ASSOCIATION",
                logType: "DELETE",
                description: `Associação ${id} deletada`,
                ip,
                oldValue: association,
                newValue: null,
                status: "SUCCESS",
                userId: userId
            });

            res.json({ message: "Associação deletada com sucesso" });
        } catch (err) {
            await LogService.createLog({
                action: "DELETE_PATIENT_ASSOCIATION",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: null,
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao deletar associação", error: err.message });
        }
    },

    deactivate: async (req, res) => {
        const { id } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const association = await PatientProfessionalAssociationService.deactivate(id);

            await LogService.createLog({
                action: "DEACTIVATE_PATIENT_ASSOCIATION",
                logType: "UPDATE",
                description: `Associação ${id} desativada`,
                ip,
                oldValue: null,
                newValue: association,
                status: "SUCCESS",
                userId: userId
            });

            res.json(association);
        } catch (err) {
            await LogService.createLog({
                action: "DEACTIVATE_PATIENT_ASSOCIATION",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: null,
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao desativar associação", error: err.message });
        }
    }
};

export default PatientProfessionalAssociationController;
