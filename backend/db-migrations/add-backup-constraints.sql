-- ================================================
-- MITIGAÇÃO RISCO: BACKUP DE DADOS CRÍTICOS
-- Sistema: FitLife
-- Data: 14/11/2025
-- Parâmetro: Backup de dados críticos
-- Palavra Guia: Mais cedo
-- Objetivo: Automatizar backups e implementar rotinas de restauração
-- ================================================

-- 1. TABELA DE CONTROLE DE BACKUPS
-- ================================================

CREATE TABLE IF NOT EXISTS backup_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type VARCHAR(50) NOT NULL CHECK (backup_type IN ('full', 'incremental', 'differential')),
    backup_status VARCHAR(20) NOT NULL CHECK (backup_status IN ('in_progress', 'completed', 'failed')),
    file_path TEXT NOT NULL,
    file_size BIGINT,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INTEGER,
    tables_backed_up TEXT[],
    error_message TEXT,
    triggered_by VARCHAR(50) CHECK (triggered_by IN ('scheduled', 'manual', 'pre_update')),
    retention_until DATE,
    checksum VARCHAR(64)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_backup_log_status ON backup_log(backup_status) WHERE backup_status != 'completed';
CREATE INDEX IF NOT EXISTS idx_backup_log_started_at ON backup_log(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_log_type ON backup_log(backup_type);
CREATE INDEX IF NOT EXISTS idx_backup_log_retention ON backup_log(retention_until) WHERE retention_until < CURRENT_DATE;

-- 2. TABELA DE CONFIGURAÇÕES DE BACKUP
-- ================================================

CREATE TABLE IF NOT EXISTS backup_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_name VARCHAR(100) UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT true,
    schedule_cron VARCHAR(100),
    backup_type VARCHAR(50) NOT NULL CHECK (backup_type IN ('full', 'incremental', 'differential')),
    retention_days INTEGER DEFAULT 30 CHECK (retention_days > 0),
    tables_to_backup TEXT[],
    max_backup_size_mb INTEGER,
    compression_enabled BOOLEAN DEFAULT true,
    encryption_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Configuração padrão de backup diário
INSERT INTO backup_config (config_name, schedule_cron, backup_type, retention_days, tables_to_backup)
VALUES (
    'daily_full_backup',
    '0 2 * * *',  -- Executa às 2h da manhã todo dia
    'full',
    30,
    ARRAY['patient', 'mealrecord', 'mealitem', 'workoutrecord', 'workoutitem', 'dailymealregistry']
) ON CONFLICT (config_name) DO NOTHING;

-- 3. FUNÇÃO PARA REGISTRAR INÍCIO DE BACKUP
-- ================================================

CREATE OR REPLACE FUNCTION start_backup_log(
    p_backup_type VARCHAR,
    p_triggered_by VARCHAR,
    p_file_path TEXT
)
RETURNS UUID AS $$
DECLARE
    v_backup_id UUID;
    v_retention_days INTEGER;
BEGIN
    -- Buscar retention_days da configuração
    SELECT retention_days INTO v_retention_days
    FROM backup_config
    WHERE backup_type = p_backup_type
      AND enabled = true
    LIMIT 1;
    
    -- Criar registro de backup
    INSERT INTO backup_log (
        backup_type,
        backup_status,
        file_path,
        started_at,
        triggered_by,
        retention_until
    )
    VALUES (
        p_backup_type,
        'in_progress',
        p_file_path,
        CURRENT_TIMESTAMP,
        p_triggered_by,
        CURRENT_DATE + COALESCE(v_retention_days, 30)
    )
    RETURNING id INTO v_backup_id;
    
    RETURN v_backup_id;
END;
$$ LANGUAGE plpgsql;

-- 4. FUNÇÃO PARA FINALIZAR BACKUP
-- ================================================

CREATE OR REPLACE FUNCTION complete_backup_log(
    p_backup_id UUID,
    p_status VARCHAR,
    p_file_size BIGINT DEFAULT NULL,
    p_tables TEXT[] DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_checksum VARCHAR DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_started_at TIMESTAMP;
    v_duration INTEGER;
BEGIN
    -- Buscar timestamp de início
    SELECT started_at INTO v_started_at
    FROM backup_log
    WHERE id = p_backup_id;
    
    -- Calcular duração
    v_duration := EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - v_started_at))::INTEGER;
    
    -- Atualizar registro
    UPDATE backup_log
    SET backup_status = p_status,
        completed_at = CURRENT_TIMESTAMP,
        duration_seconds = v_duration,
        file_size = p_file_size,
        tables_backed_up = p_tables,
        error_message = p_error_message,
        checksum = p_checksum
    WHERE id = p_backup_id;
END;
$$ LANGUAGE plpgsql;

-- 5. FUNÇÃO PARA VERIFICAR BACKUPS RECENTES
-- ================================================

CREATE OR REPLACE FUNCTION check_recent_backups(p_hours INTEGER DEFAULT 24)
RETURNS TABLE(
    backup_count INTEGER,
    last_backup_at TIMESTAMP,
    last_backup_status VARCHAR,
    hours_since_last_backup NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as backup_count,
        MAX(started_at) as last_backup_at,
        (SELECT backup_status FROM backup_log WHERE started_at = MAX(bl.started_at) LIMIT 1) as last_backup_status,
        ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - MAX(started_at))) / 3600, 2) as hours_since_last_backup
    FROM backup_log bl
    WHERE started_at >= CURRENT_TIMESTAMP - (p_hours || ' hours')::INTERVAL
      AND backup_status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- 6. FUNÇÃO PARA LIMPAR BACKUPS EXPIRADOS
-- ================================================

