-- ================================================
-- MITIGAÇÃO RISCO 8: ATUALIZAÇÃO DAS REFEIÇÕES
-- Sistema: FitLife
-- Data: 14/11/2025
-- Objetivo: Garantir persistência de alterações em refeições
-- ================================================

-- 1. CONSTRAINTS PARA AUDITORIA DE ALTERAÇÕES
-- ================================================

-- Adicionar coluna updated_at se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mealrecord' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE mealrecord ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mealitem' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE mealitem ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Adicionar coluna version para controle de concorrência otimista
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mealrecord' AND column_name = 'version'
    ) THEN
        ALTER TABLE mealrecord ADD COLUMN version INTEGER DEFAULT 1;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mealitem' AND column_name = 'version'
    ) THEN
        ALTER TABLE mealitem ADD COLUMN version INTEGER DEFAULT 1;
    END IF;
END $$;

-- 2. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA DE TIMESTAMPS
-- ================================================

-- Trigger para atualizar updated_at em MealRecord
CREATE OR REPLACE FUNCTION update_mealrecord_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_mealrecord_timestamp ON mealrecord;
CREATE TRIGGER trigger_update_mealrecord_timestamp
    BEFORE UPDATE ON mealrecord
    FOR EACH ROW
    EXECUTE FUNCTION update_mealrecord_timestamp();

-- Trigger para atualizar updated_at em MealItem
CREATE OR REPLACE FUNCTION update_mealitem_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_mealitem_timestamp ON mealitem;
CREATE TRIGGER trigger_update_mealitem_timestamp
    BEFORE UPDATE ON mealitem
    FOR EACH ROW
    EXECUTE FUNCTION update_mealitem_timestamp();

-- 3. TABELA DE AUDITORIA PARA RASTREAMENTO DE ALTERAÇÕES
-- ================================================

CREATE TABLE IF NOT EXISTS meal_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by UUID,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transaction_id BIGINT DEFAULT txid_current()
);

