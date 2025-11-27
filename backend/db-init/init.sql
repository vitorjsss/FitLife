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
    circunferencia FLOAT,
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