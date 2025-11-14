-- ================================================
-- MITIGAÇÃO RISCO 10: ATUALIZAÇÃO DE CHECKLISTS
-- Sistema: FitLife
-- Data: 14/11/2025
-- Objetivo: Garantir sincronização e persistência de marcações de checklist
-- ================================================

-- 1. CONSTRAINTS PARA VALIDAÇÃO DE CHECKLIST
-- ================================================

-- Adicionar coluna checked_at para rastreamento temporal
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mealrecord' AND column_name = 'checked_at'
    ) THEN
        ALTER TABLE mealrecord ADD COLUMN checked_at TIMESTAMP;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workoutrecord' AND column_name = 'checked_at'
    ) THEN
        ALTER TABLE workoutrecord ADD COLUMN checked_at TIMESTAMP;
    END IF;
END $$;

-- 2. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA DE checked_at
-- ================================================

-- Trigger para atualizar checked_at em MealRecord
CREATE OR REPLACE FUNCTION update_mealrecord_checked_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.checked = true AND (OLD.checked = false OR OLD.checked IS NULL) THEN
        NEW.checked_at = CURRENT_TIMESTAMP;
    ELSIF NEW.checked = false THEN
        NEW.checked_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_mealrecord_checked_at ON mealrecord;
CREATE TRIGGER trigger_update_mealrecord_checked_at
    BEFORE UPDATE OF checked ON mealrecord
    FOR EACH ROW
    EXECUTE FUNCTION update_mealrecord_checked_at();

-- Trigger para atualizar checked_at em WorkoutRecord
CREATE OR REPLACE FUNCTION update_workoutrecord_checked_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.checked = true AND (OLD.checked = false OR OLD.checked IS NULL) THEN
        NEW.checked_at = CURRENT_TIMESTAMP;
    ELSIF NEW.checked = false THEN
        NEW.checked_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_workoutrecord_checked_at ON workoutrecord;
CREATE TRIGGER trigger_update_workoutrecord_checked_at
    BEFORE UPDATE OF checked ON workoutrecord
    FOR EACH ROW
    EXECUTE FUNCTION update_workoutrecord_checked_at();

-- 3. TABELA DE LOG DE CHECKLIST
-- ================================================

