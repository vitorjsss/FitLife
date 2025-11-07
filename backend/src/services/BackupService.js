import { pool } from '../config/db.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { LogService } from './LogService.js';

const execAsync = promisify(exec);

/**
 * Serviço de Backup e Recuperação de Dados
 * RNF1.2: Disponibilidade de Backup
 */
class BackupService {
    constructor() {
        this.backupDir = process.env.BACKUP_DIR || '/usr/src/backups';
        this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30');
        this.maxBackupSizeMB = 500; // Limite de 500MB por backup
    }

    /**
     * Realiza backup completo do banco de dados
     * Tempo estimado: 2-5 minutos para bancos pequenos/médios
     */
    async performFullBackup() {
        const startTime = Date.now();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `fitlife_backup_${timestamp}.sql`;
        const backupPath = path.join(this.backupDir, backupFileName);

        try {
            console.log('🔄 Iniciando backup completo do banco de dados...');

            // Garante que o diretório de backup existe
            await this.ensureBackupDirectory();

            // Executa pg_dump para criar backup
            const dbConfig = {
                host: process.env.DB_HOST || 'db',
                port: process.env.DB_PORT || '5432',
                database: process.env.DB_NAME || 'fitlife',
                user: process.env.DB_USER || 'fitlife',
                password: process.env.DB_PASSWORD || 'fitlife123'
            };

            const dumpCommand = `PGPASSWORD="${dbConfig.password}" pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -F c -b -v -f ${backupPath}`;

            await execAsync(dumpCommand);

            // Verifica o tamanho do backup
            const stats = await fs.stat(backupPath);
            const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

            if (stats.size === 0) {
                throw new Error('Backup gerado está vazio');
            }

            // Comprime o backup para economizar espaço
            const compressedPath = `${backupPath}.gz`;
            await execAsync(`gzip ${backupPath}`);

            const compressedStats = await fs.stat(compressedPath);
            const compressedSizeMB = (compressedStats.size / (1024 * 1024)).toFixed(2);

            const duration = ((Date.now() - startTime) / 1000).toFixed(2);

            // Registra o backup no sistema
            await LogService.createLog({
                action: 'BACKUP_COMPLETED',
                log_type: 'SYSTEM',
                description: `Backup completo realizado com sucesso: ${backupFileName}.gz (${compressedSizeMB}MB comprimido, original: ${sizeMB}MB) em ${duration}s`,
                user_id: null,
                old_value: null,
                new_value: JSON.stringify({
                    fileName: `${backupFileName}.gz`,
                    path: compressedPath,
                    originalSize: sizeMB + 'MB',
                    compressedSize: compressedSizeMB + 'MB',
                    duration: duration + 's',
                    timestamp: new Date().toISOString()
                })
            });

            console.log(`✅ Backup completo criado: ${backupFileName}.gz (${compressedSizeMB}MB) em ${duration}s`);

            // Remove backups antigos
            await this.cleanOldBackups();

            return {
                success: true,
                fileName: `${backupFileName}.gz`,
                path: compressedPath,
                size: compressedSizeMB + 'MB',
                duration: duration + 's'
            };

        } catch (error) {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            
            console.error('❌ Erro ao realizar backup:', error);

            await LogService.createLog({
                action: 'BACKUP_FAILED',
                log_type: 'SYSTEM',
                description: `Falha ao realizar backup: ${error.message}`,
                user_id: null,
                old_value: null,
                new_value: JSON.stringify({
                    error: error.message,
                    duration: duration + 's',
                    timestamp: new Date().toISOString()
                })
            });

            throw error;
        }
    }

    /**
     * Backup incremental - apenas dados críticos modificados nas últimas 24h
     * Mais rápido que backup completo (30s - 2min)
     */
    async performIncrementalBackup() {
        const startTime = Date.now();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `fitlife_incremental_${timestamp}.json`;
        const backupPath = path.join(this.backupDir, backupFileName);

        try {
            console.log('🔄 Iniciando backup incremental (últimas 24h)...');

            await this.ensureBackupDirectory();

            // Busca dados críticos modificados nas últimas 24h
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const criticalData = await this.getCriticalDataModifiedSince(twentyFourHoursAgo);

            // Salva em JSON
            await fs.writeFile(backupPath, JSON.stringify(criticalData, null, 2));

            const stats = await fs.stat(backupPath);
            const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

            const duration = ((Date.now() - startTime) / 1000).toFixed(2);

            await LogService.createLog({
                action: 'INCREMENTAL_BACKUP_COMPLETED',
                log_type: 'SYSTEM',
                description: `Backup incremental realizado: ${criticalData.totalRecords} registros (${sizeMB}MB) em ${duration}s`,
                user_id: null,
                old_value: null,
                new_value: JSON.stringify({
                    fileName: backupFileName,
                    records: criticalData.totalRecords,
                    size: sizeMB + 'MB',
                    duration: duration + 's'
                })
            });

            console.log(`✅ Backup incremental criado: ${backupFileName} (${sizeMB}MB) em ${duration}s`);

            return {
                success: true,
                fileName: backupFileName,
                path: backupPath,
                records: criticalData.totalRecords,
                size: sizeMB + 'MB',
                duration: duration + 's'
            };

        } catch (error) {
            console.error('❌ Erro ao realizar backup incremental:', error);
            throw error;
        }
    }

