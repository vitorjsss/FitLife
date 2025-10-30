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
-- Enum para tipos de exercício
-- ----------------------------
CREATE TYPE exercise_type_enum AS ENUM (
    'forca',
    'cardio',
    'flexibilidade',
    'esporte',
    'funcional',
    'outro'
);

-- ----------------------------
-- Tabela WORKOUT (Treinos)
-- ----------------------------
CREATE TABLE workout (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    physical_educator_id UUID REFERENCES physical_educator(id)
);

-- ----------------------------
-- Tabela WORKOUT_EXERCISE (Exercícios do Treino)
-- ----------------------------
CREATE TABLE workout_exercise (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    exercise_type exercise_type_enum DEFAULT 'outro',
    carga FLOAT DEFAULT 0,
    series INTEGER NOT NULL,
    repeticoes INTEGER NOT NULL,
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    workout_id UUID NOT NULL REFERENCES workout(id) ON DELETE CASCADE
);

-- ----------------------------
-- Tabela WORKOUT_SESSION (Sessão de Treino - Histórico de execução)
-- ----------------------------
CREATE TABLE workout_session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID NOT NULL REFERENCES workout(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    notes TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ----------------------------
-- Tabela WORKOUT_EXERCISE_LOG (Checklist - Exercícios completados)
-- ----------------------------
CREATE TABLE workout_exercise_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_session_id UUID NOT NULL REFERENCES workout_session(id) ON DELETE CASCADE,
    workout_exercise_id UUID NOT NULL REFERENCES workout_exercise(id) ON DELETE CASCADE,
    series_completed INTEGER DEFAULT 0,
    repeticoes_completed INTEGER DEFAULT 0,
    carga_used FLOAT DEFAULT 0,
    checked BOOLEAN NOT NULL DEFAULT FALSE,
    completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_workout_session_patient ON workout_session(patient_id);
CREATE INDEX idx_workout_session_date ON workout_session(session_date);
CREATE INDEX idx_workout_exercise_log_session ON workout_exercise_log(workout_session_id);

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
-- Tabela DAILY_MEAL_REGISTRY
-- ----------------------------

CREATE TABLE DailyMealRegistry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    patient_id UUID NOT NULL REFERENCES patient(id)
);

-- ----------------------------
-- Tabela MEAL_RECORD
-- ----------------------------

CREATE TABLE MealRecord (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    icon_path VARCHAR(500),
    checked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    daily_meal_registry_id UUID NOT NULL,
    CONSTRAINT fk_mealrecord_registry FOREIGN KEY (daily_meal_registry_id)
        REFERENCES DailyMealRegistry(id) ON DELETE CASCADE
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
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    meal_id UUID NOT NULL,
    CONSTRAINT fk_mealitem_meal FOREIGN KEY (meal_id)
        REFERENCES MealRecord(id) ON DELETE CASCADE
);