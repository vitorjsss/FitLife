import { Router } from 'express';
import BackupController from '../controllers/BackupController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

/**
 * Todas as rotas de backup requerem autenticação de administrador
 * Em produção, adicionar middleware de verificação de role admin
 */

/**
 * @route POST /backup/full
 * @desc Cria backup completo do banco de dados
 * @access Admin only
 */
router.post('/full', authenticateToken, BackupController.createFullBackup);

/**
 * @route POST /backup/incremental
 * @desc Cria backup incremental (últimas 24h)
 * @access Admin only
 */
router.post('/incremental', authenticateToken, BackupController.createIncrementalBackup);

/**
 * @route GET /backup/list
 * @desc Lista todos os backups disponíveis
 * @access Admin only
 */
router.get('/list', authenticateToken, BackupController.listBackups);

/**
 * @route POST /backup/restore
 * @desc Restaura um backup específico
 * @body { backupFileName: string }
 * @access Admin only
 */
router.post('/restore', authenticateToken, BackupController.restoreBackup);

/**
 * @route POST /backup/test
 * @desc Executa teste completo de backup e restauração
 * @access Admin only
 */
router.post('/test', authenticateToken, BackupController.testBackupRestore);

/**
 * @route GET /backup/stats
 * @desc Retorna estatísticas dos backups
 * @access Admin only
 */
router.get('/stats', authenticateToken, BackupController.getStatistics);

/**
 * @route GET /backup/validate
 * @desc Valida integridade dos dados atuais
 * @access Admin only
 */
router.get('/validate', authenticateToken, BackupController.validateData);

export default router;
