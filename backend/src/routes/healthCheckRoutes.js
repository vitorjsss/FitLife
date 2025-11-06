import { Router } from 'express';
import HealthCheckController from '../controllers/HealthCheckController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

/**
 * @route GET /health/ping
 * @desc Endpoint simples de ping/pong (público)
 */
router.get('/ping', HealthCheckController.ping);

/**
 * @route GET /health/status
 * @desc Verifica status geral do sistema (público)
 * @returns Status da API, banco de dados e métricas básicas
 */
router.get('/status', HealthCheckController.getHealthStatus);

/**
 * @route GET /health/availability
 * @desc Retorna relatório detalhado de disponibilidade (autenticado)
 * @returns Métricas completas de availability, uptime, downtime, requests
 */
router.get('/availability', authenticateToken, HealthCheckController.getAvailabilityReport);

/**
 * @route POST /health/reset
 * @desc Reset manual das estatísticas mensais (somente admin)
 * @auth Requer token de administrador
 */
router.post('/reset', authenticateToken, HealthCheckController.resetStats);

export default router;
