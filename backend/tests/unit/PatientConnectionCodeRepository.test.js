import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import PatientConnectionCodeRepository from '../../src/repositories/PatientConnectionCodeRepository.js';
import { pool } from '../../src/config/db.js';

describe('PatientConnectionCodeRepository - Unit Tests', () => {
    let testAuthId;
    let testPatientId;

    beforeEach(async () => {
        // Criar usuário de teste
        const authResult = await pool.query(
            `INSERT INTO auth (id, username, email, user_type, password)
             VALUES (gen_random_uuid(), $1, $2, $3, $4)
             RETURNING id`,
            [`test_patient_${Date.now()}`, `test_${Date.now()}@test.com`, 'Patient', '$2b$10$test']
        );
        testAuthId = authResult.rows[0].id;

        // Criar paciente de teste
        const patientResult = await pool.query(
            `INSERT INTO patient (id, name, birthdate, sex, auth_id)
             VALUES (gen_random_uuid(), $1, $2, $3, $4)
             RETURNING id`,
            ['Paciente Teste', '1990-01-01', 'M', testAuthId]
        );
        testPatientId = patientResult.rows[0].id;
    });

    afterEach(async () => {
        // Limpar dados de teste
        if (testPatientId) {
            await pool.query('DELETE FROM patient_connection_code WHERE patient_id = $1', [testPatientId]);
            await pool.query('DELETE FROM patient WHERE id = $1', [testPatientId]);
        }
        if (testAuthId) {
            await pool.query('DELETE FROM auth WHERE id = $1', [testAuthId]);
        }
    });

    describe('generateCode', () => {
        it('deve gerar um código de 6 dígitos', () => {
            const code = PatientConnectionCodeRepository.generateCode();

            expect(code).toBeDefined();
            expect(typeof code).toBe('string');
            expect(code).toMatch(/^\d{6}$/);
            expect(code.length).toBe(6);
        });

        it('deve gerar códigos diferentes em chamadas sucessivas', () => {
            const codes = new Set();

            for (let i = 0; i < 100; i++) {
                codes.add(PatientConnectionCodeRepository.generateCode());
            }

            // Pelo menos 90% dos códigos devem ser únicos
            expect(codes.size).toBeGreaterThan(90);
        });
    });

    describe('createOrUpdate', () => {
        it('deve criar um novo código para o paciente', async () => {
            const codeData = await PatientConnectionCodeRepository.createOrUpdate(testPatientId);

            expect(codeData).toBeDefined();
            expect(codeData.id).toBeDefined();
            expect(codeData.patient_id).toBe(testPatientId);
            expect(codeData.code).toMatch(/^\d{6}$/);
            expect(codeData.used).toBe(false);
            expect(codeData.expires_at).toBeDefined();
            expect(new Date(codeData.expires_at)).toBeInstanceOf(Date);
        });

        it('deve criar código com expiração de aproximadamente 5 minutos', async () => {
            const codeData = await PatientConnectionCodeRepository.createOrUpdate(testPatientId);

            const createdAt = new Date(codeData.created_at).getTime();
            const expiresAt = new Date(codeData.expires_at).getTime();
            const fiveMinutes = 5 * 60 * 1000;

            const actualDiff = expiresAt - createdAt;

            // Verifica se a diferença está entre 4:58 e 5:02 (margem de 2 segundos)
            expect(actualDiff).toBeGreaterThanOrEqual(fiveMinutes - 2000);
            expect(actualDiff).toBeLessThanOrEqual(fiveMinutes + 2000);
        });

        it('deve remover código anterior ao criar novo', async () => {
            // Criar primeiro código
            const firstCode = await PatientConnectionCodeRepository.createOrUpdate(testPatientId);
            expect(firstCode).toBeDefined();

            // Aguardar 1 segundo para garantir códigos diferentes
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Criar segundo código
            const secondCode = await PatientConnectionCodeRepository.createOrUpdate(testPatientId);
            expect(secondCode).toBeDefined();

            // Códigos devem ser diferentes
            expect(secondCode.code).not.toBe(firstCode.code);
            expect(secondCode.id).not.toBe(firstCode.id);

            // Deve existir apenas 1 código no banco
            const result = await pool.query(
                'SELECT * FROM patient_connection_code WHERE patient_id = $1',
                [testPatientId]
            );
            expect(result.rows.length).toBe(1);
            expect(result.rows[0].code).toBe(secondCode.code);
        });

        it('deve criar código não utilizado (used = false)', async () => {
            const codeData = await PatientConnectionCodeRepository.createOrUpdate(testPatientId);
            expect(codeData.used).toBe(false);
        });
    });

    describe('findValidByCode', () => {
        it('deve encontrar código válido e não expirado', async () => {
            const created = await PatientConnectionCodeRepository.createOrUpdate(testPatientId);
            const found = await PatientConnectionCodeRepository.findValidByCode(created.code);

            expect(found).toBeDefined();
            expect(found.code).toBe(created.code);
            expect(found.patient_id).toBe(testPatientId);
            expect(found.used).toBe(false);
            expect(found.patient_name).toBe('Paciente Teste');
        });

        it('não deve encontrar código inexistente', async () => {
            const found = await PatientConnectionCodeRepository.findValidByCode('999999');
            expect(found).toBeUndefined();
        });

        it('não deve encontrar código expirado', async () => {
            // Criar código expirado manualmente
            const expiredCode = '123456';
            const expiredDate = new Date(Date.now() - 10 * 60 * 1000); // 10 minutos atrás

            await pool.query(
                `INSERT INTO patient_connection_code (id, patient_id, code, expires_at, used)
                 VALUES (gen_random_uuid(), $1, $2, $3, false)`,
                [testPatientId, expiredCode, expiredDate]
            );

            const found = await PatientConnectionCodeRepository.findValidByCode(expiredCode);
            expect(found).toBeUndefined();
        });

        it('não deve encontrar código já utilizado', async () => {
            const created = await PatientConnectionCodeRepository.createOrUpdate(testPatientId);

            // Marcar como usado
            await pool.query(
                'UPDATE patient_connection_code SET used = true WHERE id = $1',
                [created.id]
            );

            const found = await PatientConnectionCodeRepository.findValidByCode(created.code);
            expect(found).toBeUndefined();
        });

        it('deve incluir o nome do paciente no resultado', async () => {
            const created = await PatientConnectionCodeRepository.createOrUpdate(testPatientId);
            const found = await PatientConnectionCodeRepository.findValidByCode(created.code);

            expect(found.patient_name).toBeDefined();
            expect(found.patient_name).toBe('Paciente Teste');
        });
    });

    describe('findActiveByPatientId', () => {
        it('deve encontrar código ativo do paciente', async () => {
            const created = await PatientConnectionCodeRepository.createOrUpdate(testPatientId);
            const active = await PatientConnectionCodeRepository.findActiveByPatientId(testPatientId);

            expect(active).toBeDefined();
            expect(active.id).toBe(created.id);
            expect(active.code).toBe(created.code);
            expect(active.patient_id).toBe(testPatientId);
        });

        it('não deve retornar código expirado', async () => {
            // Criar código expirado
            const expiredDate = new Date(Date.now() - 10 * 60 * 1000);
            await pool.query(
                `INSERT INTO patient_connection_code (id, patient_id, code, expires_at, used)
                 VALUES (gen_random_uuid(), $1, $2, $3, false)`,
                [testPatientId, '123456', expiredDate]
            );

            const active = await PatientConnectionCodeRepository.findActiveByPatientId(testPatientId);
            expect(active).toBeUndefined();
        });

        it('não deve retornar código já usado', async () => {
            const created = await PatientConnectionCodeRepository.createOrUpdate(testPatientId);
            await pool.query(
                'UPDATE patient_connection_code SET used = true WHERE id = $1',
                [created.id]
            );

            const active = await PatientConnectionCodeRepository.findActiveByPatientId(testPatientId);
            expect(active).toBeUndefined();
        });

        it('deve retornar undefined se paciente não tem código', async () => {
            const active = await PatientConnectionCodeRepository.findActiveByPatientId(testPatientId);
            expect(active).toBeUndefined();
        });
    });

    describe('markAsUsed', () => {
        it('deve marcar código como usado', async () => {
            const created = await PatientConnectionCodeRepository.createOrUpdate(testPatientId);

            const marked = await PatientConnectionCodeRepository.markAsUsed(created.id);

            expect(marked).toBeDefined();
            expect(marked.id).toBe(created.id);
            expect(marked.used).toBe(true);
            expect(marked.code).toBe(created.code);
        });

        it('código marcado como usado não deve ser encontrado por findValidByCode', async () => {
            const created = await PatientConnectionCodeRepository.createOrUpdate(testPatientId);
            await PatientConnectionCodeRepository.markAsUsed(created.id);

            const found = await PatientConnectionCodeRepository.findValidByCode(created.code);
            expect(found).toBeUndefined();
        });
    });

    describe('deleteExpired', () => {
        it('deve deletar apenas códigos expirados', async () => {
            // Criar código válido
            const validCode = await PatientConnectionCodeRepository.createOrUpdate(testPatientId);

            // Criar código expirado manualmente em outro paciente
            const authResult2 = await pool.query(
                `INSERT INTO auth (id, username, email, user_type, password)
                 VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING id`,
                [`test_patient_2_${Date.now()}`, `test_2_${Date.now()}@test.com`, 'Patient', '$2b$10$test']
            );
            const patientResult2 = await pool.query(
                `INSERT INTO patient (id, name, birthdate, sex, auth_id)
                 VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING id`,
                ['Paciente 2', '1990-01-01', 'M', authResult2.rows[0].id]
            );

            await pool.query(
                `INSERT INTO patient_connection_code (id, patient_id, code, expires_at, used)
                 VALUES (gen_random_uuid(), $1, $2, $3, false)`,
                [patientResult2.rows[0].id, '888888', new Date(Date.now() - 10 * 60 * 1000)]
            );

            const deleted = await PatientConnectionCodeRepository.deleteExpired();

            expect(Array.isArray(deleted)).toBe(true);
            expect(deleted.length).toBeGreaterThanOrEqual(1);

            // Código válido ainda deve existir
            const stillExists = await PatientConnectionCodeRepository.findValidByCode(validCode.code);
            expect(stillExists).toBeDefined();

            // Cleanup
            await pool.query('DELETE FROM patient WHERE id = $1', [patientResult2.rows[0].id]);
            await pool.query('DELETE FROM auth WHERE id = $1', [authResult2.rows[0].id]);
        });

        it('não deve deletar códigos válidos', async () => {
            const validCode = await PatientConnectionCodeRepository.createOrUpdate(testPatientId);

            await PatientConnectionCodeRepository.deleteExpired();

            const found = await PatientConnectionCodeRepository.findValidByCode(validCode.code);
            expect(found).toBeDefined();
        });
    });

    describe('deleteByPatientId', () => {
        it('deve deletar código do paciente', async () => {
            const created = await PatientConnectionCodeRepository.createOrUpdate(testPatientId);

            const deleted = await PatientConnectionCodeRepository.deleteByPatientId(testPatientId);

            expect(deleted).toBeDefined();
            expect(deleted.id).toBe(created.id);

            const found = await PatientConnectionCodeRepository.findActiveByPatientId(testPatientId);
            expect(found).toBeUndefined();
        });

        it('deve retornar undefined se paciente não tem código', async () => {
            const deleted = await PatientConnectionCodeRepository.deleteByPatientId(testPatientId);
            expect(deleted).toBeUndefined();
        });
    });
});
