import { getAvailabilityMetrics, resetMonthlyStats } from '../middlewares/availabilityMonitor.js';
import { pool } from '../config/db.js';

class HealthCheckController {
    /**
     * Verifica o status geral do sistema
     */
    async getHealthStatus(req, res) {
        try {
            const metrics = getAvailabilityMetrics();
            const dbStatus = await checkDatabaseConnection();
            
            const isHealthy = metrics.isHealthy && dbStatus.connected;
            const statusCode = isHealthy ? 200 : 503;

            return res.status(statusCode).json({
                success: isHealthy,
                status: isHealthy ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
                services: {
                    api: {
                        status: metrics.isHealthy ? 'up' : 'degraded',
                        availability: metrics.availability + '%',
                        uptime: metrics.uptimePercentage + '%'
                    },
                    database: {
                        status: dbStatus.connected ? 'up' : 'down',
                        responseTime: dbStatus.responseTime + 'ms'
                    }
                },
                metrics: {
                    availability: metrics.availability + '%',
                    uptimePercentage: metrics.uptimePercentage + '%',
                    totalRequests: metrics.totalRequests,
                    successfulRequests: metrics.successfulRequests,
                    failedRequests: metrics.failedRequests,
                    criticalErrors: metrics.criticalErrors,
                    uptimeMinutes: metrics.uptimeMinutes,
                    downtimeMinutes: metrics.downtimeMinutes,
                    meetsRequirement: parseFloat(metrics.availability) >= 90.0
                }
            });
        } catch (error) {
            console.error('Erro ao verificar health:', error);
            return res.status(503).json({
                success: false,
                status: 'unhealthy',
                message: 'Erro ao verificar status do sistema',
                error: error.message
            });
        }
    }

    /**
     * Retorna métricas detalhadas de disponibilidade
     */
    async getAvailabilityReport(req, res) {
        try {
            const metrics = getAvailabilityMetrics();
            
            // Calcula tempo máximo de indisponibilidade permitido (72h por mês)
            const maxDowntimeMinutes = 72 * 60; // 4320 minutos
            const downtimePercentage = (metrics.downtimeMinutes / maxDowntimeMinutes) * 100;

            return res.status(200).json({
                success: true,
                report: {
                    availability: {
                        current: metrics.availability + '%',
                        target: '90%',
                        status: parseFloat(metrics.availability) >= 90.0 ? 'OK' : 'CRITICAL'
                    },
                    uptime: {
                        percentage: metrics.uptimePercentage + '%',
                        minutes: metrics.uptimeMinutes,
                        status: parseFloat(metrics.uptimePercentage) >= 90.0 ? 'OK' : 'WARNING'
                    },
                    downtime: {
                        current: metrics.downtimeMinutes + ' min',
                        maximum: maxDowntimeMinutes + ' min (72h)',
                        percentage: downtimePercentage.toFixed(2) + '%',
                        remaining: (maxDowntimeMinutes - metrics.downtimeMinutes).toFixed(2) + ' min',
                        status: metrics.downtimeMinutes < maxDowntimeMinutes ? 'OK' : 'EXCEEDED'
                    },
                    requests: {
                        total: metrics.totalRequests,
                        successful: metrics.successfulRequests,
                        failed: metrics.failedRequests,
                        criticalErrors: metrics.criticalErrors
                    },
                    errorsByEndpoint: metrics.errorsByEndpoint,
                    lastError: metrics.lastError,
                    meetsRequirement: parseFloat(metrics.availability) >= 90.0 && metrics.downtimeMinutes < maxDowntimeMinutes
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao gerar relatório de disponibilidade',
                error: error.message
            });
        }
    }

    /**
     * Reset manual das estatísticas (apenas para administradores)
     */
    async resetStats(req, res) {
        try {
            resetMonthlyStats();
            
            return res.status(200).json({
                success: true,
                message: 'Estatísticas resetadas com sucesso',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Erro ao resetar estatísticas:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao resetar estatísticas',
                error: error.message
            });
        }
    }

    /**
     * Endpoint simples de ping
     */
    async ping(req, res) {
        return res.status(200).json({
            success: true,
            message: 'pong',
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Verifica conexão com banco de dados
 */
async function checkDatabaseConnection() {
    const startTime = Date.now();
    
    try {
        await pool.query('SELECT 1');
        const responseTime = Date.now() - startTime;
        
        return {
            connected: true,
            responseTime
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        console.error('Erro ao conectar com banco:', error);
        
        return {
            connected: false,
            responseTime,
            error: error.message
        };
    }
}

export default new HealthCheckController();
