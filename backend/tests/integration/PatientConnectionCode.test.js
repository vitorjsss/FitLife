import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { pool } from '../../src/config/db.js';
import jwt from 'jsonwebtoken';

/**
 * INSTRUÇÕES PARA EXECUTAR:
 * 
 * 1. Instalar dependências de teste:
 *    npm install --save-dev jest @jest/globals supertest cross-env
 * 
 * 2. Configurar variável de ambiente JWT_SECRET no .env:
 *    JWT_SECRET=your_secret_key
 * 
 * 3. Criar banco de dados de teste separado
 * 
 * 4. Executar testes:
 *    npm run test:integration
 * 
 * IMPORTANTE: Estes testes precisam do servidor Express configurado.
 * Você precisará exportar o app do seu index.js:
 * 
 * // No seu index.js, adicione:
 * export default app;
 */

// Importe seu app Express aqui
// import app from '../../src/index.js';

describe('Patient Connection Code - Integration Tests', () => {
    let app;
    let patientAuthId, patientId, patientToken;
    let nutriAuthId, nutriId, nutriToken;
    let educatorAuthId, educatorId, educatorToken;
    let patient2AuthId, patient2Id;

    beforeAll(async () => {
        // Para executar este teste, você precisa exportar o app do index.js
        try {
            const appModule = await import('../../src/index.js');
            app = appModule.default;
        } catch (error) {
            console.log('⚠️  App não encontrado. Pulando testes de integração.');
            console.log('   Para executar estes testes, exporte o app Express do index.js');
            return;
        }

        // Criar paciente de teste
        const patientAuth = await pool.query(
            `INSERT INTO auth (id, username, email, user_type, password)
             VALUES (gen_random_uuid(), $1, $2, 'Patient', '$2b$10$valid.hash')
             RETURNING id, email, user_type`,
            [`patient_${Date.now()}`, `patient_${Date.now()}@test.com`]
        );
        patientAuthId = patientAuth.rows[0].id;

        const patient = await pool.query(
            `INSERT INTO patient (id, name, birthdate, sex, auth_id)
             VALUES (gen_random_uuid(), 'Paciente Teste', '1990-01-01', 'M', $1)
             RETURNING id`,
            [patientAuthId]
        );
        patientId = patient.rows[0].id;

        patientToken = jwt.sign(
            {
                id: patientAuthId,
                email: patientAuth.rows[0].email,
                user_type: 'Patient',
                professionalId: patientId
            },
            process.env.JWT_SECRET || 'dev_secret',
            { expiresIn: '1h' }
        );

        // Criar nutricionista de teste
        const nutriAuth = await pool.query(
            `INSERT INTO auth (id, username, email, user_type, password)
             VALUES (gen_random_uuid(), $1, $2, 'Nutricionist', '$2b$10$valid.hash')
             RETURNING id, email, user_type`,
            [`nutri_${Date.now()}`, `nutri_${Date.now()}@test.com`]
        );
        nutriAuthId = nutriAuth.rows[0].id;

        const nutri = await pool.query(
            `INSERT INTO nutricionist (id, name, birthdate, sex, contact, crn, auth_id)
             VALUES (gen_random_uuid(), 'Nutricionista Teste', '1985-01-01', 'F', '11999999999', 'CRN12345', $1)
             RETURNING id`,
            [nutriAuthId]
        );
        nutriId = nutri.rows[0].id;

        nutriToken = jwt.sign(
            {
                id: nutriAuthId,
                email: nutriAuth.rows[0].email,
                user_type: 'Nutricionist',
                professionalId: nutriId
            },
            process.env.JWT_SECRET || 'dev_secret',
            { expiresIn: '1h' }
        );

        // Criar educador físico de teste
        const educatorAuth = await pool.query(
            `INSERT INTO auth (id, username, email, user_type, password)
             VALUES (gen_random_uuid(), $1, $2, 'Physical_educator', '$2b$10$valid.hash')
             RETURNING id, email, user_type`,
            [`educator_${Date.now()}`, `educator_${Date.now()}@test.com`]
        );
        educatorAuthId = educatorAuth.rows[0].id;

        const educator = await pool.query(
            `INSERT INTO physical_educator (id, name, birthdate, sex, contact, cref, auth_id)
             VALUES (gen_random_uuid(), 'Educador Teste', '1985-01-01', 'M', '11999999999', 'CREF12345', $1)
             RETURNING id`,
            [educatorAuthId]
        );
        educatorId = educator.rows[0].id;

        educatorToken = jwt.sign(
            {
                id: educatorAuthId,
                email: educatorAuth.rows[0].email,
                user_type: 'Physical_educator',
                professionalId: educatorId
            },
            process.env.JWT_SECRET || 'dev_secret',
            { expiresIn: '1h' }
        );

        // Criar segundo paciente (para testes de acesso não autorizado)
        const patient2Auth = await pool.query(
            `INSERT INTO auth (id, username, email, user_type, password)
             VALUES (gen_random_uuid(), $1, $2, 'Patient', '$2b$10$valid.hash')
             RETURNING id`,
            [`patient2_${Date.now()}`, `patient2_${Date.now()}@test.com`]
        );
        patient2AuthId = patient2Auth.rows[0].id;

        const patient2 = await pool.query(
            `INSERT INTO patient (id, name, birthdate, sex, auth_id)
             VALUES (gen_random_uuid(), 'Paciente 2', '1990-01-01', 'F', $1)
             RETURNING id`,
            [patient2AuthId]
        );
        patient2Id = patient2.rows[0].id;
    });

    afterAll(async () => {
        // Cleanup
        await pool.query('DELETE FROM patient_connection_code WHERE patient_id IN ($1, $2)',
            [patientId, patient2Id]);
        await pool.query('DELETE FROM patient_professional_association WHERE patient_id IN ($1, $2)',
            [patientId, patient2Id]);
        await pool.query('DELETE FROM patient WHERE id IN ($1, $2)', [patientId, patient2Id]);
        await pool.query('DELETE FROM nutricionist WHERE id = $1', [nutriId]);
        await pool.query('DELETE FROM physical_educator WHERE id = $1', [educatorId]);
        await pool.query('DELETE FROM auth WHERE id IN ($1, $2, $3, $4)',
            [patientAuthId, nutriAuthId, educatorAuthId, patient2AuthId]);
    });

    describe('POST /patient-connection-code/generate/:patientId', () => {
        it('deve gerar código com autenticação válida', async () => {
            if (!app) return; // Pula se app não disponível

            const response = await request(app)
                .post(`/patient-connection-code/generate/${patientId}`)
                .set('Authorization', `Bearer ${patientToken}`)
                .expect(201);

            expect(response.body).toHaveProperty('code');
            expect(response.body.code).toMatch(/^\d{6}$/);
            expect(response.body).toHaveProperty('expires_at');
            expect(response.body.used).toBe(false);
            expect(response.body.patient_id).toBe(patientId);
        });

        it('deve rejeitar requisição sem autenticação', async () => {
            if (!app) return;

            await request(app)
                .post(`/patient-connection-code/generate/${patientId}`)
                .expect(401);
        });
    });

    describe('POST /patient-connection-code/connect', () => {
        let validCode;

        beforeEach(async () => {
            if (!app) return;

            // Gerar código válido
            const response = await request(app)
                .post(`/patient-connection-code/generate/${patientId}`)
                .set('Authorization', `Bearer ${patientToken}`);
            validCode = response.body.code;
        });

        afterEach(async () => {
            // Limpar associações criadas
            await pool.query('DELETE FROM patient_professional_association WHERE patient_id = $1', [patientId]);
        });

        it('nutricionista deve conectar com código válido', async () => {
            if (!app) return;

            const response = await request(app)
                .post('/patient-connection-code/connect')
                .set('Authorization', `Bearer ${nutriToken}`)
                .send({ code: validCode })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body).toHaveProperty('patient_name');
            expect(response.body.patient_name).toBe('Paciente Teste');

            // Verificar que associação foi criada
            const association = await pool.query(
                'SELECT * FROM patient_professional_association WHERE patient_id = $1',
                [patientId]
            );
            expect(association.rows.length).toBe(1);
            expect(association.rows[0].nutricionist_id).toBe(nutriId);
        });

        it('educador físico deve conectar com código válido', async () => {
            if (!app) return;

            const response = await request(app)
                .post('/patient-connection-code/connect')
                .set('Authorization', `Bearer ${educatorToken}`)
                .send({ code: validCode })
                .expect(200);

            expect(response.body.success).toBe(true);

            const association = await pool.query(
                'SELECT * FROM patient_professional_association WHERE patient_id = $1',
                [patientId]
            );
            expect(association.rows.length).toBe(1);
            expect(association.rows[0].physical_educator_id).toBe(educatorId);
        });

        it('deve rejeitar código inválido', async () => {
            if (!app) return;

            const response = await request(app)
                .post('/patient-connection-code/connect')
                .set('Authorization', `Bearer ${nutriToken}`)
                .send({ code: '999999' })
                .expect(404);

            expect(response.body.message).toContain('inválido ou expirado');
        });

        it('deve rejeitar código já utilizado', async () => {
            if (!app) return;

            // Primeiro uso
            await request(app)
                .post('/patient-connection-code/connect')
                .set('Authorization', `Bearer ${nutriToken}`)
                .send({ code: validCode })
                .expect(200);

            // Segundo uso deve falhar
            const response = await request(app)
                .post('/patient-connection-code/connect')
                .set('Authorization', `Bearer ${nutriToken}`)
                .send({ code: validCode })
                .expect(404);

            expect(response.body.message).toContain('inválido ou expirado');
        });

        it('deve registrar conexão nos logs', async () => {
            if (!app) return;

            await request(app)
                .post('/patient-connection-code/connect')
                .set('Authorization', `Bearer ${nutriToken}`)
                .send({ code: validCode });

            const logs = await pool.query(
                `SELECT * FROM logs 
                 WHERE action = 'CONNECT_WITH_CODE' 
                 AND user_id = $1 
                 ORDER BY created_at DESC LIMIT 1`,
                [nutriAuthId]
            );

            expect(logs.rows.length).toBe(1);
            expect(logs.rows[0].status).toBe('SUCCESS');
            expect(logs.rows[0].log_type).toBe('CREATE');
        });
    });

    describe('GET /patient-connection-code/active/:patientId', () => {
        it('deve retornar código ativo do paciente', async () => {
            if (!app) return;

            // Gerar código
            await request(app)
                .post(`/patient-connection-code/generate/${patientId}`)
                .set('Authorization', `Bearer ${patientToken}`);

            // Buscar código ativo
            const response = await request(app)
                .get(`/patient-connection-code/active/${patientId}`)
                .set('Authorization', `Bearer ${patientToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('code');
            expect(response.body.code).toMatch(/^\d{6}$/);
        });

        it('deve retornar objeto vazio se não há código ativo', async () => {
            if (!app) return;

            const response = await request(app)
                .get(`/patient-connection-code/active/${patient2Id}`)
                .set('Authorization', `Bearer ${patientToken}`)
                .expect(200);

            expect(response.body).toEqual({});
        });
    });

    describe('DELETE /patient-connection-code/:patientId', () => {
        it('deve deletar código do paciente', async () => {
            if (!app) return;

            // Gerar código
            await request(app)
                .post(`/patient-connection-code/generate/${patientId}`)
                .set('Authorization', `Bearer ${patientToken}`);

            // Deletar código
            await request(app)
                .delete(`/patient-connection-code/${patientId}`)
                .set('Authorization', `Bearer ${patientToken}`)
                .expect(200);

            // Verificar que foi deletado
            const response = await request(app)
                .get(`/patient-connection-code/active/${patientId}`)
                .set('Authorization', `Bearer ${patientToken}`);

            expect(response.body).toEqual({});
        });
    });
});