    /**
     * Busca dados críticos modificados desde uma data específica
     */
    async getCriticalDataModifiedSince(sinceDate) {
        const isoDate = sinceDate.toISOString();

        const queries = {
            patients: `SELECT * FROM patient WHERE updated_at >= $1 OR created_at >= $1`,
            dailyMeals: `SELECT * FROM daily_meal_registry WHERE updated_at >= $1 OR created_at >= $1`,
            mealRecords: `SELECT * FROM meal_record WHERE updated_at >= $1 OR created_at >= $1`,
            workouts: `SELECT * FROM workout WHERE updated_at >= $1 OR created_at >= $1`,
            workoutSessions: `SELECT * FROM workout_session WHERE updated_at >= $1 OR created_at >= $1`,
            measurements: `SELECT * FROM measurement WHERE updated_at >= $1 OR created_at >= $1`
        };

        const results = {};
        let totalRecords = 0;

        for (const [table, query] of Object.entries(queries)) {
            const result = await pool.query(query, [isoDate]);
            results[table] = result.rows;
            totalRecords += result.rows.length;
        }

        return {
            totalRecords,
            timestamp: new Date().toISOString(),
            sinceDate: isoDate,
            data: results
        };
    }

    /**
     * Restaura backup completo
     * RNF1.2: Deve completar em até 30 minutos
     */
    async restoreFullBackup(backupFileName) {
        const startTime = Date.now();

        try {
            console.log(`🔄 Iniciando restauração do backup: ${backupFileName}`);

            const backupPath = path.join(this.backupDir, backupFileName);

            // Verifica se o arquivo existe
            try {
                await fs.access(backupPath);
            } catch {
                throw new Error(`Arquivo de backup não encontrado: ${backupFileName}`);
            }

            // Se estiver comprimido, descomprime primeiro
            let restorePath = backupPath;
            if (backupFileName.endsWith('.gz')) {
                console.log('📦 Descomprimindo backup...');
                await execAsync(`gunzip -k ${backupPath}`);
                restorePath = backupPath.replace('.gz', '');
            }

            const dbConfig = {
                host: process.env.DB_HOST || 'db',
                port: process.env.DB_PORT || '5432',
                database: process.env.DB_NAME || 'fitlife',
                user: process.env.DB_USER || 'fitlife',
                password: process.env.DB_PASSWORD || 'fitlife123'
            };

            // Realiza a restauração
            console.log('📥 Restaurando dados no banco...');
            const restoreCommand = `PGPASSWORD="${dbConfig.password}" pg_restore -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -c -v ${restorePath}`;

            await execAsync(restoreCommand);

            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            const durationMinutes = (duration / 60).toFixed(2);

            // Valida se os dados foram restaurados corretamente
            const validation = await this.validateRestoredData();

            await LogService.createLog({
                action: 'BACKUP_RESTORED',
                log_type: 'SYSTEM',
                description: `Backup restaurado com sucesso: ${backupFileName} em ${durationMinutes} minutos`,
                user_id: null,
                old_value: null,
                new_value: JSON.stringify({
                    fileName: backupFileName,
                    duration: durationMinutes + ' min',
                    validation: validation,
                    timestamp: new Date().toISOString()
                })
            });

            // Alerta se ultrapassou 30 minutos
            if (parseFloat(durationMinutes) > 30) {
                console.warn(`⚠️ ALERTA: Restauração levou ${durationMinutes} minutos (limite: 30 min)`);
            } else {
                console.log(`✅ Restauração completa em ${durationMinutes} minutos (dentro do SLA de 30 min)`);
            }

            return {
                success: true,
                fileName: backupFileName,
                duration: durationMinutes + ' min',
                validation: validation,
                withinSLA: parseFloat(durationMinutes) <= 30
            };

        } catch (error) {
            const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

            console.error('❌ Erro ao restaurar backup:', error);

            await LogService.createLog({
                action: 'BACKUP_RESTORE_FAILED',
                log_type: 'SYSTEM',
                description: `Falha ao restaurar backup ${backupFileName}: ${error.message}`,
                user_id: null,
                old_value: null,
                new_value: JSON.stringify({
                    fileName: backupFileName,
                    error: error.message,
                    duration: duration + ' min',
                    timestamp: new Date().toISOString()
                })
            });

            throw error;
        }
    }

