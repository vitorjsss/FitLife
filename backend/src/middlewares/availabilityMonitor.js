import { LogService } from '../services/LogService.js';

// Armazena estatísticas de disponibilidade em memória
const availabilityStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    criticalErrors: 0,
    startTime: Date.now(),
    lastResetTime: Date.now(),
    downtimeMinutes: 0,
    errorsByEndpoint: {},
    lastError: null
};

// Funcionalidades críticas que devem ter 90% de disponibilidade
const CRITICAL_ENDPOINTS = [
    '/auth/login',
    '/auth/register',
    '/patient',
    '/daily-meal-registry',
    '/meal-record',
    '/workout',
    '/workout-session'
];

/**
 * Verifica se o endpoint é crítico
 */
function isCriticalEndpoint(path) {
    return CRITICAL_ENDPOINTS.some(endpoint => path.startsWith(endpoint));
}

/**
 * Calcula a disponibilidade atual
 */
export function getAvailabilityMetrics() {
    const uptime = (Date.now() - availabilityStats.startTime) / 1000 / 60; // em minutos
    const availability = availabilityStats.totalRequests > 0
        ? (availabilityStats.successfulRequests / availabilityStats.totalRequests) * 100
        : 100;

    const uptimePercentage = uptime > 0
        ? ((uptime - availabilityStats.downtimeMinutes) / uptime) * 100
        : 100;

    return {
        availability: availability.toFixed(2),
        uptimePercentage: uptimePercentage.toFixed(2),
        totalRequests: availabilityStats.totalRequests,
        successfulRequests: availabilityStats.successfulRequests,
        failedRequests: availabilityStats.failedRequests,
        criticalErrors: availabilityStats.criticalErrors,
        uptimeMinutes: uptime.toFixed(2),
        downtimeMinutes: availabilityStats.downtimeMinutes.toFixed(2),
        errorsByEndpoint: availabilityStats.errorsByEndpoint,
        lastError: availabilityStats.lastError,
        isHealthy: availability >= 90.0 && uptimePercentage >= 90.0
    };
}

/**
 * Reseta as estatísticas (usado para ciclos mensais)
 */
export function resetMonthlyStats() {
    const metrics = getAvailabilityMetrics();
    
    // Log das métricas do mês antes de resetar
    // Apenas faz log se houver requisições (evita log na inicialização)
    if (availabilityStats.totalRequests > 0) {
        LogService.createLog({
            action: 'MONTHLY_AVAILABILITY_REPORT',
            log_type: 'SYSTEM',
            description: `Relatório mensal de disponibilidade: ${metrics.availability}% de sucesso, ${metrics.uptimePercentage}% de uptime`,
            user_id: null,
            old_value: JSON.stringify(availabilityStats),
            new_value: JSON.stringify(metrics)
        }).catch(err => console.error('Erro ao salvar log mensal:', err));

        console.log('✅ Estatísticas mensais resetadas');
    }

    // Reset das estatísticas
    availabilityStats.totalRequests = 0;
    availabilityStats.successfulRequests = 0;
    availabilityStats.failedRequests = 0;
    availabilityStats.criticalErrors = 0;
    availabilityStats.downtimeMinutes = 0;
    availabilityStats.errorsByEndpoint = {};
    availabilityStats.lastResetTime = Date.now();
    availabilityStats.lastError = null;
}

/**
 * Envia alerta para equipe de suporte
 */
