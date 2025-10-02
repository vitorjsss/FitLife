import { FoodService } from "../services/FoodService.js";
import { LogService } from "../services/LogService.js";

export const FoodController = {
    create: async (req, res) => {
        const foodData = req.body;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const food = await FoodService.create(foodData);

            await LogService.createLog({
                action: "CREATE_FOOD",
                logType: "CREATE",
                description: `Alimento ${food.name} criado com sucesso`,
                ip,
                oldValue: null,
                newValue: food,
                status: "SUCCESS",
                userId: userId
            });

            res.status(201).json(food);
        } catch (err) {
            await LogService.createLog({
                action: "CREATE_FOOD",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: foodData,
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao criar alimento", error: err });
        }
    },

    getAll: async (req, res) => {
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const foods = await FoodService.getAll();

            await LogService.createLog({
                action: "GET_ALL_FOODS",
                logType: "read",
                description: `Lista de ${foods.length} alimentos recuperada`,
                ip,
                oldValue: null,
                newValue: null,
                status: "SUCCESS",
                userId: userId
            });

            res.json(foods);
        } catch (err) {
            await LogService.createLog({
                action: "GET_ALL_FOODS",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: null,
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao buscar alimentos", error: err });
        }
    },

    getById: async (req, res) => {
        const { id } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const food = await FoodService.getById(id);

            if (!food) {
                await LogService.createLog({
                    action: "GET_FOOD_BY_ID",
                    logType: "read",
                    description: `Alimento com ID ${id} não encontrado`,
                    ip,
                    oldValue: null,
                    newValue: null,
                    status: "NOT_FOUND",
                    userId: userId
                });
                return res.status(404).json({ message: "Alimento não encontrado" });
            }

            await LogService.createLog({
                action: "GET_FOOD_BY_ID",
                logType: "read",
                description: `Alimento ${food.name} recuperado com sucesso`,
                ip,
                oldValue: null,
                newValue: { id: food.id, name: food.name },
                status: "SUCCESS",
                userId: userId
            });

            res.json(food);
        } catch (err) {
            await LogService.createLog({
                action: "GET_FOOD_BY_ID",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { requestedId: id },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao buscar alimento", error: err });
        }
    },

    searchByName: async (req, res) => {
        const { name } = req.query;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const foods = await FoodService.searchByName(name);

            await LogService.createLog({
                action: "SEARCH_FOODS_BY_NAME",
                logType: "read",
                description: `Busca por alimentos com nome "${name}" retornou ${foods.length} resultados`,
                ip,
                oldValue: null,
                newValue: { searchTerm: name, resultCount: foods.length },
                status: "SUCCESS",
                userId: userId
            });

            res.json(foods);
        } catch (err) {
            await LogService.createLog({
                action: "SEARCH_FOODS_BY_NAME",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { searchTerm: name },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao buscar alimentos", error: err });
        }
    },

    update: async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const oldFood = await FoodService.getById(id);

            if (!oldFood) {
                await LogService.createLog({
                    action: "UPDATE_FOOD",
                    logType: "UPDATE",
                    description: `Tentativa de atualizar alimento inexistente com ID ${id}`,
                    ip,
                    oldValue: null,
                    newValue: updateData,
                    status: "NOT_FOUND",
                    userId: userId
                });
                return res.status(404).json({ message: "Alimento não encontrado" });
            }

            const updated = await FoodService.update(id, updateData);

            await LogService.createLog({
                action: "UPDATE_FOOD",
                logType: "UPDATE",
                description: `Alimento ${updated.name} atualizado com sucesso`,
                ip,
                oldValue: oldFood,
                newValue: updated,
                status: "SUCCESS",
                userId: userId
            });

            res.json(updated);
        } catch (err) {
            await LogService.createLog({
                action: "UPDATE_FOOD",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { id, updateData },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao atualizar alimento", error: err });
        }
    },

    deleteFood: async (req, res) => {
        const { id } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const food = await FoodService.getById(id);

            if (!food) {
                await LogService.createLog({
                    action: "DELETE_FOOD",
                    logType: "DELETE",
                    description: `Tentativa de deletar alimento inexistente com ID ${id}`,
                    ip,
                    oldValue: null,
                    newValue: null,
                    status: "NOT_FOUND",
                    userId: userId
                });
                return res.status(404).json({ message: "Alimento não encontrado" });
            }

            await FoodService.delete(id);

            await LogService.createLog({
                action: "DELETE_FOOD",
                logType: "DELETE",
                description: `Alimento ${food.name} deletado com sucesso`,
                ip,
                oldValue: food,
                newValue: null,
                status: "SUCCESS",
                userId: userId
            });

            res.status(204).send();
        } catch (err) {
            await LogService.createLog({
                action: "DELETE_FOOD",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { requestedId: id },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao deletar alimento", error: err });
        }
    }
};