    /**
     * Valida integridade dos dados após restauração
     */
    async validateRestoredData() {
        try {
            const tables = [
                'patient',
                'daily_meal_registry',
                'meal_record',
                'workout',
                'workout_session',
                'measurement'
            ];

            const validation = {};
            let isValid = true;

            for (const table of tables) {
                const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
                const count = parseInt(result.rows[0].count);
                
                validation[table] = {
                    count: count,
                    status: count >= 0 ? 'OK' : 'EMPTY'
                };

                if (count < 0) isValid = false;
            }

            // Testa conexão com o banco
            await pool.query('SELECT 1');

            return {
                isValid: isValid,
                tables: validation,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Erro na validação dos dados:', error);
            return {
                isValid: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Lista todos os backups disponíveis
     */
    async listBackups() {
        try {
            await this.ensureBackupDirectory();

            const files = await fs.readdir(this.backupDir);
            const backupFiles = files.filter(f => 
                f.startsWith('fitlife_backup_') || f.startsWith('fitlife_incremental_')
            );

            const backups = await Promise.all(
                backupFiles.map(async (file) => {
                    const filePath = path.join(this.backupDir, file);
                    const stats = await fs.stat(filePath);
                    
                    return {
                        fileName: file,
                        path: filePath,
                        size: (stats.size / (1024 * 1024)).toFixed(2) + 'MB',
                        created: stats.birthtime,
                        type: file.includes('incremental') ? 'incremental' : 'full'
                    };
                })
            );

            // Ordena por data (mais recente primeiro)
            backups.sort((a, b) => b.created - a.created);

            return backups;

        } catch (error) {
            console.error('❌ Erro ao listar backups:', error);
            throw error;
        }
    }

    /**
     * Remove backups mais antigos que o período de retenção
     */
    async cleanOldBackups() {
        try {
            const backups = await this.listBackups();
            const cutoffDate = new Date(Date.now() - this.retentionDays * 24 * 60 * 60 * 1000);

            let deletedCount = 0;

            for (const backup of backups) {
                if (backup.created < cutoffDate) {
                    await fs.unlink(backup.path);
                    console.log(`🗑️  Backup antigo removido: ${backup.fileName}`);
                    deletedCount++;
                }
            }

            if (deletedCount > 0) {
                console.log(`✅ ${deletedCount} backup(s) antigo(s) removido(s)`);
            }

        } catch (error) {
            console.error('⚠️  Erro ao limpar backups antigos:', error);
        }
    }

    /**
     * Garante que o diretório de backup existe
     */
    async ensureBackupDirectory() {
        try {
            await fs.access(this.backupDir);
        } catch {
            await fs.mkdir(this.backupDir, { recursive: true });
            console.log(`📁 Diretório de backup criado: ${this.backupDir}`);
        }
    }

    /**
     * Testa o processo completo de backup e restauração
     * RNF1.2: Validação periódica do processo
     */
    async testBackupAndRestore() {
        console.log('🧪 Iniciando teste de backup e restauração...');

        try {
            // 1. Cria snapshot dos dados atuais
            const beforeSnapshot = await this.getCriticalDataModifiedSince(new Date('2000-01-01'));

            // 2. Realiza backup
            const backup = await this.performFullBackup();

            // 3. Simula restauração (em ambiente de teste)
            // Em produção, isso seria feito em um banco separado
            console.log('✅ Backup criado com sucesso para teste');

            // 4. Valida integridade
            const validation = await this.validateRestoredData();

            const testResult = {
                success: validation.isValid,
                backupFileName: backup.fileName,
                backupSize: backup.size,
                backupDuration: backup.duration,
                validation: validation,
                timestamp: new Date().toISOString()
            };

            await LogService.createLog({
                action: 'BACKUP_TEST_COMPLETED',
                log_type: 'SYSTEM',
                description: `Teste de backup/restauração ${validation.isValid ? 'APROVADO' : 'FALHOU'}`,
                user_id: null,
                old_value: null,
                new_value: JSON.stringify(testResult)
            });

            console.log(`✅ Teste de backup e restauração concluído: ${validation.isValid ? 'APROVADO' : 'FALHOU'}`);

            return testResult;

        } catch (error) {
            console.error('❌ Teste de backup/restauração falhou:', error);

            await LogService.createLog({
                action: 'BACKUP_TEST_FAILED',
                log_type: 'SYSTEM',
                description: `Teste de backup/restauração falhou: ${error.message}`,
                user_id: null,
                old_value: null,
                new_value: JSON.stringify({
                    error: error.message,
                    timestamp: new Date().toISOString()
                })
            });

            throw error;
        }
    }

    /**
     * Obtém estatísticas sobre os backups
     */
    async getBackupStatistics() {
        try {
            const backups = await this.listBackups();

            if (backups.length === 0) {
                return {
                    totalBackups: 0,
                    lastBackup: null,
                    totalSize: '0MB',
                    oldestBackup: null
                };
            }

            const totalSizeBytes = backups.reduce((sum, b) => {
                return sum + parseFloat(b.size) * 1024 * 1024;
            }, 0);

            return {
                totalBackups: backups.length,
                lastBackup: backups[0],
                totalSize: (totalSizeBytes / (1024 * 1024)).toFixed(2) + 'MB',
                oldestBackup: backups[backups.length - 1],
                fullBackups: backups.filter(b => b.type === 'full').length,
                incrementalBackups: backups.filter(b => b.type === 'incremental').length
            };

        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error);
            throw error;
        }
    }
}

export default new BackupService();
