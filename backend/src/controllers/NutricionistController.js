import { NutricionistService } from "../services/NutricionistService.js";

export const NutricionistController = {
    create: async (req, res) => {
        try {
            const nutricionist = await NutricionistService.create(req.body);
            res.status(201).json(nutricionist);
        } catch (err) {
            res.status(500).json({ message: "Erro ao criar nutricionista", error: err });
        }
    },

    getAll: async (req, res) => {
        try {
            const nutricionists = await NutricionistService.getAll();
            res.json(nutricionists);
        } catch (err) {
            res.status(500).json({ message: "Erro ao buscar nutricionistas", error: err });
        }
    },

    getById: async (req, res) => {
        try {
            const nutricionist = await NutricionistService.getById(req.params.id);
            if (!nutricionist) return res.status(404).json({ message: "Nutricionista não encontrado" });
            res.json(nutricionist);
        } catch (err) {
            res.status(500).json({ message: "Erro ao buscar nutricionista", error: err });
        }
    },

    update: async (req, res) => {
        try {
            const updated = await NutricionistService.update(req.params.id, req.body);
            if (!updated) return res.status(404).json({ message: "Nutricionista não encontrado" });
            res.json(updated);
        } catch (err) {
            res.status(500).json({ message: "Erro ao atualizar nutricionista", error: err });
        }
    },

    delete: async (req, res) => {
        try {
            await NutricionistService.delete(req.params.id);
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ message: "Erro ao deletar nutricionista", error: err });
        }
    }
};