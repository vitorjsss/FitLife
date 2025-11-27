-- Adiciona colunas para sistema de recuperação de senha com 2FA
-- Data: 2025-11-27
-- Descrição: Adiciona twofa_code e twofa_expires_at na tabela auth

-- Verifica se as colunas já existem antes de criar
DO $$
BEGIN
    -- Adiciona coluna twofa_code se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='auth' AND column_name='twofa_code'
    ) THEN
        ALTER TABLE auth ADD COLUMN twofa_code VARCHAR(6);
        RAISE NOTICE 'Coluna twofa_code criada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna twofa_code já existe';
    END IF;

    -- Adiciona coluna twofa_expires_at se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='auth' AND column_name='twofa_expires_at'
    ) THEN
        ALTER TABLE auth ADD COLUMN twofa_expires_at TIMESTAMP;
        RAISE NOTICE 'Coluna twofa_expires_at criada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna twofa_expires_at já existe';
    END IF;
END
$$;

-- Adiciona índice para melhorar performance nas buscas por código
CREATE INDEX IF NOT EXISTS idx_auth_twofa_code ON auth(twofa_code) WHERE twofa_code IS NOT NULL;

-- Adiciona índice para melhorar performance nas verificações de expiração
CREATE INDEX IF NOT EXISTS idx_auth_twofa_expires ON auth(twofa_expires_at) WHERE twofa_expires_at IS NOT NULL;

-- Comentários nas colunas
COMMENT ON COLUMN auth.twofa_code IS 'Código de 6 dígitos para recuperação de senha (válido por 15 minutos)';
COMMENT ON COLUMN auth.twofa_expires_at IS 'Timestamp de expiração do código 2FA';

-- Confirmação
SELECT 'Migration add-2fa-columns.sql executada com sucesso!' AS status;
