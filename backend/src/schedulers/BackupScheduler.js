import cron from 'node-cron';
import BackupService from '../services/BackupService.js';
import { LogService } from '../services/LogService.js';

/**
 * Scheduler para backups automáticos
 * RNF1.2: Backup diário mínimo
 */
class BackupScheduler {
    constructor() {
        this.jobs = [];
    }

    /**
     * Inicia todos os agendamentos de backup
     */
    start() {
        console.log('🕐 Iniciando agendamento de backups automáticos...');

        // Backup completo diário às 2h da manhã
        this.scheduleFullBackup();

        // Backup incremental a cada 6 horas
        this.scheduleIncrementalBackup();

        // Teste semanal de backup e restauração (domingos às 3h)
        this.scheduleWeeklyTest();

        // Limpeza de backups antigos (diário às 4h)
        this.scheduleCleanup();

        console.log('✅ Agendamentos de backup configurados com sucesso');
    }

    /**
     * Agenda backup completo diário
     * Cron: 0 2 * * * (2h da manhã, todos os dias)
     */
    scheduleFullBackup() {
        const job = cron.schedule('0 2 * * *', async () => {
            try {
                console.log('🕐 [CRON] Iniciando backup completo automático...');
                const result = await BackupService.performFullBackup();
                console.log(`✅ [CRON] Backup completo automático concluído: ${result.fileName}`);

                // Envia notificação de sucesso
                await this.notifyBackupSuccess('FULL', result);

            } catch (error) {
                console.error('❌ [CRON] Erro no backup completo automático:', error);
                await this.notifyBackupFailure('FULL', error);
            }
        }, {
            scheduled: true,
            timezone: "America/Sao_Paulo"
        });

        this.jobs.push({ name: 'full-backup', job });
        console.log('✅ Backup completo agendado: diariamente às 2h');
    }

    /**
     * Agenda backup incremental a cada 6 horas
     * Cron: 0 (asterisco)/6 * * * (às 0h, 6h, 12h, 18h)
     */
    scheduleIncrementalBackup() {
        const job = cron.schedule('0 */6 * * *', async () => {
            try {
                console.log('🕐 [CRON] Iniciando backup incremental automático...');
                const result = await BackupService.performIncrementalBackup();
                console.log(`✅ [CRON] Backup incremental automático concluído: ${result.fileName}`);

            } catch (error) {
                console.error('❌ [CRON] Erro no backup incremental automático:', error);
                await this.notifyBackupFailure('INCREMENTAL', error);
            }
        }, {
            scheduled: true,
            timezone: "America/Sao_Paulo"
        });

        this.jobs.push({ name: 'incremental-backup', job });
        console.log('✅ Backup incremental agendado: a cada 6 horas');
    }

    /**
     * Agenda teste semanal de backup e restauração
     * Cron: 0 3 * * 0 (3h da manhã aos domingos)
     */
    scheduleWeeklyTest() {
        const job = cron.schedule('0 3 * * 0', async () => {
            try {
                console.log('🧪 [CRON] Iniciando teste semanal de backup/restauração...');
                const result = await BackupService.testBackupAndRestore();
                
                if (result.success) {
                    console.log('✅ [CRON] Teste semanal de backup APROVADO');
                } else {
                    console.error('❌ [CRON] Teste semanal de backup FALHOU');
                    await this.notifyTestFailure(result);
                }

            } catch (error) {
                console.error('❌ [CRON] Erro no teste semanal:', error);
                await this.notifyTestFailure({ error: error.message });
            }
        }, {
            scheduled: true,
            timezone: "America/Sao_Paulo"
        });

        this.jobs.push({ name: 'weekly-test', job });
        console.log('✅ Teste semanal agendado: domingos às 3h');
    }

    /**
     * Agenda limpeza de backups antigos
     * Cron: 0 4 * * * (4h da manhã, todos os dias)
     */
    scheduleCleanup() {
        const job = cron.schedule('0 4 * * *', async () => {
            try {
                console.log('🧹 [CRON] Iniciando limpeza de backups antigos...');
                await BackupService.cleanOldBackups();
                console.log('✅ [CRON] Limpeza de backups concluída');

            } catch (error) {
                console.error('❌ [CRON] Erro na limpeza de backups:', error);
            }
        }, {
            scheduled: true,
            timezone: "America/Sao_Paulo"
        });

        this.jobs.push({ name: 'cleanup', job });
        console.log('✅ Limpeza de backups agendada: diariamente às 4h');
    }

    /**
     * Notifica sucesso do backup
     */
    async notifyBackupSuccess(type, result) {
        try {
            await LogService.createLog({
                action: `AUTO_BACKUP_${type}_SUCCESS`,
                log_type: 'SYSTEM',
                description: `Backup automático ${type.toLowerCase()} concluído com sucesso: ${result.fileName} (${result.size})`,
                user_id: null,
                old_value: null,
                new_value: JSON.stringify(result)
            });

            // Em produção: enviar email/SMS/Slack
            console.log(`📧 Notificação de sucesso enviada: Backup ${type}`);

        } catch (error) {
            console.error('Erro ao enviar notificação de sucesso:', error);
        }
    }

    /**
     * Notifica falha no backup
     */
    async notifyBackupFailure(type, error) {
        try {
            await LogService.createLog({
                action: `AUTO_BACKUP_${type}_FAILED`,
                log_type: 'SYSTEM',
                description: `CRÍTICO: Backup automático ${type.toLowerCase()} falhou: ${error.message}`,
                user_id: null,
                old_value: null,
                new_value: JSON.stringify({
                    error: error.message,
                    stack: error.stack,
                    timestamp: new Date().toISOString()
                })
            });

            // ALERTA CRÍTICO
            console.error('🚨 ALERTA CRÍTICO: Backup automático falhou!');
            console.error(`Tipo: ${type}`);
            console.error(`Erro: ${error.message}`);
            
            // Em produção: enviar alertas urgentes (email, SMS, PagerDuty)

        } catch (logError) {
            console.error('Erro ao registrar falha de backup:', logError);
        }
    }

    /**
     * Notifica falha no teste de backup
     */
    async notifyTestFailure(result) {
        try {
            await LogService.createLog({
                action: 'BACKUP_TEST_FAILED',
                log_type: 'SYSTEM',
                description: `CRÍTICO: Teste de backup/restauração falhou`,
                user_id: null,
                old_value: null,
                new_value: JSON.stringify(result)
            });

            console.error('🚨 ALERTA CRÍTICO: Teste de backup falhou!');
            console.error('Ação necessária: Verificar integridade do sistema de backup');

        } catch (error) {
            console.error('Erro ao registrar falha de teste:', error);
        }
    }

    /**
     * Para todos os agendamentos
     */
    stop() {
        console.log('🛑 Parando agendamentos de backup...');
        
        this.jobs.forEach(({ name, job }) => {
            job.stop();
            console.log(`✅ Agendamento parado: ${name}`);
        });

        this.jobs = [];
    }

    /**
     * Status dos agendamentos
     */
    getStatus() {
        return this.jobs.map(({ name, job }) => ({
            name: name,
            running: job.running || false
        }));
    }
}

export default new BackupScheduler();
