import LogRepository from "../repositories/LogRepository.js";

export const LogService = {
    // Criar um novo log
    createLog: async (logData) => {
        try {
            const { action, logType, description, ip, oldValue, newValue, status, userId } = logData;

            return await LogRepository.create({
                action,
                logType,
                description,
                ip,
                oldValue: typeof oldValue === 'object' ? JSON.stringify(oldValue) : oldValue,
                newValue: typeof newValue === 'object' ? JSON.stringify(newValue) : newValue,
                status,
                userId
            });
        } catch (error) {
            console.error("Erro no LogService.createLog:", error);
            throw error;
        }
    },

    // Buscar todos os logs com limite
    getLogs: async (limit = 100) => {
        try {
            return await LogRepository.findAll(limit);
        } catch (error) {
            console.error("Erro no LogService.getLogs:", error);
            throw error;
        }
    },

    // Buscar logs por usuário
    getLogsByUser: async (userId) => {
        try {
            return await LogRepository.findByUserId(userId);
        } catch (error) {
            console.error("Erro no LogService.getLogsByUser:", error);
            throw error;
        }
    },

    // Buscar logs por ação
    getLogsByAction: async (action) => {
        try {
            return await LogRepository.findByAction(action);
        } catch (error) {
            console.error("Erro no LogService.getLogsByAction:", error);
            throw error;
        }
    },

    // Buscar logs por período
    getLogsByDateRange: async (startDate, endDate) => {
        try {
            return await LogRepository.findByDateRange(startDate, endDate);
        } catch (error) {
            console.error("Erro no LogService.getLogsByDateRange:", error);
            throw error;
        }
    },

    // Deletar um log
    deleteLog: async (id) => {
        try {
            return await LogRepository.delete(id);
        } catch (error) {
            console.error("Erro no LogService.deleteLog:", error);
            throw error;
        }
    }
};