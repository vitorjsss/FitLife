import cron from 'node-cron';
import { PatientConnectionCodeService } from '../services/PatientConnectionCodeService.js';
import { LogService } from '../services/LogService.js';

class CodeCleanupScheduler {
    constructor() {
        this.task = null;
        this.isRunning = false;
    }

    /**
     * Inicia o scheduler
     * @param {string} cronPattern - Padrão cron (opcional, padrão: a cada 10 minutos)
     */
    start(cronPattern = '*/10 * * * *') {
        if (this.isRunning) {
            console.warn('[CodeCleanupScheduler] Scheduler já está em execução');
            return;
        }

        this.task = cron.schedule(cronPattern, async () => {
            await this.cleanup();
        });

        this.isRunning = true;
        console.log(`✅ [CodeCleanupScheduler] Iniciado com padrão: ${cronPattern}`);
        console.log(`   Próxima execução em: ${this.getNextExecutionTime(cronPattern)}`);
    }

    /**
     * Para o scheduler
     */
    stop() {
        if (this.task) {
            this.task.stop();
            this.isRunning = false;
            console.log('🛑 [CodeCleanupScheduler] Parado');
        }
    }

    /**
     * Executa a limpeza de códigos expirados
     */
    async cleanup() {
        const startTime = Date.now();

        try {
            console.log('[CodeCleanupScheduler] Iniciando limpeza de códigos expirados...');

            const deleted = await PatientConnectionCodeService.cleanupExpiredCodes();

            const executionTime = Date.now() - startTime;

            if (deleted && deleted.length > 0) {
                console.log(`✅ [CodeCleanupScheduler] ${deleted.length} código(s) expirado(s) removido(s) em ${executionTime}ms`);

                await LogService.createLog({
                    action: 'AUTO_CLEANUP_EXPIRED_CODES',
                    logType: 'DELETE',
                    description: `Limpeza automática removeu ${deleted.length} código(s) expirado(s)`,
                    ip: null,
                    oldValue: null,
                    newValue: {
                        count: deleted.length,
                        codes: deleted.map(c => ({
                            code: c.code,
                            patient_id: c.patient_id,
                            expired_at: c.expires_at
                        })),
                        executionTimeMs: executionTime
                    },
                    status: 'SUCCESS',
                    userId: null
                });
            } else {
                console.log(`ℹ️  [CodeCleanupScheduler] Nenhum código expirado encontrado (${executionTime}ms)`);
            }
        } catch (error) {
            console.error('❌ [CodeCleanupScheduler] Erro ao limpar códigos:', error);

            try {
                await LogService.createLog({
                    action: 'AUTO_CLEANUP_EXPIRED_CODES',
                    logType: 'ERROR',
                    description: `Erro na limpeza automática: ${error.message}`,
                    ip: null,
                    oldValue: null,
                    newValue: {
                        error: error.message,
                        stack: error.stack
                    },
                    status: 'FAILURE',
                    userId: null
                });
            } catch (logError) {
                console.error('[CodeCleanupScheduler] Erro ao criar log de erro:', logError);
            }
        }
    }

    /**
     * Calcula o próximo horário de execução (aproximado)
     * @param {string} cronPattern 
     * @returns {string}
     */
    getNextExecutionTime(cronPattern) {
        const parts = cronPattern.split(' ');
        const minute = parts[0];

        if (minute.startsWith('*/')) {
            const interval = parseInt(minute.substring(2));
            return `${interval} minutos`;
        }

        return 'conforme padrão cron';
    }

    /**
     * Retorna o status do scheduler
     * @returns {object}
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            task: this.task ? 'Ativo' : 'Inativo'
        };
    }
}

export default new CodeCleanupScheduler();
