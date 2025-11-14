-- ================================================
-- FIX: Corrigir índice e view de backup
-- ================================================

-- 1. Recriar índice sem predicado complexo
DROP INDEX IF EXISTS idx_backup_log_retention;
CREATE INDEX idx_backup_log_retention ON backup_log(retention_until, backup_status);

-- 2. Recriar view com cast explícito
DROP VIEW IF EXISTS backup_report;
CREATE VIEW backup_report AS
SELECT 
    bl.id,
    bl.backup_type,
    bl.backup_status,
    bl.started_at,
    bl.completed_at,
    bl.duration_seconds,
    ROUND((bl.file_size / 1048576.0)::NUMERIC, 2) as file_size_mb,
    bl.triggered_by,
    bl.retention_until,
    (bl.retention_until::DATE - CURRENT_DATE)::INTEGER as days_until_expiry,
    ARRAY_LENGTH(bl.tables_backed_up, 1) as table_count,
    CASE 
        WHEN bl.backup_status = 'completed' THEN '✓ Concluído'
        WHEN bl.backup_status = 'in_progress' THEN '⏳ Em andamento'
        WHEN bl.backup_status = 'failed' THEN '✗ Falhou'
        WHEN bl.backup_status = 'expired' THEN '🗑 Expirado'
    END as status_display,
    CASE
        WHEN bl.duration_seconds < 60 THEN bl.duration_seconds || 's'
        WHEN bl.duration_seconds < 3600 THEN ROUND(bl.duration_seconds / 60.0, 1) || 'min'
        ELSE ROUND(bl.duration_seconds / 3600.0, 2) || 'h'
    END as duration_display
FROM backup_log bl
ORDER BY bl.started_at DESC;
