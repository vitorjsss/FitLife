-- ================================
-- Script de inicialização FitLife
-- ================================

-- ----------------------------
-- Enum para user_type
-- ----------------------------
CREATE TYPE user_type_enum AS ENUM ('Patient', 'Nutricionist', 'Physical_educator');

-- ----------------------------
-- Tabela AUTH
-- ----------------------------
CREATE TABLE auth (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    user_type user_type_enum NOT NULL,
    password VARCHAR(255) NOT NULL,
    refresh_token VARCHAR(255),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ----------------------------
-- Tabela PATIENT
-- ----------------------------
CREATE TABLE patient (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    birthdate DATE NOT NULL,
    sex CHAR(1) NOT NULL,
    contact VARCHAR(50),
    avatar_path VARCHAR(255),
    auth_id INT NOT NULL UNIQUE REFERENCES auth(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ----------------------------
-- Tabela PHYSICAL_EDUCATOR
-- ----------------------------
CREATE TABLE physical_educator (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    birthdate DATE NOT NULL,
    sex CHAR(1) NOT NULL,
    contact VARCHAR(50),
    cref VARCHAR(50) NOT NULL,
    avatar_path VARCHAR(255),
    auth_id INT NOT NULL UNIQUE REFERENCES auth(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ----------------------------
-- Tabela NUTRICIONIST
-- ----------------------------
CREATE TABLE nutricionist (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    birthdate DATE NOT NULL,
    sex CHAR(1) NOT NULL,
    contact VARCHAR(50),
    crn VARCHAR(50) NOT NULL,
    avatar_path VARCHAR(255),
    auth_id INT NOT NULL UNIQUE REFERENCES auth(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ----------------------------
-- Tabela MEDIDAS_CORPORAIS
-- ----------------------------
CREATE TABLE medidas_corporais (
    id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
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
    id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    calorias INT,
    proteina FLOAT,
    carboidrato FLOAT,
    gordura FLOAT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- Dados iniciais
-- =============================

-- Usuários
INSERT INTO auth (username, email, user_type, password)
VALUES 
('patient01', 'patient01@example.com', 'Patient', 'hashed_password1'),
('nutri01', 'nutri01@example.com', 'Nutricionist', 'hashed_password2'),
('educ01', 'educ01@example.com', 'Physical_educator', 'hashed_password3');

-- Paciente vinculado ao auth
INSERT INTO patient (name, birthdate, sex, contact, auth_id)
VALUES 
('João Silva', '1990-05-12', 'M', '99999-1111', 1);

-- Nutricionista vinculado ao auth
INSERT INTO nutricionist (name, birthdate, sex, contact, crn, auth_id)
VALUES 
('Maria Costa', '1985-08-23', 'F', '98888-2222', 'CRN12345', 2);

-- Educador físico vinculado ao auth
INSERT INTO physical_educator (name, birthdate, sex, contact, cref, auth_id)
VALUES 
('Carlos Pereira', '1980-01-15', 'M', '97777-3333', 'CREF98765', 3);

-- Medidas corporais do paciente
INSERT INTO medidas_corporais (patient_id, data, peso, altura, imc, circunferencia)
VALUES 
(1, '2025-01-01', 75.0, 1.75, 24.5, 90.0);

-- Medidas nutricionais do paciente
INSERT INTO medidas_nutricionais (patient_id, data, calorias, proteina, carboidrato, gordura)
VALUES
(1, '2025-01-01', 2200, 120.0, 250.0, 70.0);