import { MealRecordService } from "../services/MealRecordService.js";
import { LogService } from "../services/LogService.js";

export const MealRecordController = {
    create: async (req, res) => {
        const mealData = req.body;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const meal = await MealRecordService.create(mealData);

            await LogService.createLog({
                action: "CREATE_MEAL_RECORD",
                logType: "CREATE",
                description: `Refeição ${meal.name} criada com sucesso`,
                ip,
                oldValue: null,
                newValue: meal,
                status: "SUCCESS",
                userId: userId
            });

            res.status(201).json(meal);
        } catch (err) {
            await LogService.createLog({
                action: "CREATE_MEAL_RECORD",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: mealData,
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao criar refeição", error: err });
        }
    },

    getAll: async (req, res) => {
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const meals = await MealRecordService.getAll();

            await LogService.createLog({
                action: "GET_ALL_MEAL_RECORDS",
                logType: "read",
                description: `Lista de ${meals.length} refeições recuperada`,
                ip,
                oldValue: null,
                newValue: null,
                status: "SUCCESS",
                userId: userId
            });

            res.json(meals);
        } catch (err) {
            await LogService.createLog({
                action: "GET_ALL_MEAL_RECORDS",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: null,
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao buscar refeições", error: err });
        }
    },

    getById: async (req, res) => {
        const { id } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const meal = await MealRecordService.getById(id);

            if (!meal) {
                await LogService.createLog({
                    action: "GET_MEAL_RECORD_BY_ID",
                    logType: "read",
                    description: `Refeição com ID ${id} não encontrada`,
                    ip,
                    oldValue: null,
                    newValue: null,
                    status: "NOT_FOUND",
                    userId: userId
                });
                return res.status(404).json({ message: "Refeição não encontrada" });
            }

            await LogService.createLog({
                action: "GET_MEAL_RECORD_BY_ID",
                logType: "read",
                description: `Refeição ${meal.name} recuperada com sucesso`,
                ip,
                oldValue: null,
                newValue: { id: meal.id, name: meal.name },
                status: "SUCCESS",
                userId: userId
            });

            res.json(meal);
        } catch (err) {
            await LogService.createLog({
                action: "GET_MEAL_RECORD_BY_ID",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { requestedId: id },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao buscar refeição", error: err });
        }
    },

    getByDailyMealRegistryId: async (req, res) => {
        const { registryId } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const meals = await MealRecordService.getByDailyMealRegistryId(registryId);

            await LogService.createLog({
                action: "GET_MEAL_RECORDS_BY_REGISTRY",
                logType: "read",
                description: `${meals.length} refeições do registro ${registryId} recuperadas`,
                ip,
                oldValue: null,
                newValue: { registryId, count: meals.length },
                status: "SUCCESS",
                userId: userId
            });

            res.json(meals);
        } catch (err) {
            await LogService.createLog({
                action: "GET_MEAL_RECORDS_BY_REGISTRY",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { registryId },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao buscar refeições do registro", error: err });
        }
    },

    getWithItems: async (req, res) => {
        const { id } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const meal = await MealRecordService.getWithItems(id);

            if (!meal) {
                await LogService.createLog({
                    action: "GET_MEAL_RECORD_WITH_ITEMS",
                    logType: "read",
                    description: `Refeição com ID ${id} não encontrada`,
                    ip,
                    oldValue: null,
                    newValue: null,
                    status: "NOT_FOUND",
                    userId: userId
                });
                return res.status(404).json({ message: "Refeição não encontrada" });
            }

            await LogService.createLog({
                action: "GET_MEAL_RECORD_WITH_ITEMS",
                logType: "read",
                description: `Refeição ${meal.name} com itens recuperada com sucesso`,
                ip,
                oldValue: null,
                newValue: { id: meal.id, name: meal.name, itemsCount: meal.meal_items?.length || 0 },
                status: "SUCCESS",
                userId: userId
            });

            res.json(meal);
        } catch (err) {
            await LogService.createLog({
                action: "GET_MEAL_RECORD_WITH_ITEMS",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { requestedId: id },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao buscar refeição com itens", error: err });
        }
    },

    update: async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;
        const ip = req.ip;
        const userId = req.user?.id;
        console.log('MealRecordController.update - updateData:', updateData);

        try {
            const oldMeal = await MealRecordService.getById(id);

            if (!oldMeal) {
                await LogService.createLog({
                    action: "UPDATE_MEAL_RECORD",
                    logType: "UPDATE",
                    description: `Tentativa de atualizar refeição inexistente com ID ${id}`,
                    ip,
                    oldValue: null,
                    newValue: updateData,
                    status: "NOT_FOUND",
                    userId: userId
                });
                return res.status(404).json({ message: "Refeição não encontrada" });
            }

            const updated = await MealRecordService.update(id, updateData);

            await LogService.createLog({
                action: "UPDATE_MEAL_RECORD",
                logType: "UPDATE",
                description: `Refeição ${updated.name} atualizada com sucesso`,
                ip,
                oldValue: oldMeal,
                newValue: updated,
                status: "SUCCESS",
                userId: userId
            });

            res.json(updated);
        } catch (err) {
            await LogService.createLog({
                action: "UPDATE_MEAL_RECORD",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { id, updateData },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao atualizar refeição", error: err });
        }
    },

    deleteMealRecord: async (req, res) => {
        const { id } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const meal = await MealRecordService.getById(id);

            if (!meal) {
                await LogService.createLog({
                    action: "DELETE_MEAL_RECORD",
                    logType: "DELETE",
                    description: `Tentativa de deletar refeição inexistente com ID ${id}`,
                    ip,
                    oldValue: null,
                    newValue: null,
                    status: "NOT_FOUND",
                    userId: userId
                });
                return res.status(404).json({ message: "Refeição não encontrada" });
            }

            await MealRecordService.delete(id);

            await LogService.createLog({
                action: "DELETE_MEAL_RECORD",
                logType: "DELETE",
                description: `Refeição ${meal.name} deletada com sucesso`,
                ip,
                oldValue: meal,
                newValue: null,
                status: "SUCCESS",
                userId: userId
            });

            res.status(204).send();
        } catch (err) {
            await LogService.createLog({
                action: "DELETE_MEAL_RECORD",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { requestedId: id },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao deletar refeição", error: err });
        }
    }
};