CREATE TABLE IF NOT EXISTS checklist_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_type VARCHAR(20) NOT NULL CHECK (record_type IN ('meal', 'workout')),
    record_id UUID NOT NULL,
    checked BOOLEAN NOT NULL,
    checked_by UUID,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    device_info JSONB,
    sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('pending', 'synced', 'failed'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_checklist_log_record ON checklist_log(record_type, record_id);
CREATE INDEX IF NOT EXISTS idx_checklist_log_checked_at ON checklist_log(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_checklist_log_checked_by ON checklist_log(checked_by);
CREATE INDEX IF NOT EXISTS idx_checklist_log_sync_status ON checklist_log(sync_status) WHERE sync_status != 'synced';

-- 4. TRIGGERS PARA LOG DE CHECKLIST
-- ================================================

-- Trigger para log de MealRecord
CREATE OR REPLACE FUNCTION log_mealrecord_check()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.checked IS DISTINCT FROM OLD.checked THEN
        INSERT INTO checklist_log (record_type, record_id, checked, checked_by)
        VALUES ('meal', NEW.id, NEW.checked, NEW.patient_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_mealrecord_check ON mealrecord;
CREATE TRIGGER trigger_log_mealrecord_check
    AFTER UPDATE OF checked ON mealrecord
    FOR EACH ROW
    EXECUTE FUNCTION log_mealrecord_check();

-- Trigger para log de WorkoutRecord
CREATE OR REPLACE FUNCTION log_workoutrecord_check()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.checked IS DISTINCT FROM OLD.checked THEN
        INSERT INTO checklist_log (record_type, record_id, checked, checked_by)
        VALUES ('workout', NEW.id, NEW.checked, NEW.patient_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_workoutrecord_check ON workoutrecord;
CREATE TRIGGER trigger_log_workoutrecord_check
    AFTER UPDATE OF checked ON workoutrecord
    FOR EACH ROW
    EXECUTE FUNCTION log_workoutrecord_check();

-- 5. FUNÇÕES PARA ESTATÍSTICAS DE CHECKLIST
-- ================================================

-- Função para obter estatísticas de conclusão
CREATE OR REPLACE FUNCTION get_completion_stats(p_patient_id UUID, p_start_date DATE, p_end_date DATE)
RETURNS TABLE(
    total_meals INTEGER,
    completed_meals INTEGER,
    total_workouts INTEGER,
    completed_workouts INTEGER,
    completion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM mealrecord 
         WHERE patient_id = p_patient_id AND date BETWEEN p_start_date AND p_end_date) as total_meals,
        (SELECT COUNT(*)::INTEGER FROM mealrecord 
         WHERE patient_id = p_patient_id AND date BETWEEN p_start_date AND p_end_date AND checked = true) as completed_meals,
        (SELECT COUNT(*)::INTEGER FROM workoutrecord 
         WHERE patient_id = p_patient_id AND date BETWEEN p_start_date AND p_end_date) as total_workouts,
        (SELECT COUNT(*)::INTEGER FROM workoutrecord 
         WHERE patient_id = p_patient_id AND date BETWEEN p_start_date AND p_end_date AND checked = true) as completed_workouts,
        CASE 
            WHEN (SELECT COUNT(*) FROM mealrecord WHERE patient_id = p_patient_id AND date BETWEEN p_start_date AND p_end_date) + 
                 (SELECT COUNT(*) FROM workoutrecord WHERE patient_id = p_patient_id AND date BETWEEN p_start_date AND p_end_date) = 0 
            THEN 0
            ELSE ROUND(
                (
                    (SELECT COUNT(*)::NUMERIC FROM mealrecord WHERE patient_id = p_patient_id AND date BETWEEN p_start_date AND p_end_date AND checked = true) +
                    (SELECT COUNT(*)::NUMERIC FROM workoutrecord WHERE patient_id = p_patient_id AND date BETWEEN p_start_date AND p_end_date AND checked = true)
                ) / (
                    (SELECT COUNT(*)::NUMERIC FROM mealrecord WHERE patient_id = p_patient_id AND date BETWEEN p_start_date AND p_end_date) +
                    (SELECT COUNT(*)::NUMERIC FROM workoutrecord WHERE patient_id = p_patient_id AND date BETWEEN p_start_date AND p_end_date)
                ) * 100, 2
            )
        END as completion_rate;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar sincronização pendente
CREATE OR REPLACE FUNCTION get_pending_sync_count(p_patient_id UUID)
RETURNS INTEGER AS $$
DECLARE
    pending_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO pending_count
    FROM checklist_log
    WHERE checked_by = p_patient_id 
      AND sync_status = 'pending';
    
    RETURN pending_count;
END;
$$ LANGUAGE plpgsql;

-- 6. VIEW PARA HISTÓRICO DE CHECKLIST
-- ================================================

CREATE OR REPLACE VIEW checklist_history AS
SELECT 
    cl.id,
    cl.record_type,
    cl.record_id,
    cl.checked,
    cl.checked_at,
    cl.sync_status,
    p.name as patient_name,
    CASE 
        WHEN cl.record_type = 'meal' THEN mr.name
        WHEN cl.record_type = 'workout' THEN wr.description
    END as record_description,
    CASE 
        WHEN cl.record_type = 'meal' THEN mr.date
        WHEN cl.record_type = 'workout' THEN wr.date
    END as record_date
FROM checklist_log cl
LEFT JOIN patient p ON cl.checked_by = p.id
LEFT JOIN mealrecord mr ON cl.record_type = 'meal' AND cl.record_id = mr.id
LEFT JOIN workoutrecord wr ON cl.record_type = 'workout' AND cl.record_id = wr.id
ORDER BY cl.checked_at DESC;

-- 7. FUNÇÃO PARA DETECTAR INCONSISTÊNCIAS
-- ================================================

CREATE OR REPLACE FUNCTION detect_checklist_inconsistencies()
RETURNS TABLE(
    record_type VARCHAR,
    record_id UUID,
    current_state BOOLEAN,
    last_log_state BOOLEAN,
    inconsistent BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH latest_logs AS (
        SELECT DISTINCT ON (record_type, record_id)
            cl.record_type,
            cl.record_id,
            cl.checked
        FROM checklist_log cl
        ORDER BY cl.record_type, cl.record_id, cl.checked_at DESC
    )
    SELECT 
        'meal'::VARCHAR as record_type,
        mr.id as record_id,
        mr.checked as current_state,
        ll.checked as last_log_state,
        (mr.checked IS DISTINCT FROM ll.checked) as inconsistent
    FROM mealrecord mr
    LEFT JOIN latest_logs ll ON ll.record_type = 'meal' AND ll.record_id = mr.id
    WHERE mr.checked IS DISTINCT FROM ll.checked
    
    UNION ALL
    
    SELECT 
        'workout'::VARCHAR as record_type,
        wr.id as record_id,
        wr.checked as current_state,
        ll.checked as last_log_state,
        (wr.checked IS DISTINCT FROM ll.checked) as inconsistent
    FROM workoutrecord wr
    LEFT JOIN latest_logs ll ON ll.record_type = 'workout' AND ll.record_id = wr.id
    WHERE wr.checked IS DISTINCT FROM ll.checked;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- VERIFICAÇÃO DA INSTALAÇÃO
-- ================================================

-- Verificar colunas checked_at
SELECT 
    'Colunas checked_at criadas' as status,
    COUNT(*) as count
FROM information_schema.columns
WHERE table_name IN ('mealrecord', 'workoutrecord') 
  AND column_name = 'checked_at';

-- Verificar triggers criados
SELECT 
    'Triggers de checklist criados' as status,
    COUNT(*) as count
FROM pg_trigger
WHERE tgname LIKE '%checked%';

-- Verificar tabela de log
SELECT 
    'Tabela checklist_log criada' as status,
    EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'checklist_log') as exists;

-- Verificar índices
SELECT 
    'Índices de checklist criados' as status,
    COUNT(*) as count
FROM pg_indexes
WHERE tablename = 'checklist_log';
