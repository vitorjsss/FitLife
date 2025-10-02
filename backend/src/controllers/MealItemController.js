import { MealItemService } from "../services/MealItemService.js";
import { LogService } from "../services/LogService.js";

export const MealItemController = {
    create: async (req, res) => {
        const itemData = req.body;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const item = await MealItemService.create(itemData);

            await LogService.createLog({
                action: "CREATE_MEAL_ITEM",
                logType: "CREATE",
                description: `Item ${item.food_name} adicionado à refeição`,
                ip,
                oldValue: null,
                newValue: item,
                status: "SUCCESS",
                userId: userId
            });

            res.status(201).json(item);
        } catch (err) {
            await LogService.createLog({
                action: "CREATE_MEAL_ITEM",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: itemData,
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao criar item da refeição", error: err });
        }
    },

    getAll: async (req, res) => {
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const items = await MealItemService.getAll();

            await LogService.createLog({
                action: "GET_ALL_MEAL_ITEMS",
                logType: "read",
                description: `Lista de ${items.length} itens de refeição recuperada`,
                ip,
                oldValue: null,
                newValue: null,
                status: "SUCCESS",
                userId: userId
            });

            res.json(items);
        } catch (err) {
            await LogService.createLog({
                action: "GET_ALL_MEAL_ITEMS",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: null,
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao buscar itens de refeição", error: err });
        }
    },

    getById: async (req, res) => {
        const { id } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const item = await MealItemService.getById(id);

            if (!item) {
                await LogService.createLog({
                    action: "GET_MEAL_ITEM_BY_ID",
                    logType: "read",
                    description: `Item de refeição com ID ${id} não encontrado`,
                    ip,
                    oldValue: null,
                    newValue: null,
                    status: "NOT_FOUND",
                    userId: userId
                });
                return res.status(404).json({ message: "Item de refeição não encontrado" });
            }

            await LogService.createLog({
                action: "GET_MEAL_ITEM_BY_ID",
                logType: "read",
                description: `Item ${item.food_name} recuperado com sucesso`,
                ip,
                oldValue: null,
                newValue: { id: item.id, food_name: item.food_name },
                status: "SUCCESS",
                userId: userId
            });

            res.json(item);
        } catch (err) {
            await LogService.createLog({
                action: "GET_MEAL_ITEM_BY_ID",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { requestedId: id },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao buscar item de refeição", error: err });
        }
    },

    getByMealId: async (req, res) => {
        const { mealId } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const items = await MealItemService.getByMealId(mealId);

            await LogService.createLog({
                action: "GET_MEAL_ITEMS_BY_MEAL",
                logType: "read",
                description: `${items.length} itens da refeição ${mealId} recuperados`,
                ip,
                oldValue: null,
                newValue: { mealId, count: items.length },
                status: "SUCCESS",
                userId: userId
            });

            res.json(items);
        } catch (err) {
            await LogService.createLog({
                action: "GET_MEAL_ITEMS_BY_MEAL",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { mealId },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao buscar itens da refeição", error: err });
        }
    },

    update: async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const oldItem = await MealItemService.getById(id);

            if (!oldItem) {
                await LogService.createLog({
                    action: "UPDATE_MEAL_ITEM",
                    logType: "UPDATE",
                    description: `Tentativa de atualizar item inexistente com ID ${id}`,
                    ip,
                    oldValue: null,
                    newValue: updateData,
                    status: "NOT_FOUND",
                    userId: userId
                });
                return res.status(404).json({ message: "Item de refeição não encontrado" });
            }

            const updated = await MealItemService.update(id, updateData);

            await LogService.createLog({
                action: "UPDATE_MEAL_ITEM",
                logType: "UPDATE",
                description: `Item ${updated.food_name} atualizado com sucesso`,
                ip,
                oldValue: oldItem,
                newValue: updated,
                status: "SUCCESS",
                userId: userId
            });

            res.json(updated);
        } catch (err) {
            await LogService.createLog({
                action: "UPDATE_MEAL_ITEM",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { id, updateData },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao atualizar item de refeição", error: err });
        }
    },

    deleteMealItem: async (req, res) => {
        const { id } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const item = await MealItemService.getById(id);

            if (!item) {
                await LogService.createLog({
                    action: "DELETE_MEAL_ITEM",
                    logType: "DELETE",
                    description: `Tentativa de deletar item inexistente com ID ${id}`,
                    ip,
                    oldValue: null,
                    newValue: null,
                    status: "NOT_FOUND",
                    userId: userId
                });
                return res.status(404).json({ message: "Item de refeição não encontrado" });
            }

            await MealItemService.delete(id);

            await LogService.createLog({
                action: "DELETE_MEAL_ITEM",
                logType: "DELETE",
                description: `Item ${item.food_name} deletado com sucesso`,
                ip,
                oldValue: item,
                newValue: null,
                status: "SUCCESS",
                userId: userId
            });

            res.status(204).send();
        } catch (err) {
            await LogService.createLog({
                action: "DELETE_MEAL_ITEM",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { requestedId: id },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao deletar item de refeição", error: err });
        }
    }
};