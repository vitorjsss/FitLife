import { Router } from 'express';
import PersistenceTestController from '../controllers/PersistenceTestController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

/**
 * Rotas de Teste de Persistência
 * Risco 2: Atualização das refeições - validação de commit e logs
 * Requer autenticação (admin only em produção)
 */

/**
 * @route GET /persistence-test/run
 * @desc Executa bateria completa de testes de persistência
 * @access Admin
 */
router.get('/run', authenticateToken, PersistenceTestController.runFullTest);

/**
 * @route POST /persistence-test/meal-record/:id
 * @desc Testa persistência de um meal_record específico
 * @access Admin
 */
router.post('/meal-record/:id', authenticateToken, PersistenceTestController.testMealRecord);

/**
 * @route POST /persistence-test/daily-meal/:id
 * @desc Testa persistência de um daily_meal_registry específico
 * @access Admin
 */
router.post('/daily-meal/:id', authenticateToken, PersistenceTestController.testDailyMeal);

/**
 * @route GET /persistence-test/transaction
 * @desc Testa integridade transacional (ACID)
 * @access Admin
 */
router.get('/transaction', authenticateToken, PersistenceTestController.testTransaction);

/**
 * @route GET /persistence-test/audit-logs/:tableName/:recordId/:action
 * @desc Valida logs de auditoria para um registro específico
 * @access Admin
 */
router.get('/audit-logs/:tableName/:recordId/:action', authenticateToken, PersistenceTestController.validateLogs);

export default router;
