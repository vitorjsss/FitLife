import BackupService from '../services/BackupService.js';

class BackupController {
    /**
     * Realiza backup completo manual
     * POST /backup/full
     */
    async createFullBackup(req, res) {
        try {
            const result = await BackupService.performFullBackup();

            return res.status(200).json({
                success: true,
                message: 'Backup completo realizado com sucesso',
                backup: result
            });

        } catch (error) {
            console.error('Erro ao criar backup completo:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao criar backup completo',
                error: error.message
            });
        }
    }

    /**
     * Realiza backup incremental manual
     * POST /backup/incremental
     */
    async createIncrementalBackup(req, res) {
        try {
            const result = await BackupService.performIncrementalBackup();

            return res.status(200).json({
                success: true,
                message: 'Backup incremental realizado com sucesso',
                backup: result
            });

        } catch (error) {
            console.error('Erro ao criar backup incremental:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao criar backup incremental',
                error: error.message
            });
        }
    }

    /**
     * Lista todos os backups disponíveis
     * GET /backup/list
     */
    async listBackups(req, res) {
        try {
            const backups = await BackupService.listBackups();

            return res.status(200).json({
                success: true,
                count: backups.length,
                backups: backups
            });

        } catch (error) {
            console.error('Erro ao listar backups:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao listar backups',
                error: error.message
            });
        }
    }

    /**
     * Restaura um backup específico
     * POST /backup/restore
     * Body: { backupFileName: "fitlife_backup_2025-11-06.sql.gz" }
     */
    async restoreBackup(req, res) {
        try {
            const { backupFileName } = req.body;

            if (!backupFileName) {
                return res.status(400).json({
                    success: false,
                    message: 'Nome do arquivo de backup é obrigatório'
                });
            }

            const result = await BackupService.restoreFullBackup(backupFileName);

            const statusCode = result.withinSLA ? 200 : 206; // 206 = Partial Content (fora do SLA)

            return res.status(statusCode).json({
                success: true,
                message: result.withinSLA 
                    ? 'Backup restaurado com sucesso dentro do SLA (30 min)'
                    : 'Backup restaurado, mas ultrapassou o SLA de 30 minutos',
                restoration: result
            });

        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao restaurar backup',
                error: error.message
            });
        }
    }

    /**
     * Executa teste de backup e restauração
     * POST /backup/test
     */
    async testBackupRestore(req, res) {
        try {
            const result = await BackupService.testBackupAndRestore();

            return res.status(result.success ? 200 : 500).json({
                success: result.success,
                message: result.success 
                    ? 'Teste de backup/restauração aprovado'
                    : 'Teste de backup/restauração falhou',
                test: result
            });

        } catch (error) {
            console.error('Erro no teste de backup:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro no teste de backup/restauração',
                error: error.message
            });
        }
    }

    /**
     * Retorna estatísticas dos backups
     * GET /backup/stats
     */
    async getStatistics(req, res) {
        try {
            const stats = await BackupService.getBackupStatistics();

            return res.status(200).json({
                success: true,
                statistics: stats
            });

        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao obter estatísticas de backup',
                error: error.message
            });
        }
    }

    /**
     * Valida integridade dos dados atuais
     * GET /backup/validate
     */
    async validateData(req, res) {
        try {
            const validation = await BackupService.validateRestoredData();

            return res.status(validation.isValid ? 200 : 500).json({
                success: validation.isValid,
                message: validation.isValid 
                    ? 'Dados validados com sucesso'
                    : 'Falha na validação dos dados',
                validation: validation
            });

        } catch (error) {
            console.error('Erro ao validar dados:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao validar dados',
                error: error.message
            });
        }
    }
}

export default new BackupController();