async function sendAlert(errorDetails) {
    const metrics = getAvailabilityMetrics();

    // Log do erro crítico
    await LogService.createLog({
        action: 'CRITICAL_ERROR_ALERT',
        log_type: 'ERROR',
        description: `ALERTA CRÍTICO: ${errorDetails.message} - Disponibilidade: ${metrics.availability}%`,
        user_id: null,
        old_value: null,
        new_value: JSON.stringify({
            error: errorDetails,
            metrics: metrics,
            timestamp: new Date().toISOString()
        })
    });

    // Aqui você pode integrar com serviços de notificação como:
    // - Email (SendGrid, AWS SES)
    // - SMS (Twilio)
    // - Slack/Discord
    // - PagerDuty
    
    console.error('🚨 ALERTA CRÍTICO ENVIADO:', {
        endpoint: errorDetails.endpoint,
        error: errorDetails.message,
        availability: metrics.availability + '%',
        timestamp: new Date().toISOString()
    });

    // Se disponibilidade caiu abaixo de 90%, alerta extra
    if (metrics.availability < 90.0) {
        console.error('⚠️  DISPONIBILIDADE ABAIXO DE 90%! Ação imediata necessária!');
    }
}

/**
 * Middleware de monitoramento de disponibilidade
 */
export const availabilityMonitor = async (req, res, next) => {
    const startTime = Date.now();
    const endpoint = req.path;
    const isCritical = isCriticalEndpoint(endpoint);

    // Incrementa contador de requisições
    if (isCritical) {
        availabilityStats.totalRequests++;
    }

    // Captura a resposta original
    const originalSend = res.send;
    const originalJson = res.json;

    // Override do res.send
    res.send = function (data) {
        res.send = originalSend;
        
        const responseTime = Date.now() - startTime;
        const statusCode = res.statusCode;

        if (isCritical) {
            // Considera sucesso: status 2xx e 3xx
            if (statusCode >= 200 && statusCode < 400) {
                availabilityStats.successfulRequests++;
            } else {
                // Falha
                availabilityStats.failedRequests++;
                
                // Incrementa contador por endpoint
                if (!availabilityStats.errorsByEndpoint[endpoint]) {
                    availabilityStats.errorsByEndpoint[endpoint] = 0;
                }
                availabilityStats.errorsByEndpoint[endpoint]++;

                // Se for erro crítico (5xx), incrementa e envia alerta
                if (statusCode >= 500) {
                    availabilityStats.criticalErrors++;
                    availabilityStats.lastError = {
                        endpoint,
                        statusCode,
                        timestamp: new Date().toISOString(),
                        responseTime
                    };

                    // Envia alerta assíncrono
                    sendAlert({
                        endpoint,
                        statusCode,
                        message: `Erro ${statusCode} em endpoint crítico`,
                        responseTime,
                        method: req.method
                    }).catch(err => console.error('Erro ao enviar alerta:', err));
                }
            }
        }

        return originalSend.call(this, data);
    };

    // Override do res.json
    res.json = function (data) {
        res.json = originalJson;
        
        const responseTime = Date.now() - startTime;
        const statusCode = res.statusCode;

        if (isCritical) {
            if (statusCode >= 200 && statusCode < 400) {
                availabilityStats.successfulRequests++;
            } else {
                availabilityStats.failedRequests++;
                
                if (!availabilityStats.errorsByEndpoint[endpoint]) {
                    availabilityStats.errorsByEndpoint[endpoint] = 0;
                }
                availabilityStats.errorsByEndpoint[endpoint]++;

                if (statusCode >= 500) {
                    availabilityStats.criticalErrors++;
                    availabilityStats.lastError = {
                        endpoint,
                        statusCode,
                        timestamp: new Date().toISOString(),
                        responseTime
                    };

                    sendAlert({
                        endpoint,
                        statusCode,
                        message: `Erro ${statusCode} em endpoint crítico`,
                        responseTime,
                        method: req.method
                    }).catch(err => console.error('Erro ao enviar alerta:', err));
                }
            }
        }

        return originalJson.call(this, data);
    };

    next();
};

// Reset automático mensal (executado a cada 7 dias para evitar overflow)
// Em produção, usar cron job para maior confiabilidade
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
setInterval(() => {
    resetMonthlyStats();
}, SEVEN_DAYS);

// Exportação padrão
export default availabilityMonitor;
