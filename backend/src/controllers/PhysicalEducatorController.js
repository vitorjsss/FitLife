import { PhysicalEducatorService } from "../services/PhysicalEducatorService.js";

export const PhysicalEducatorController = {
    create: async (req, res) => {
        try {
            const educator = await PhysicalEducatorService.create(req.body);
            res.status(201).json(educator);
        } catch (err) {
            res.status(500).json({ message: "Erro ao criar educador físico", error: err });
        }
    },

    getAll: async (req, res) => {
        try {
            const educators = await PhysicalEducatorService.getAll();
            res.json(educators);
        } catch (err) {
            res.status(500).json({ message: "Erro ao buscar educadores físicos", error: err });
        }
    },

    getById: async (req, res) => {
        try {
            const educator = await PhysicalEducatorService.getById(req.params.id);
            if (!educator) return res.status(404).json({ message: "Educador físico não encontrado" });
            res.json(educator);
        } catch (err) {
            res.status(500).json({ message: "Erro ao buscar educador físico", error: err });
        }
    },

    update: async (req, res) => {
        try {
            const updated = await PhysicalEducatorService.update(req.params.id, req.body);
            if (!updated) return res.status(404).json({ message: "Educador físico não encontrado" });
            res.json(updated);
        } catch (err) {
            res.status(500).json({ message: "Erro ao atualizar educador físico", error: err });
        }
    },

    delete: async (req, res) => {
        try {
            await PhysicalEducatorService.delete(req.params.id);
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ message: "Erro ao deletar educador físico", error: err });
        }
    }
};