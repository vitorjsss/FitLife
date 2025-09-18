import { PatientService } from "../services/PatientService.js";

export const PatientController = {
    create: async (req, res) => {
        try {
            const patient = await PatientService.create(req.body);
            res.status(201).json(patient);
        } catch (err) {
            res.status(500).json({ message: "Erro ao criar paciente", error: err });
        }
    },

    getAll: async (req, res) => {
        try {
            const patients = await PatientService.getAll();
            res.json(patients);
        } catch (err) {
            res.status(500).json({ message: "Erro ao buscar pacientes", error: err });
        }
    },

    getById: async (req, res) => {
        try {
            const patient = await PatientService.getById(req.params.id);
            if (!patient) return res.status(404).json({ message: "Paciente não encontrado" });
            res.json(patient);
        } catch (err) {
            res.status(500).json({ message: "Erro ao buscar paciente", error: err });
        }
    },

    update: async (req, res) => {
        try {
            const updated = await PatientService.update(req.params.id, req.body);
            if (!updated) return res.status(404).json({ message: "Paciente não encontrado" });
            res.json(updated);
        } catch (err) {
            res.status(500).json({ message: "Erro ao atualizar paciente", error: err });
        }
    },

    delete: async (req, res) => {
        try {
            await PatientService.delete(req.params.id);
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ message: "Erro ao deletar paciente", error: err });
        }
    }
};