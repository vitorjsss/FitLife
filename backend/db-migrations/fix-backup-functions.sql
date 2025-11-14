-- ================================================
-- FIX: Corrigir função de validação e constraint
-- ================================================

-- 1. Adicionar 'expired' à constraint de status
ALTER TABLE backup_log DROP CONSTRAINT IF EXISTS backup_log_backup_status_check;
ALTER TABLE backup_log ADD CONSTRAINT backup_log_backup_status_check 
    CHECK (backup_status IN ('in_progress', 'completed', 'failed', 'expired'));

-- 2. Recriar função com cast correto
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
    
    -- Calcular idade do backup (cast explícito)
    v_age_days := (CURRENT_DATE - v_backup.started_at::DATE)::INTEGER;
    
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
