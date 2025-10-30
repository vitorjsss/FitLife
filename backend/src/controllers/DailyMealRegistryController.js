import { DailyMealRegistryService } from "../services/DailyMealRegistryService.js";
import { LogService } from "../services/LogService.js";

export const DailyMealRegistryController = {
    getByDate: async (req, res) => {
        const { date, patientId } = req.query;
        console.log('getByDate params:', { date, patientId });
        const ip = req.ip;
        const userId = req.user?.id;
        if (!date || !patientId) {
            return res.status(400).json({ message: "Parâmetros 'date' e 'patientId' são obrigatórios." });
        }
        try {
            const registries = await DailyMealRegistryService.getByDate(date, patientId);
            await LogService.createLog({
                action: "GET_DAILY_MEAL_REGISTRY_BY_DATE",
                logType: "read",
                description: `Registros diários para data ${date} e paciente ${patientId} recuperados`,
                ip,
                oldValue: null,
                newValue: { date, patientId, count: registries.length },
                status: "SUCCESS",
                userId: userId
            });
            res.json(registries);
        } catch (err) {
            await LogService.createLog({
                action: "GET_DAILY_MEAL_REGISTRY_BY_DATE",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { date, patientId },
                status: "FAILURE",
                userId: userId
            });
            res.status(500).json({ message: "Erro ao buscar registro diário por data", error: err });
        }
    },
    create: async (req, res) => {
        const registryData = req.body;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const registry = await DailyMealRegistryService.create(registryData);

            await LogService.createLog({
                action: "CREATE_DAILY_MEAL_REGISTRY",
                logType: "CREATE",
                description: `Registro diário de refeições criado para data ${registry.date}`,
                ip,
                oldValue: null,
                newValue: registry,
                status: "SUCCESS",
                userId: userId
            });

            res.status(201).json(registry);
        } catch (err) {
            await LogService.createLog({
                action: "CREATE_DAILY_MEAL_REGISTRY",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: registryData,
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao criar registro diário", error: err });
        }
    },

    getAll: async (req, res) => {
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const registries = await DailyMealRegistryService.getAll();

            await LogService.createLog({
                action: "GET_ALL_DAILY_MEAL_REGISTRIES",
                logType: "read",
                description: `Lista de ${registries.length} registros diários recuperada`,
                ip,
                oldValue: null,
                newValue: null,
                status: "SUCCESS",
                userId: userId
            });

            res.json(registries);
        } catch (err) {
            await LogService.createLog({
                action: "GET_ALL_DAILY_MEAL_REGISTRIES",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: null,
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao buscar registros diários", error: err });
        }
    },

    getById: async (req, res) => {
        const { id } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        // Validação de UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            await LogService.createLog({
                action: "GET_DAILY_MEAL_REGISTRY_BY_ID",
                logType: "ERROR",
                description: `ID inválido recebido: ${id}`,
                ip,
                oldValue: null,
                newValue: null,
                status: "INVALID_ID",
                userId: userId
            });
            return res.status(400).json({ error: "Formato de UUID inválido para id" });
        }

        try {
            const registry = await DailyMealRegistryService.getById(id);

            if (!registry) {
                await LogService.createLog({
                    action: "GET_DAILY_MEAL_REGISTRY_BY_ID",
                    logType: "read",
                    description: `Registro diário com ID ${id} não encontrado`,
                    ip,
                    oldValue: null,
                    newValue: null,
                    status: "NOT_FOUND",
                    userId: userId
                });
                return res.status(404).json({ message: "Registro diário não encontrado" });
            }

            await LogService.createLog({
                action: "GET_DAILY_MEAL_REGISTRY_BY_ID",
                logType: "read",
                description: `Registro diário para data ${registry.date} recuperado com sucesso`,
                ip,
                oldValue: null,
                newValue: { id: registry.id, date: registry.date },
                status: "SUCCESS",
                userId: userId
            });

            res.json(registry);
        } catch (err) {
            await LogService.createLog({
                action: "GET_DAILY_MEAL_REGISTRY_BY_ID",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { requestedId: id },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao buscar registro diário", error: err });
        }
    },

    getByPatientId: async (req, res) => {
        const { patientId } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const registries = await DailyMealRegistryService.getByPatientId(patientId);

            await LogService.createLog({
                action: "GET_DAILY_MEAL_REGISTRIES_BY_PATIENT",
                logType: "read",
                description: `${registries.length} registros diários do paciente ${patientId} recuperados`,
                ip,
                oldValue: null,
                newValue: { patientId, count: registries.length },
                status: "SUCCESS",
                userId: userId
            });

            res.json(registries);
        } catch (err) {
            await LogService.createLog({
                action: "GET_DAILY_MEAL_REGISTRIES_BY_PATIENT",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { patientId },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao buscar registros do paciente", error: err });
        }
    },

    update: async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const oldRegistry = await DailyMealRegistryService.getById(id);

            if (!oldRegistry) {
                await LogService.createLog({
                    action: "UPDATE_DAILY_MEAL_REGISTRY",
                    logType: "UPDATE",
                    description: `Tentativa de atualizar registro diário inexistente com ID ${id}`,
                    ip,
                    oldValue: null,
                    newValue: updateData,
                    status: "NOT_FOUND",
                    userId: userId
                });
                return res.status(404).json({ message: "Registro diário não encontrado" });
            }

            const updated = await DailyMealRegistryService.update(id, updateData);

            await LogService.createLog({
                action: "UPDATE_DAILY_MEAL_REGISTRY",
                logType: "UPDATE",
                description: `Registro diário para data ${updated.date} atualizado com sucesso`,
                ip,
                oldValue: oldRegistry,
                newValue: updated,
                status: "SUCCESS",
                userId: userId
            });

            res.json(updated);
        } catch (err) {
            await LogService.createLog({
                action: "UPDATE_DAILY_MEAL_REGISTRY",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { id, updateData },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao atualizar registro diário", error: err });
        }
    },

    deleteDailyMealRegistry: async (req, res) => {
        const { id } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const registry = await DailyMealRegistryService.getById(id);

            if (!registry) {
                await LogService.createLog({
                    action: "DELETE_DAILY_MEAL_REGISTRY",
                    logType: "DELETE",
                    description: `Tentativa de deletar registro diário inexistente com ID ${id}`,
                    ip,
                    oldValue: null,
                    newValue: null,
                    status: "NOT_FOUND",
                    userId: userId
                });
                return res.status(404).json({ message: "Registro diário não encontrado" });
            }

            await DailyMealRegistryService.delete(id);

            await LogService.createLog({
                action: "DELETE_DAILY_MEAL_REGISTRY",
                logType: "DELETE",
                description: `Registro diário para data ${registry.date} deletado com sucesso`,
                ip,
                oldValue: registry,
                newValue: null,
                status: "SUCCESS",
                userId: userId
            });

            res.status(204).send();
        } catch (err) {
            await LogService.createLog({
                action: "DELETE_DAILY_MEAL_REGISTRY",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { requestedId: id },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao deletar registro diário", error: err });
        }
    }
};