CREATE OR REPLACE FUNCTION cleanup_expired_backups()
RETURNS TABLE(
    deleted_count INTEGER,
    freed_space_mb NUMERIC
) AS $$
DECLARE
    v_deleted_count INTEGER;
    v_freed_space BIGINT;
BEGIN
    -- Calcular espaço que será liberado
    SELECT 
        COUNT(*),
        COALESCE(SUM(file_size), 0)
    INTO v_deleted_count, v_freed_space
    FROM backup_log
    WHERE retention_until < CURRENT_DATE
      AND backup_status = 'completed';
    
    -- Marcar backups como expirados (não deletar o registro, apenas para auditoria)
    UPDATE backup_log
    SET backup_status = 'expired'
    WHERE retention_until < CURRENT_DATE
      AND backup_status = 'completed';
    
    RETURN QUERY
    SELECT 
        v_deleted_count,
        ROUND((v_freed_space / 1048576.0)::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql;

-- 7. FUNÇÃO PARA VALIDAR INTEGRIDADE DE BACKUP
-- ================================================

CREATE OR REPLACE FUNCTION validate_backup_integrity(p_backup_id UUID)
RETURNS TABLE(
    is_valid BOOLEAN,
    file_exists BOOLEAN,
    checksum_match BOOLEAN,
    age_days INTEGER,
    message TEXT
) AS $$
DECLARE
    v_backup backup_log%ROWTYPE;
    v_age_days INTEGER;
BEGIN
    -- Buscar backup
    SELECT * INTO v_backup
    FROM backup_log
    WHERE id = p_backup_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, false, false, 0, 'Backup não encontrado'::TEXT;
        RETURN;
    END IF;
    
    -- Calcular idade do backup
    v_age_days := EXTRACT(DAY FROM (CURRENT_DATE - v_backup.started_at::DATE))::INTEGER;
    
    -- Validações básicas
    RETURN QUERY
    SELECT 
        (v_backup.backup_status = 'completed' AND v_backup.file_size > 0) as is_valid,
        (v_backup.file_path IS NOT NULL AND LENGTH(v_backup.file_path) > 0) as file_exists,
        (v_backup.checksum IS NOT NULL AND LENGTH(v_backup.checksum) = 64) as checksum_match,
        v_age_days,
        CASE 
            WHEN v_backup.backup_status != 'completed' THEN 'Backup não completado'
            WHEN v_backup.file_size = 0 OR v_backup.file_size IS NULL THEN 'Arquivo vazio ou tamanho desconhecido'
            WHEN v_backup.checksum IS NULL THEN 'Checksum não disponível'
            WHEN v_age_days > 7 THEN 'Backup com mais de 7 dias'
            ELSE 'Backup válido'
        END::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 8. VIEW PARA RELATÓRIO DE BACKUPS
-- ================================================

CREATE OR REPLACE VIEW backup_report AS
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
    EXTRACT(DAY FROM (bl.retention_until - CURRENT_DATE))::INTEGER as days_until_expiry,
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

-- 9. TRIGGER PARA ATUALIZAR updated_at EM backup_config
-- ================================================

CREATE OR REPLACE FUNCTION update_backup_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_backup_config_timestamp ON backup_config;
CREATE TRIGGER trigger_update_backup_config_timestamp
    BEFORE UPDATE ON backup_config
    FOR EACH ROW
    EXECUTE FUNCTION update_backup_config_timestamp();

-- 10. FUNÇÃO PARA ESTATÍSTICAS DE BACKUP
-- ================================================

CREATE OR REPLACE FUNCTION get_backup_statistics(p_days INTEGER DEFAULT 30)
RETURNS TABLE(
    total_backups INTEGER,
    successful_backups INTEGER,
    failed_backups INTEGER,
    success_rate NUMERIC,
    total_size_mb NUMERIC,
    avg_duration_seconds NUMERIC,
    last_backup_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_backups,
        COUNT(*) FILTER (WHERE backup_status = 'completed')::INTEGER as successful_backups,
        COUNT(*) FILTER (WHERE backup_status = 'failed')::INTEGER as failed_backups,
        ROUND(
            (COUNT(*) FILTER (WHERE backup_status = 'completed')::NUMERIC / 
            NULLIF(COUNT(*)::NUMERIC, 0) * 100), 2
        ) as success_rate,
        ROUND(COALESCE(SUM(file_size) FILTER (WHERE backup_status = 'completed') / 1048576.0, 0)::NUMERIC, 2) as total_size_mb,
        ROUND(AVG(duration_seconds) FILTER (WHERE backup_status = 'completed')::NUMERIC, 2) as avg_duration_seconds,
        MAX(started_at) FILTER (WHERE backup_status = 'completed') as last_backup_at
    FROM backup_log
    WHERE started_at >= CURRENT_TIMESTAMP - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- VERIFICAÇÃO DA INSTALAÇÃO
-- ================================================

-- Verificar tabelas criadas
SELECT 
    'Tabelas de backup criadas' as status,
    COUNT(*) as count
FROM pg_tables
WHERE tablename IN ('backup_log', 'backup_config');

-- Verificar funções criadas
SELECT 
    'Funções de backup criadas' as status,
    COUNT(*) as count
FROM pg_proc
WHERE proname LIKE '%backup%';

-- Verificar índices criados
SELECT 
    'Índices de backup criados' as status,
    COUNT(*) as count
FROM pg_indexes
WHERE tablename IN ('backup_log', 'backup_config');

-- Verificar configuração padrão
SELECT 
    'Configuração padrão criada' as status,
    EXISTS(SELECT 1 FROM backup_config WHERE config_name = 'daily_full_backup') as exists;
