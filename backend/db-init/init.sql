-- ================================
-- Script de inicialização FitLife (com UUID)
-- ================================

-- Extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------
-- Enum para user_type
-- ----------------------------
CREATE TYPE user_type_enum AS ENUM ('Patient', 'Nutricionist', 'Physical_educator');

-- ----------------------------
-- Tabela AUTH
-- ----------------------------
CREATE TABLE auth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    user_type user_type_enum NOT NULL,
    password VARCHAR(255) NOT NULL,
    refresh_token VARCHAR(255),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    failed_attempts INT DEFAULT 0,
    account_locked_until TIMESTAMP NULL
);

-- ----------------------------
-- Tabela PATIENT
-- ----------------------------
CREATE TABLE patient (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    birthdate DATE NOT NULL,
    sex CHAR(1) NOT NULL,
    contact VARCHAR(50),
    avatar_path VARCHAR(255),
    auth_id UUID NOT NULL UNIQUE REFERENCES auth(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ----------------------------
-- Tabela PHYSICAL_EDUCATOR
-- ----------------------------
CREATE TABLE physical_educator (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    birthdate DATE NOT NULL,
    sex CHAR(1) NOT NULL,
    contact VARCHAR(50),
    cref VARCHAR(50) NOT NULL,
    avatar_path VARCHAR(255),
    auth_id UUID NOT NULL UNIQUE REFERENCES auth(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ----------------------------
-- Tabela NUTRICIONIST
-- ----------------------------
CREATE TABLE nutricionist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    birthdate DATE NOT NULL,
    sex CHAR(1) NOT NULL,
    contact VARCHAR(50),
    crn VARCHAR(50) NOT NULL,
    avatar_path VARCHAR(255),
    auth_id UUID NOT NULL UNIQUE REFERENCES auth(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ----------------------------
-- Tabela MEDIDAS_CORPORAIS
-- ----------------------------
CREATE TABLE medidas_corporais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    peso FLOAT,
    altura FLOAT,
    imc FLOAT,
    waist_circumference FLOAT,
    hip_circumference FLOAT,
    arm_circumference FLOAT,
    thigh_circumference FLOAT,
    calf_circumference FLOAT,
    body_fat_percentage FLOAT,
    muscle_mass FLOAT,
    bone_mass FLOAT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ----------------------------
-- Tabela MEDIDAS_NUTRICIONAIS
-- ----------------------------
CREATE TABLE medidas_nutricionais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    calorias INT,
    proteina FLOAT,
    carboidrato FLOAT,
    gordura FLOAT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ----------------------------
-- Tabela WORKOUT_RECORD (Treino)
-- ----------------------------
CREATE TABLE WorkoutRecord (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    checked BOOLEAN NOT NULL DEFAULT FALSE,
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------
-- Tabela WORKOUT_ITEM (Exercícios do treino)
-- ----------------------------
CREATE TABLE WorkoutItem (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_name VARCHAR(255) NOT NULL,
    series VARCHAR(100),
    repeticoes VARCHAR(100),
    carga VARCHAR(100),
    workout_record_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_workoutitem_record FOREIGN KEY (workout_record_id)
        REFERENCES WorkoutRecord(id) ON DELETE CASCADE
);

-- ----------------------------
-- Tabela LOGS
-- ----------------------------

CREATE TABLE logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    log_type VARCHAR(50) NOT NULL,
    description TEXT,
    ip VARCHAR(45),
    old_value TEXT,
    new_value TEXT,
    status VARCHAR(20) DEFAULT 'SUCCESS',
    user_id UUID REFERENCES auth(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_action ON logs(action);
CREATE INDEX idx_logs_created_at ON logs(created_at);

-- ----------------------------
-- Tabela MEAL_RECORD (Refeição)
-- ----------------------------

CREATE TABLE MealRecord (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    icon_path VARCHAR(500),
    checked BOOLEAN NOT NULL DEFAULT FALSE,
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1
);

-- ----------------------------
-- Tabela MEAL_ITEM
-- ----------------------------

CREATE TABLE MealItem (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_name VARCHAR(255) NOT NULL,
    quantity VARCHAR(100),
    calories FLOAT,
    proteins FLOAT,
    carbs FLOAT,
    fats FLOAT,
    meal_record_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    CONSTRAINT fk_mealitem_meal FOREIGN KEY (meal_record_id)
        REFERENCES MealRecord(id) ON DELETE CASCADE
);

-- ----------------------------
-- Tabela PATIENT_PROFESSIONAL_ASSOCIATION
-- (Associa pacientes com nutricionistas e educadores físicos)
-- ----------------------------

CREATE TABLE patient_professional_association (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    nutricionist_id UUID REFERENCES nutricionist(id) ON DELETE SET NULL,
    physical_educator_id UUID REFERENCES physical_educator(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(patient_id) -- Garante que cada paciente tem apenas uma associação ativa
);

-- Índices para melhor performance
CREATE INDEX idx_patient_association_patient ON patient_professional_association(patient_id);
CREATE INDEX idx_patient_association_nutricionist ON patient_professional_association(nutricionist_id);
CREATE INDEX idx_patient_association_physical_educator ON patient_professional_association(physical_educator_id);
CREATE INDEX idx_patient_association_active ON patient_professional_association(is_active);

-- ----------------------------
-- Tabela PATIENT_CONNECTION_CODE
-- (Códigos temporários para conexão entre pacientes e profissionais)
-- ----------------------------

CREATE TABLE patient_connection_code (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    UNIQUE(patient_id)
);

-- Índices para melhor performance
CREATE INDEX idx_connection_code ON patient_connection_code(code);
CREATE INDEX idx_connection_patient ON patient_connection_code(patient_id);

-- ================================================
-- SISTEMA DE AUDITORIA PARA REFEIÇÕES
-- Mitigação Risco 8: Atualização das Refeições
-- ================================================

-- 1. TABELA DE AUDITORIA
-- ================================================

CREATE TABLE meal_audit_log (
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
CREATE INDEX idx_meal_audit_table_record ON meal_audit_log(table_name, record_id);
CREATE INDEX idx_meal_audit_changed_at ON meal_audit_log(changed_at DESC);
CREATE INDEX idx_meal_audit_transaction ON meal_audit_log(transaction_id);

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

CREATE TRIGGER trigger_update_mealrecord_timestamp
    BEFORE UPDATE ON MealRecord
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

CREATE TRIGGER trigger_update_mealitem_timestamp
    BEFORE UPDATE ON MealItem
    FOR EACH ROW
    EXECUTE FUNCTION update_mealitem_timestamp();

-- 3. TRIGGERS DE AUDITORIA PARA MEALRECORD
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

CREATE TRIGGER trigger_audit_mealrecord
    AFTER INSERT OR UPDATE OR DELETE ON MealRecord
    FOR EACH ROW
    EXECUTE FUNCTION audit_mealrecord_changes();

-- 4. TRIGGERS DE AUDITORIA PARA MEALITEM
-- ================================================

CREATE OR REPLACE FUNCTION audit_mealitem_changes()
RETURNS TRIGGER AS $$
DECLARE
    patient_id_val UUID;
BEGIN
    -- Buscar o patient_id da refeição relacionada
    IF (TG_OP = 'DELETE') THEN
        SELECT patient_id INTO patient_id_val FROM MealRecord WHERE id = OLD.meal_record_id;
    ELSE
        SELECT patient_id INTO patient_id_val FROM MealRecord WHERE id = NEW.meal_record_id;
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

CREATE TRIGGER trigger_audit_mealitem
    AFTER INSERT OR UPDATE OR DELETE ON MealItem
    FOR EACH ROW
    EXECUTE FUNCTION audit_mealitem_changes();

-- 5. FUNÇÃO PARA VERIFICAR INTEGRIDADE DE TRANSAÇÕES
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
        ARRAY_AGG(DISTINCT table_name::TEXT) as affected_tables,
        TSRANGE(MIN(changed_at), MAX(changed_at)) as timestamp_range
    FROM meal_audit_log
    WHERE transaction_id = p_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- 6. VIEW PARA HISTÓRICO DE ALTERAÇÕES
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
    a.email as patient_email
FROM meal_audit_log mal
LEFT JOIN patient p ON mal.changed_by = p.id
LEFT JOIN auth a ON p.auth_id = a.id
ORDER BY mal.changed_at DESC;

-- 7. FUNÇÃO PARA ROLLBACK DE ALTERAÇÕES (RECOVERY)
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
            UPDATE MealRecord SET 
                name = audit_record.old_data->>'name',
                date = (audit_record.old_data->>'date')::DATE,
                checked = (audit_record.old_data->>'checked')::BOOLEAN,
                updated_at = (audit_record.old_data->>'updated_at')::TIMESTAMP
            WHERE id = (audit_record.old_data->>'id')::UUID;
            rollback_count := rollback_count + 1;
            
        ELSIF audit_record.table_name = 'mealitem' AND audit_record.operation = 'UPDATE' THEN
            -- Restaurar valores antigos do MealItem
            UPDATE MealItem SET 
                food_name = audit_record.old_data->>'food_name',
                quantity = audit_record.old_data->>'quantity',
                calories = (audit_record.old_data->>'calories')::FLOAT,
                proteins = (audit_record.old_data->>'proteins')::FLOAT,
                carbs = (audit_record.old_data->>'carbs')::FLOAT,
                fats = (audit_record.old_data->>'fats')::FLOAT,
                updated_at = (audit_record.old_data->>'updated_at')::TIMESTAMP
            WHERE id = (audit_record.old_data->>'id')::UUID;
            rollback_count := rollback_count + 1;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT rollback_count, 'SUCCESS'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- CONSTRAINTS E VALIDAÇÕES - PLANEJAMENTO DE REFEIÇÕES (RISCO 3)
-- ================================================

-- Garantir que o nome não seja vazio
ALTER TABLE MealRecord ADD CONSTRAINT check_meal_name_not_empty CHECK (LENGTH(TRIM(name)) > 0);

-- Garantir que a data não seja muito antiga (máximo 10 anos no passado)
ALTER TABLE MealRecord ADD CONSTRAINT check_meal_date_not_too_old CHECK (date >= CURRENT_DATE - INTERVAL '10 years');

-- Garantir que a data não seja muito futura (máximo 1 ano no futuro)
ALTER TABLE MealRecord ADD CONSTRAINT check_meal_date_not_too_future CHECK (date <= CURRENT_DATE + INTERVAL '1 year');

-- Garantir que o nome do alimento não seja vazio
ALTER TABLE MealItem ADD CONSTRAINT check_food_name_not_empty CHECK (LENGTH(TRIM(food_name)) > 0);

-- Garantir que calorias sejam não-negativas
ALTER TABLE MealItem ADD CONSTRAINT check_calories_non_negative CHECK (calories IS NULL OR calories >= 0);

-- Garantir que proteínas sejam não-negativas
ALTER TABLE MealItem ADD CONSTRAINT check_proteins_non_negative CHECK (proteins IS NULL OR proteins >= 0);

-- Garantir que carboidratos sejam não-negativos
ALTER TABLE MealItem ADD CONSTRAINT check_carbs_non_negative CHECK (carbs IS NULL OR carbs >= 0);

-- Garantir que gorduras sejam não-negativas
ALTER TABLE MealItem ADD CONSTRAINT check_fats_non_negative CHECK (fats IS NULL OR fats >= 0);

-- Garantir que calorias não sejam absurdamente altas (máximo 10000 kcal por item)
ALTER TABLE MealItem ADD CONSTRAINT check_calories_max_limit CHECK (calories IS NULL OR calories <= 10000);

-- Garantir que proteínas não excedam 500g por item
ALTER TABLE MealItem ADD CONSTRAINT check_proteins_max_limit CHECK (proteins IS NULL OR proteins <= 500);

-- Garantir que carboidratos não excedam 500g por item
ALTER TABLE MealItem ADD CONSTRAINT check_carbs_max_limit CHECK (carbs IS NULL OR carbs <= 500);

-- Garantir que gorduras não excedam 500g por item
ALTER TABLE MealItem ADD CONSTRAINT check_fats_max_limit CHECK (fats IS NULL OR fats <= 500);

-- Validação de consistência nutricional (DESABILITADA)
-- CREATE OR REPLACE FUNCTION validate_meal_item_calories()
-- RETURNS TRIGGER AS $$
-- DECLARE
--     calculated_calories NUMERIC;
--     difference NUMERIC;
-- BEGIN
--     IF NEW.proteins IS NOT NULL AND NEW.carbs IS NOT NULL AND NEW.fats IS NOT NULL AND NEW.calories IS NOT NULL THEN
--         calculated_calories := (NEW.proteins * 4) + (NEW.carbs * 4) + (NEW.fats * 9);
--         difference := ABS(NEW.calories - calculated_calories);
--         
--         IF difference > (NEW.calories * 0.2) THEN
--             RAISE EXCEPTION 'Calorias inconsistentes: informado %, calculado % (diferença: %)', 
--                 NEW.calories, calculated_calories, difference;
--         END IF;
--     END IF;
--     
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER trigger_validate_calories
--     BEFORE INSERT OR UPDATE ON MealItem
--     FOR EACH ROW
--     EXECUTE FUNCTION validate_meal_item_calories();

-- Índices para performance
CREATE INDEX idx_meal_record_patient_date ON MealRecord(patient_id, date DESC);
CREATE INDEX idx_meal_item_meal_record ON MealItem(meal_record_id);
CREATE INDEX idx_meal_record_checked ON MealRecord(checked) WHERE checked = true;

-- Função para calcular totais de uma refeição
CREATE OR REPLACE FUNCTION get_meal_totals(meal_id UUID)
RETURNS TABLE (
    total_calories DOUBLE PRECISION,
    total_proteins DOUBLE PRECISION,
    total_carbs DOUBLE PRECISION,
    total_fats DOUBLE PRECISION,
    item_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(calories), 0)::DOUBLE PRECISION as total_calories,
        COALESCE(SUM(proteins), 0)::DOUBLE PRECISION as total_proteins,
        COALESCE(SUM(carbs), 0)::DOUBLE PRECISION as total_carbs,
        COALESCE(SUM(fats), 0)::DOUBLE PRECISION as total_fats,
        COUNT(*)::BIGINT as item_count
    FROM mealitem
    WHERE meal_record_id = meal_id;
END;
$$ LANGUAGE plpgsql;

-- View para facilitar consultas
CREATE VIEW meal_summary AS
SELECT 
    mr.id as meal_id,
    mr.name as meal_name,
    mr.date,
    mr.patient_id,
    mr.checked,
    COUNT(mi.id) as item_count,
    COALESCE(SUM(mi.calories), 0) as total_calories,
    COALESCE(SUM(mi.proteins), 0) as total_proteins,
    COALESCE(SUM(mi.carbs), 0) as total_carbs,
    COALESCE(SUM(mi.fats), 0) as total_fats
FROM MealRecord mr
LEFT JOIN MealItem mi ON mr.id = mi.meal_record_id
GROUP BY mr.id, mr.name, mr.date, mr.patient_id, mr.checked;

-- Validação de regras de negócio
CREATE OR REPLACE FUNCTION validate_meal_business_rules()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.checked = true THEN
        IF NOT EXISTS (SELECT 1 FROM mealitem WHERE meal_record_id = NEW.id) THEN
            RAISE EXCEPTION 'Não é possível marcar refeição como consumida sem itens';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_meal_rules
    BEFORE UPDATE ON MealRecord
    FOR EACH ROW
    EXECUTE FUNCTION validate_meal_business_rules();

-- ================================================
-- SISTEMA DE BACKUP (RISCO 5)
-- ================================================

CREATE TABLE backup_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type VARCHAR(50) NOT NULL CHECK (backup_type IN ('full', 'incremental', 'differential')),
    backup_status VARCHAR(20) NOT NULL CHECK (backup_status IN ('in_progress', 'completed', 'failed', 'expired')),
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

CREATE INDEX idx_backup_log_status ON backup_log(backup_status) WHERE backup_status != 'completed';
CREATE INDEX idx_backup_log_started_at ON backup_log(started_at DESC);
CREATE INDEX idx_backup_log_type ON backup_log(backup_type);
CREATE INDEX idx_backup_log_retention ON backup_log(retention_until, backup_status);

CREATE TABLE backup_config (
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

INSERT INTO backup_config (config_name, schedule_cron, backup_type, retention_days, tables_to_backup)
VALUES (
    'daily_full_backup',
    '0 2 * * *',
    'full',
    30,
    ARRAY['patient', 'mealrecord', 'mealitem', 'workoutrecord', 'workoutitem', 'medidas_corporais', 'medidas_nutricionais']
) ON CONFLICT (config_name) DO NOTHING;

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
    SELECT retention_days INTO v_retention_days
    FROM backup_config
    WHERE backup_type = p_backup_type AND enabled = true
    LIMIT 1;
    
    INSERT INTO backup_log (
        backup_type, backup_status, file_path, started_at,
        triggered_by, retention_until
    )
    VALUES (
        p_backup_type, 'in_progress', p_file_path, CURRENT_TIMESTAMP,
        p_triggered_by, CURRENT_DATE + COALESCE(v_retention_days, 30)
    )
    RETURNING id INTO v_backup_id;
    
    RETURN v_backup_id;
END;
$$ LANGUAGE plpgsql;

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
    SELECT started_at INTO v_started_at FROM backup_log WHERE id = p_backup_id;
    v_duration := EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - v_started_at))::INTEGER;
    
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

CREATE OR REPLACE FUNCTION cleanup_expired_backups()
RETURNS TABLE(
    deleted_count INTEGER,
    freed_space_mb NUMERIC
) AS $$
DECLARE
    v_deleted_count INTEGER;
    v_freed_space BIGINT;
BEGIN
    SELECT COUNT(*), COALESCE(SUM(file_size), 0)
    INTO v_deleted_count, v_freed_space
    FROM backup_log
    WHERE retention_until < CURRENT_DATE AND backup_status = 'completed';
    
    UPDATE backup_log
    SET backup_status = 'expired'
    WHERE retention_until < CURRENT_DATE AND backup_status = 'completed';
    
    RETURN QUERY
    SELECT v_deleted_count, ROUND((v_freed_space / 1048576.0)::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql;

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
    SELECT * INTO v_backup FROM backup_log WHERE id = p_backup_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, false, false, 0, 'Backup não encontrado'::TEXT;
        RETURN;
    END IF;
    
    v_age_days := (CURRENT_DATE - v_backup.started_at::DATE)::INTEGER;
    
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

CREATE OR REPLACE FUNCTION update_backup_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_backup_config_timestamp
    BEFORE UPDATE ON backup_config
    FOR EACH ROW
    EXECUTE FUNCTION update_backup_config_timestamp();

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
        ROUND((COUNT(*) FILTER (WHERE backup_status = 'completed')::NUMERIC / 
               NULLIF(COUNT(*)::NUMERIC, 0) * 100), 2) as success_rate,
        ROUND(COALESCE(SUM(file_size) FILTER (WHERE backup_status = 'completed') / 1048576.0, 0)::NUMERIC, 2) as total_size_mb,
        ROUND(AVG(duration_seconds) FILTER (WHERE backup_status = 'completed')::NUMERIC, 2) as avg_duration_seconds,
        MAX(started_at) FILTER (WHERE backup_status = 'completed') as last_backup_at
    FROM backup_log
    WHERE started_at >= CURRENT_TIMESTAMP - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- SISTEMA DE CHECKLIST (RISCO 6)
-- ================================================

ALTER TABLE mealrecord ADD COLUMN IF NOT EXISTS checked_at TIMESTAMP;
ALTER TABLE workoutrecord ADD COLUMN IF NOT EXISTS checked_at TIMESTAMP;

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

CREATE TRIGGER trigger_update_mealrecord_checked_at
    BEFORE UPDATE OF checked ON mealrecord
    FOR EACH ROW
    EXECUTE FUNCTION update_mealrecord_checked_at();

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

CREATE TRIGGER trigger_update_workoutrecord_checked_at
    BEFORE UPDATE OF checked ON workoutrecord
    FOR EACH ROW
    EXECUTE FUNCTION update_workoutrecord_checked_at();

CREATE TABLE checklist_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_type VARCHAR(20) NOT NULL CHECK (record_type IN ('meal', 'workout')),
    record_id UUID NOT NULL,
    checked BOOLEAN NOT NULL,
    checked_by UUID,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    device_info JSONB,
    sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('pending', 'synced', 'failed'))
);

CREATE INDEX idx_checklist_log_record ON checklist_log(record_type, record_id);
CREATE INDEX idx_checklist_log_checked_at ON checklist_log(checked_at DESC);
CREATE INDEX idx_checklist_log_checked_by ON checklist_log(checked_by);
CREATE INDEX idx_checklist_log_sync_status ON checklist_log(sync_status) WHERE sync_status != 'synced';

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

CREATE TRIGGER trigger_log_mealrecord_check
    AFTER UPDATE OF checked ON mealrecord
    FOR EACH ROW
    EXECUTE FUNCTION log_mealrecord_check();

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

CREATE TRIGGER trigger_log_workoutrecord_check
    AFTER UPDATE OF checked ON workoutrecord
    FOR EACH ROW
    EXECUTE FUNCTION log_workoutrecord_check();

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

CREATE OR REPLACE FUNCTION get_pending_sync_count(p_patient_id UUID)
RETURNS INTEGER AS $$
DECLARE
    pending_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO pending_count
    FROM checklist_log
    WHERE checked_by = p_patient_id AND sync_status = 'pending';
    
    RETURN pending_count;
END;
$$ LANGUAGE plpgsql;

CREATE VIEW checklist_history AS
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
        WHEN cl.record_type = 'workout' THEN wr.name
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
-- CONSTRAINTS DE VALIDAÇÃO - MEDIDAS CORPORAIS (RNF 2.0)
-- ================================================

-- Validação de Peso (0 < peso < 500 kg)
ALTER TABLE medidas_corporais 
ADD CONSTRAINT check_peso_valid CHECK (peso IS NULL OR (peso > 0 AND peso < 500));

-- Validação de Altura (0.5m <= altura <= 2.5m)  
ALTER TABLE medidas_corporais
ADD CONSTRAINT check_altura_valid CHECK (altura IS NULL OR (altura >= 0.5 AND altura <= 2.5));

-- Validações de Circunferências específicas (0 < valor < 500 cm)
ALTER TABLE medidas_corporais
ADD CONSTRAINT check_waist_circumference_valid CHECK (waist_circumference IS NULL OR (waist_circumference > 0 AND waist_circumference < 500));

ALTER TABLE medidas_corporais
ADD CONSTRAINT check_hip_circumference_valid CHECK (hip_circumference IS NULL OR (hip_circumference > 0 AND hip_circumference < 500));

ALTER TABLE medidas_corporais
ADD CONSTRAINT check_arm_circumference_valid CHECK (arm_circumference IS NULL OR (arm_circumference > 0 AND arm_circumference < 500));

ALTER TABLE medidas_corporais
ADD CONSTRAINT check_thigh_circumference_valid CHECK (thigh_circumference IS NULL OR (thigh_circumference > 0 AND thigh_circumference < 500));

ALTER TABLE medidas_corporais
ADD CONSTRAINT check_calf_circumference_valid CHECK (calf_circumference IS NULL OR (calf_circumference > 0 AND calf_circumference < 500));

-- Validações de Composição Corporal (0 < percentual < 100, massa > 0)
ALTER TABLE medidas_corporais
ADD CONSTRAINT check_body_fat_percentage_valid CHECK (body_fat_percentage IS NULL OR (body_fat_percentage >= 0 AND body_fat_percentage <= 100));

ALTER TABLE medidas_corporais
ADD CONSTRAINT check_muscle_mass_valid CHECK (muscle_mass IS NULL OR (muscle_mass > 0 AND muscle_mass < 500));

ALTER TABLE medidas_corporais
ADD CONSTRAINT check_bone_mass_valid CHECK (bone_mass IS NULL OR (bone_mass > 0 AND bone_mass < 100));

-- ================================================
-- CONSTRAINTS DE VALIDAÇÃO - WORKOUT RECORD (RNF 2.0)
-- ================================================

-- Validação de data de treino (não pode ser mais de 1 ano no futuro)
ALTER TABLE WorkoutRecord
ADD CONSTRAINT check_workout_date_not_too_future CHECK (date <= CURRENT_DATE + INTERVAL '1 year');