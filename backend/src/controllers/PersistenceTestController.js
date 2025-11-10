import PersistenceTestService from '../services/PersistenceTestService.js';

class PersistenceTestController {
    /**
     * Executar teste completo de persistência
     * GET /persistence-test/run
     */
    async runFullTest(req, res) {
        try {
            const results = await PersistenceTestService.runFullPersistenceTest();

            const statusCode = results.overallSuccess ? 200 : 500;

            return res.status(statusCode).json({
                success: results.overallSuccess,
                message: results.overallSuccess 
                    ? 'Todos os testes de persistência passaram'
                    : 'Alguns testes de persistência falharam',
                results: results
            });

        } catch (error) {
            console.error('Erro ao executar testes:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao executar testes de persistência',
                error: error.message
            });
        }
    }

    /**
     * Testar persistência de um meal_record específico
     * POST /persistence-test/meal-record/:id
     */
    async testMealRecord(req, res) {
        try {
            const { id } = req.params;

            const result = await PersistenceTestService.testMealRecordPersistence(id);

            return res.status(result.success ? 200 : 500).json({
                success: result.success,
                message: result.message,
                test: result
            });

        } catch (error) {
            console.error('Erro ao testar meal_record:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao testar persistência do meal_record',
                error: error.message
            });
        }
    }

    /**
     * Testar persistência de um daily_meal_registry específico
     * POST /persistence-test/daily-meal/:id
     */
    async testDailyMeal(req, res) {
        try {
            const { id } = req.params;

            const result = await PersistenceTestService.testDailyMealPersistence(id);

            return res.status(result.success ? 200 : 500).json({
                success: result.success,
                message: result.message,
                test: result
            });

        } catch (error) {
            console.error('Erro ao testar daily_meal:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao testar persistência do daily_meal_registry',
                error: error.message
            });
        }
    }

    /**
     * Testar integridade transacional (ACID)
     * GET /persistence-test/transaction
     */
    async testTransaction(req, res) {
        try {
            const result = await PersistenceTestService.testTransactionIntegrity();

            return res.status(result.success ? 200 : 500).json({
                success: result.success,
                message: result.message,
                test: result
            });

        } catch (error) {
            console.error('Erro ao testar transação:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao testar integridade transacional',
                error: error.message
            });
        }
    }

    /**
     * Validar logs de auditoria
     * GET /persistence-test/audit-logs/:tableName/:recordId/:action
     */
    async validateLogs(req, res) {
        try {
            const { tableName, recordId, action } = req.params;

            const result = await PersistenceTestService.validateAuditLogs(
                tableName,
                recordId,
                action
            );

            return res.status(200).json({
                success: result.success,
                message: result.message,
                logsFound: result.logsFound,
                logs: result.logs
            });

        } catch (error) {
            console.error('Erro ao validar logs:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao validar logs de auditoria',
                error: error.message
            });
        }
    }
}

export default new PersistenceTestController();
