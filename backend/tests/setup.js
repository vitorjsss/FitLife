import { pool } from '../src/config/db.js';

// Setup executado antes de todos os testes
beforeAll(async () => {
    console.log('🔧 Configurando ambiente de testes...');

    // Aguarda conexão com banco de dados
    try {
        await pool.query('SELECT NOW()');
        console.log('✅ Conectado ao banco de dados de teste');
    } catch (error) {
        console.error('❌ Erro ao conectar ao banco de dados:', error);
        throw error;
    }
});

// Cleanup executado após todos os testes
afterAll(async () => {
    console.log('🧹 Limpando ambiente de testes...');

    try {
        await pool.end();
        console.log('✅ Conexão com banco de dados encerrada');
    } catch (error) {
        console.error('❌ Erro ao encerrar conexão:', error);
    }
});

// Helper functions para testes
global.testHelpers = {
    // Criar usuário de teste
    createTestUser: async (userType = 'Patient') => {
        const authResult = await pool.query(
            `INSERT INTO auth (id, username, email, user_type, password)
             VALUES (gen_random_uuid(), $1, $2, $3, $4)
             RETURNING *`,
            [
                `test_${userType.toLowerCase()}_${Date.now()}`,
                `test_${userType.toLowerCase()}_${Date.now()}@test.com`,
                userType,
                '$2b$10$test.hash' // Hash fictício
            ]
        );
        return authResult.rows[0];
    },

    // Criar paciente de teste
    createTestPatient: async (authId) => {
        const result = await pool.query(
            `INSERT INTO patient (id, name, birthdate, sex, auth_id)
             VALUES (gen_random_uuid(), $1, $2, $3, $4)
             RETURNING *`,
            ['Paciente Teste', '1990-01-01', 'M', authId]
        );
        return result.rows[0];
    },

    // Criar nutricionista de teste
    createTestNutricionist: async (authId) => {
        const result = await pool.query(
            `INSERT INTO nutricionist (id, name, birthdate, sex, contact, crn, auth_id)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
             RETURNING *`,
            ['Nutricionista Teste', '1985-01-01', 'F', '11999999999', 'CRN12345', authId]
        );
        return result.rows[0];
    },

    // Criar educador físico de teste
    createTestPhysicalEducator: async (authId) => {
        const result = await pool.query(
            `INSERT INTO physical_educator (id, name, birthdate, sex, contact, cref, auth_id)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
             RETURNING *`,
            ['Educador Teste', '1985-01-01', 'M', '11999999999', 'CREF12345', authId]
        );
        return result.rows[0];
    },

    // Limpar dados de teste
    cleanupTestData: async (authIds = []) => {
        if (authIds.length === 0) return;

        await pool.query(
            `DELETE FROM auth WHERE id = ANY($1)`,
            [authIds]
        );
    }
};
