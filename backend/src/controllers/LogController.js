import { LogService } from "../services/LogService.js";

export const LogController = {
    // Criar um novo log
    create: async (req, res) => {
        try {
            const { action, logType, description, ip, oldValue, newValue, status, userId } = req.body;

            const log = await LogService.createLog({
                action,
                logType,
                description,
                ip,
                oldValue,
                newValue,
                status,
                userId
            });

            res.status(201).json(log);
        } catch (error) {
            console.error("Erro ao criar log:", error);
            res.status(500).json({ error: "Erro interno do servidor" });
        }
    },

    // Buscar todos os logs
    getAll: async (req, res) => {
        try {
            const { limit } = req.query;
            const logs = await LogService.getLogs(limit ? parseInt(limit) : 100);
            res.status(200).json(logs);
        } catch (error) {
            console.error("Erro ao buscar logs:", error);
            res.status(500).json({ error: "Erro interno do servidor" });
        }
    },

    // Buscar logs por usuário
    getByUser: async (req, res) => {
        try {
            const { userId } = req.params;
            const logs = await LogService.getLogsByUser(userId);
            res.status(200).json(logs);
        } catch (error) {
            console.error("Erro ao buscar logs do usuário:", error);
            res.status(500).json({ error: "Erro interno do servidor" });
        }
    },

    // Buscar logs por ação
    getByAction: async (req, res) => {
        try {
            const { action } = req.params;
            const logs = await LogService.getLogsByAction(action);
            res.status(200).json(logs);
        } catch (error) {
            console.error("Erro ao buscar logs por ação:", error);
            res.status(500).json({ error: "Erro interno do servidor" });
        }
    },

    // Buscar logs por período
    getByDateRange: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            const logs = await LogService.getLogsByDateRange(startDate, endDate);
            res.status(200).json(logs);
        } catch (error) {
            console.error("Erro ao buscar logs por período:", error);
            res.status(500).json({ error: "Erro interno do servidor" });
        }
    },

    // Deletar log
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            await LogService.deleteLog(id);
            res.status(200).json({ message: "Log deletado com sucesso" });
        } catch (error) {
            console.error("Erro ao deletar log:", error);
            res.status(500).json({ error: "Erro interno do servidor" });
        }
    }
};