-- Índices para performance de consultas de auditoria
CREATE INDEX IF NOT EXISTS idx_meal_audit_table_record ON meal_audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_meal_audit_changed_at ON meal_audit_log(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_meal_audit_transaction ON meal_audit_log(transaction_id);

-- 4. TRIGGERS DE AUDITORIA PARA MEALRECORD
-- ================================================

CREATE OR REPLACE FUNCTION audit_mealrecord_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO meal_audit_log (table_name, record_id, operation, old_data, new_data, changed_by)
        VALUES (
            'mealrecord',
            NEW.id,
            'UPDATE',
            row_to_json(OLD)::JSONB,
            row_to_json(NEW)::JSONB,
            NEW.patient_id
        );
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO meal_audit_log (table_name, record_id, operation, new_data, changed_by)
        VALUES (
            'mealrecord',
            NEW.id,
            'INSERT',
            row_to_json(NEW)::JSONB,
            NEW.patient_id
        );
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO meal_audit_log (table_name, record_id, operation, old_data, changed_by)
        VALUES (
            'mealrecord',
            OLD.id,
            'DELETE',
            row_to_json(OLD)::JSONB,
            OLD.patient_id
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_audit_mealrecord ON mealrecord;
CREATE TRIGGER trigger_audit_mealrecord
    AFTER INSERT OR UPDATE OR DELETE ON mealrecord
    FOR EACH ROW
    EXECUTE FUNCTION audit_mealrecord_changes();

-- 5. TRIGGERS DE AUDITORIA PARA MEALITEM
-- ================================================

CREATE OR REPLACE FUNCTION audit_mealitem_changes()
RETURNS TRIGGER AS $$
DECLARE
    patient_id_val UUID;
BEGIN
    -- Buscar o patient_id da refeição relacionada
    IF (TG_OP = 'DELETE') THEN
        SELECT patient_id INTO patient_id_val FROM mealrecord WHERE id = OLD.meal_record_id;
    ELSE
        SELECT patient_id INTO patient_id_val FROM mealrecord WHERE id = NEW.meal_record_id;
    END IF;

    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO meal_audit_log (table_name, record_id, operation, old_data, new_data, changed_by)
        VALUES (
            'mealitem',
            NEW.id,
            'UPDATE',
            row_to_json(OLD)::JSONB,
            row_to_json(NEW)::JSONB,
            patient_id_val
        );
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO meal_audit_log (table_name, record_id, operation, new_data, changed_by)
        VALUES (
            'mealitem',
            NEW.id,
            'INSERT',
            row_to_json(NEW)::JSONB,
            patient_id_val
        );
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO meal_audit_log (table_name, record_id, operation, old_data, changed_by)
        VALUES (
            'mealitem',
            OLD.id,
            'DELETE',
            row_to_json(OLD)::JSONB,
            patient_id_val
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_audit_mealitem ON mealitem;
CREATE TRIGGER trigger_audit_mealitem
    AFTER INSERT OR UPDATE OR DELETE ON mealitem
    FOR EACH ROW
    EXECUTE FUNCTION audit_mealitem_changes();

-- 6. FUNÇÃO PARA VERIFICAR INTEGRIDADE DE TRANSAÇÕES
-- ================================================

CREATE OR REPLACE FUNCTION verify_transaction_integrity(p_transaction_id BIGINT)
RETURNS TABLE(
    is_complete BOOLEAN,
    operations_count INTEGER,
    affected_tables TEXT[],
    timestamp_range TSRANGE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) > 0 as is_complete,
        COUNT(*)::INTEGER as operations_count,
        ARRAY_AGG(DISTINCT table_name) as affected_tables,
        TSRANGE(MIN(changed_at), MAX(changed_at)) as timestamp_range
    FROM meal_audit_log
    WHERE transaction_id = p_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- 7. VIEW PARA HISTÓRICO DE ALTERAÇÕES
-- ================================================

CREATE OR REPLACE VIEW meal_change_history AS
SELECT 
    mal.id,
    mal.table_name,
    mal.record_id,
    mal.operation,
    mal.old_data,
    mal.new_data,
    mal.changed_at,
    mal.transaction_id,
    p.name as patient_name,
    p.email as patient_email
FROM meal_audit_log mal
LEFT JOIN patient p ON mal.changed_by = p.id
ORDER BY mal.changed_at DESC;

-- 8. FUNÇÃO PARA ROLLBACK DE ALTERAÇÕES (RECOVERY)
-- ================================================

CREATE OR REPLACE FUNCTION rollback_meal_changes(p_transaction_id BIGINT)
RETURNS TABLE(
    rolled_back_count INTEGER,
    status TEXT
) AS $$
DECLARE
    audit_record RECORD;
    rollback_count INTEGER := 0;
BEGIN
    -- Reverter alterações em ordem inversa
    FOR audit_record IN 
        SELECT * FROM meal_audit_log 
        WHERE transaction_id = p_transaction_id 
        ORDER BY changed_at DESC
    LOOP
        IF audit_record.table_name = 'mealrecord' AND audit_record.operation = 'UPDATE' THEN
            -- Restaurar valores antigos do MealRecord
            EXECUTE format('UPDATE mealrecord SET 
                meal_name = $1, 
                meal_date = $2, 
                checked = $3,
                updated_at = $4
                WHERE id = $5',
                audit_record.old_data->>'meal_name',
                (audit_record.old_data->>'meal_date')::DATE,
                (audit_record.old_data->>'checked')::BOOLEAN,
                (audit_record.old_data->>'updated_at')::TIMESTAMP,
                audit_record.record_id
            );
            rollback_count := rollback_count + 1;
        ELSIF audit_record.table_name = 'mealitem' AND audit_record.operation = 'UPDATE' THEN
            -- Restaurar valores antigos do MealItem
            EXECUTE format('UPDATE mealitem SET 
                food_name = $1, 
                calories = $2, 
                proteins = $3,
                carbs = $4,
                fats = $5,
                updated_at = $6
                WHERE id = $7',
                audit_record.old_data->>'food_name',
                (audit_record.old_data->>'calories')::NUMERIC,
                (audit_record.old_data->>'proteins')::NUMERIC,
                (audit_record.old_data->>'carbs')::NUMERIC,
                (audit_record.old_data->>'fats')::NUMERIC,
                (audit_record.old_data->>'updated_at')::TIMESTAMP,
                audit_record.record_id
            );
            rollback_count := rollback_count + 1;
        END IF;
    END LOOP;

    RETURN QUERY SELECT rollback_count, 'SUCCESS'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- VERIFICAÇÃO DA INSTALAÇÃO
-- ================================================

-- Verificar colunas adicionadas
SELECT 
    'Colunas updated_at e version criadas' as status,
    COUNT(*) as count
FROM information_schema.columns
WHERE table_name IN ('mealrecord', 'mealitem') 
  AND column_name IN ('updated_at', 'version');

-- Verificar triggers criados
SELECT 
    'Triggers de atualização criados' as status,
    COUNT(*) as count
FROM pg_trigger
WHERE tgname LIKE '%update_meal%' OR tgname LIKE '%audit_meal%';

-- Verificar tabela de auditoria
SELECT 
    'Tabela meal_audit_log criada' as status,
    EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'meal_audit_log') as exists;
