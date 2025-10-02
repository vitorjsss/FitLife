import { PatientService } from "../services/PatientService.js";
import { LogService } from "../services/LogService.js";

export const PatientController = {
    create: async (req, res) => {
        const patientData = req.body;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const patient = await PatientService.create(patientData);

            await LogService.createLog({
                action: "CREATE_PATIENT",
                logType: "CREATE",
                description: `Paciente ${patient.name} criado com sucesso`,
                ip,
                oldValue: null,
                newValue: patient,
                status: "SUCCESS",
                userId: userId || patient.auth_id
            });

            res.status(201).json(patient);
        } catch (err) {
            await LogService.createLog({
                action: "CREATE_PATIENT",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: patientData,
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao criar paciente", error: err });
        }
    },

    getAll: async (req, res) => {
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const patients = await PatientService.getAll();

            await LogService.createLog({
                action: "GET_ALL_PATIENTS",
                logType: "READ",
                description: `Lista de ${patients.length} pacientes recuperada`,
                ip,
                oldValue: null,
                newValue: null,
                status: "SUCCESS",
                userId: userId
            });

            res.json(patients);
        } catch (err) {
            await LogService.createLog({
                action: "GET_ALL_PATIENTS",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: null,
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao buscar pacientes", error: err });
        }
    },

    getById: async (req, res) => {
        const { id } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const patient = await PatientService.getById(id);

            if (!patient) {
                await LogService.createLog({
                    action: "GET_PATIENT_BY_ID",
                    logType: "READ",
                    description: `Paciente com ID ${id} não encontrado`,
                    ip,
                    oldValue: null,
                    newValue: null,
                    status: "NOT_FOUND",
                    userId: userId
                });
                return res.status(404).json({ message: "Paciente não encontrado" });
            }

            await LogService.createLog({
                action: "GET_PATIENT_BY_ID",
                logType: "READ",
                description: `Paciente ${patient.name} recuperado com sucesso`,
                ip,
                oldValue: null,
                newValue: { id: patient.id, name: patient.name },
                status: "SUCCESS",
                userId: userId
            });

            res.json(patient);
        } catch (err) {
            await LogService.createLog({
                action: "GET_PATIENT_BY_ID",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { requestedId: id },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao buscar paciente", error: err });
        }
    },

    update: async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const oldPatient = await PatientService.getById(id);

            if (!oldPatient) {
                await LogService.createLog({
                    action: "UPDATE_PATIENT",
                    logType: "UPDATE",
                    description: `Tentativa de atualizar paciente inexistente com ID ${id}`,
                    ip,
                    oldValue: null,
                    newValue: updateData,
                    status: "NOT_FOUND",
                    userId: userId
                });
                return res.status(404).json({ message: "Paciente não encontrado" });
            }

            const updated = await PatientService.update(id, updateData);

        } catch (err) {
            await LogService.createLog({
                action: "UPDATE_PATIENT",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { id, updateData },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao atualizar paciente", error: err });
        }
    },

    deletePatient: async (req, res) => {
        const { id } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const patient = await PatientService.getById(id);

            if (!patient) {
                await LogService.createLog({
                    action: "DELETE_PATIENT",
                    logType: "DELETE",
                    description: `Tentativa de deletar paciente inexistente com ID ${id}`,
                    ip,
                    oldValue: null,
                    newValue: null,
                    status: "NOT_FOUND",
                    userId: userId
                });
                return res.status(404).json({ message: "Paciente não encontrado" });
            }

            await PatientService.delete(id);

            await LogService.createLog({
                action: "DELETE_PATIENT",
                logType: "DELETE",
                description: `Paciente ${patient.name} deletado com sucesso`,
                ip,
                oldValue: patient,
                newValue: null,
                status: "SUCCESS",
                userId: userId
            });

            res.status(204).send();
        } catch (err) {
            await LogService.createLog({
                action: "DELETE_PATIENT",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { requestedId: id },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao deletar paciente", error: err });
        }
    }
};