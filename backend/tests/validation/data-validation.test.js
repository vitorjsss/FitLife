/**
 * ============================================================================
 * TESTES DE VALIDAÇÃO DE DADOS PLAUSÍVEIS (RNF2.0)
 * ============================================================================
 * 
 * MÉTRICA AVALIADA:
 * x = Nvalores_invalidos_detectados / Nvalores_invalidos_inseridos
 * 
 * REQUISITO: x ≥ 1.0 (100%)
 * 
 * OBJETIVO:
 * Validar que o sistema rejeita TODAS as entradas inválidas ou implausíveis
 * nas medidas corporais e nutricionais. Quanto mais próximo de 1, maior a
 * garantia de que o sistema rejeita entradas inconsistentes.
 * 
 * CATEGORIAS DE TESTE:
 * 1. Validação de Peso (5 testes)
 * 2. Validação de Altura (5 testes)
 * 3. Validação de Circunferências (6 testes)
 * 4. Validação de IMC e Percentuais (5 testes)
 * 5. Validação de Campos Obrigatórios (4 testes)
 * 6. Validação de Tipos de Dados (4 testes)
 * 7. Validação de Consistência (4 testes)
 * 
 * TOTAL: 33 testes
 * ============================================================================
 */

const request = require('supertest');
const app = require('../../src/index');
const pool = require('../../src/config/db');
const bcrypt = require('bcrypt');

// ============================================================================
// ESTATÍSTICAS GLOBAIS
// ============================================================================
const testStats = {
    totalInvalidInputs: 0,      // Total de entradas inválidas testadas
    detectedInvalid: 0,         // Total detectadas e rejeitadas
    missedInvalid: 0,           // Total que passaram indevidamente
    
    // Por categoria
    weightTests: { total: 0, detected: 0, missed: 0 },
    heightTests: { total: 0, detected: 0, missed: 0 },
    circumferenceTests: { total: 0, detected: 0, missed: 0 },
    percentageTests: { total: 0, detected: 0, missed: 0 },
    requiredTests: { total: 0, detected: 0, missed: 0 },
    typeTests: { total: 0, detected: 0, missed: 0 },
    consistencyTests: { total: 0, detected: 0, missed: 0 }
};

// ============================================================================
// DADOS DE TESTE
// ============================================================================
const testData = {
    authId: null,
    patientId: null,
    token: null,
    professionalId: null,
    email: `test.validation.${Date.now()}@fitlife.com`,
    password: 'Test@1234'
};

// ============================================================================
// CONSTANTES DE VALIDAÇÃO
// ============================================================================
const VALIDATION_LIMITS = {
    weight: { min: 20, max: 300 },           // kg
    height: { min: 50, max: 250 },           // cm
    circumference: { min: 10, max: 200 },    // cm
    bodyFat: { min: 3, max: 60 },            // %
    bmi: { min: 10, max: 60 },               // kg/m²
    muscleMass: { min: 10, max: 100 },       // kg
    boneMass: { min: 1, max: 10 }            // kg
};

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Testa se uma entrada inválida é corretamente rejeitada
 */
async function testInvalidInput(category, testFunction, description) {
    const categoryStats = testStats[`${category}Tests`];
    categoryStats.total++;
    testStats.totalInvalidInputs++;

    try {
        const result = await testFunction();
        
        // Se status é 400, 422 ou 409, a validação funcionou
        if (result.status === 400 || result.status === 422 || result.status === 409) {
            categoryStats.detected++;
            testStats.detectedInvalid++;
            printSuccess(`✓ ${description} - Rejeitado corretamente (${result.status})`);
            return true;
        } else {
            // Se passou (200, 201), a validação FALHOU
            categoryStats.missed++;
            testStats.missedInvalid++;
            printError(`✗ ${description} - NÃO foi rejeitado (${result.status})`);
            return false;
        }
    } catch (error) {
        // Erro de rede ou outro problema
        printError(`✗ ${description} - Erro no teste: ${error.message}`);
        categoryStats.missed++;
        testStats.missedInvalid++;
        return false;
    }
}

/**
 * Funções de impressão colorida
 */
function printMetric(message) {
    console.log(`\n\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m`);
    console.log(`\x1b[36m${message}\x1b[0m`);
    console.log(`\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n`);
}

function printSuccess(message) {
    console.log(`\x1b[32m${message}\x1b[0m`);
}

function printError(message) {
    console.log(`\x1b[31m${message}\x1b[0m`);
}

function printWarning(message) {
    console.log(`\x1b[33m${message}\x1b[0m`);
}

function printInfo(message) {
    console.log(`\x1b[34m${message}\x1b[0m`);
}

// ============================================================================
// SETUP E TEARDOWN
// ============================================================================

beforeAll(async () => {
    printMetric('🔧 CONFIGURAÇÃO INICIAL - Criando dados de teste');

    try {
        // 1. Criar usuário de teste
        const hashedPassword = await bcrypt.hash(testData.password, 10);
        const authResult = await pool.query(
            `INSERT INTO "Auth" (email, password, role, verified) 
             VALUES ($1, $2, 'professional', true) 
             RETURNING id`,
            [testData.email, hashedPassword]
        );
        testData.authId = authResult.rows[0].id;
        printSuccess(`✓ Usuário criado: ${testData.email}`);

        // 2. Criar profissional
        const profResult = await pool.query(
            `INSERT INTO "Professional" (auth_id, name, specialty, crn) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id`,
            [testData.authId, 'Dr. Validation Test', 'Nutricionista', 'CRN-123456']
        );
        testData.professionalId = profResult.rows[0].id;
        printSuccess(`✓ Profissional criado: ID ${testData.professionalId}`);

        // 3. Criar paciente
        const patientAuthResult = await pool.query(
            `INSERT INTO "Auth" (email, password, role, verified) 
             VALUES ($1, $2, 'patient', true) 
             RETURNING id`,
            [`patient.validation.${Date.now()}@fitlife.com`, hashedPassword]
        );
        
        const patientResult = await pool.query(
            `INSERT INTO "Patient" (auth_id, name, birth_date, gender, professional_id) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id`,
            [patientAuthResult.rows[0].id, 'Patient Validation Test', '1990-01-01', 'M', testData.professionalId]
        );
        testData.patientId = patientResult.rows[0].id;
        printSuccess(`✓ Paciente criado: ID ${testData.patientId}`);

        // 4. Fazer login para obter token
        const loginResponse = await request(app)
            .post('/auth/login')
            .send({ email: testData.email, password: testData.password });
        
        testData.token = loginResponse.body.token;
        printSuccess(`✓ Token de autenticação obtido`);

        printInfo(`\n📊 Setup concluído com sucesso!\n`);

    } catch (error) {
        printError(`✗ Erro no setup: ${error.message}`);
        throw error;
    }
}, 30000);

afterAll(async () => {
    printMetric('🧹 LIMPEZA - Removendo dados de teste');

    try {
        // Remover em ordem de dependência
        if (testData.patientId) {
            await pool.query('DELETE FROM "BodyMeasurement" WHERE patient_id = $1', [testData.patientId]);
            await pool.query('DELETE FROM "Patient" WHERE id = $1', [testData.patientId]);
            printSuccess('✓ Paciente e medidas removidos');
        }

        if (testData.professionalId) {
            await pool.query('DELETE FROM "Professional" WHERE id = $1', [testData.professionalId]);
            printSuccess('✓ Profissional removido');
        }

        if (testData.authId) {
            await pool.query('DELETE FROM "Auth" WHERE id = $1 OR email LIKE $2', 
                [testData.authId, 'patient.validation.%']);
            printSuccess('✓ Autenticações removidas');
        }

        // ============================================================================
        // RELATÓRIO FINAL
        // ============================================================================
        printMetric('📊 RELATÓRIO FINAL - VALIDAÇÃO DE DADOS PLAUSÍVEIS (RNF2.0)');

        console.log(`\n${'═'.repeat(70)}`);
        console.log(`  ESTATÍSTICAS GERAIS`);
        console.log(`${'═'.repeat(70)}\n`);

        console.log(`📋 Total de Entradas Inválidas Testadas: ${testStats.totalInvalidInputs}`);
        console.log(`✅ Detectadas e Rejeitadas: ${testStats.detectedInvalid}`);
        console.log(`❌ Não Detectadas (passaram): ${testStats.missedInvalid}\n`);

        // Calcular métrica principal
        const metricValue = testStats.totalInvalidInputs > 0 
            ? testStats.detectedInvalid / testStats.totalInvalidInputs 
            : 0;

        console.log(`${'═'.repeat(70)}`);
        console.log(`  MÉTRICA PRINCIPAL`);
        console.log(`${'═'.repeat(70)}\n`);

        console.log(`📐 Fórmula: x = Ndetectados / Ntotal`);
        console.log(`📊 Resultado (x): ${(metricValue * 100).toFixed(2)}%`);
        console.log(`🎯 Requisito: x ≥ 1.0 (100%)\n`);

        // Estatísticas por categoria
        console.log(`${'═'.repeat(70)}`);
        console.log(`  ESTATÍSTICAS POR CATEGORIA`);
        console.log(`${'═'.repeat(70)}\n`);

        const categories = [
            { name: 'Peso', key: 'weightTests', icon: '⚖️' },
            { name: 'Altura', key: 'heightTests', icon: '📏' },
            { name: 'Circunferências', key: 'circumferenceTests', icon: '📐' },
            { name: 'IMC/Percentuais', key: 'percentageTests', icon: '📊' },
            { name: 'Campos Obrigatórios', key: 'requiredTests', icon: '✔️' },
            { name: 'Tipos de Dados', key: 'typeTests', icon: '🔢' },
            { name: 'Consistência', key: 'consistencyTests', icon: '🔄' }
        ];

        categories.forEach(cat => {
            const stats = testStats[cat.key];
            const rate = stats.total > 0 ? (stats.detected / stats.total * 100).toFixed(1) : 0;
            console.log(`${cat.icon} ${cat.name}:`);
            console.log(`   Total: ${stats.total} | Detectados: ${stats.detected} | Taxa: ${rate}%`);
        });

        console.log(`\n${'═'.repeat(70)}`);
        console.log(`  AVALIAÇÃO FINAL`);
        console.log(`${'═'.repeat(70)}\n`);

        if (metricValue >= 1.0) {
            printSuccess(`✅ APROVADO - Taxa de Detecção: ATENDE (100%)`);
            printSuccess(`✅ RNF2.0 ATENDIDO - Sistema rejeita todas as entradas inválidas`);
        } else if (metricValue >= 0.95) {
            printWarning(`⚠️  ATENÇÃO - Taxa de Detecção: ${(metricValue * 100).toFixed(2)}%`);
            printWarning(`⚠️  Próximo ao requisito, mas algumas validações falharam`);
        } else {
            printError(`❌ REPROVADO - Taxa de Detecção: ${(metricValue * 100).toFixed(2)}%`);
            printError(`❌ RNF2.0 NÃO ATENDIDO - Validações insuficientes`);
        }

        console.log(`\n${'═'.repeat(70)}\n`);

        await pool.end();
        printSuccess('✓ Conexão com banco encerrada');

    } catch (error) {
        printError(`✗ Erro na limpeza: ${error.message}`);
    }
}, 30000);

// ============================================================================
// CATEGORIA 1: VALIDAÇÃO DE PESO
// ============================================================================

describe('1. Validação de Peso', () => {
    printMetric('⚖️  CATEGORIA 1: VALIDAÇÃO DE PESO');

    test('1.1 - Rejeitar peso negativo', async () => {
        const result = await testInvalidInput('weight', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: -70.5,
                    height: 175,
                    measurement_date: new Date()
                });
        }, 'Peso negativo (-70.5 kg)');

        expect(result).toBe(true);
    });

    test('1.2 - Rejeitar peso zero', async () => {
        const result = await testInvalidInput('weight', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: 0,
                    height: 175,
                    measurement_date: new Date()
                });
        }, 'Peso zero (0 kg)');

        expect(result).toBe(true);
    });

    test('1.3 - Rejeitar peso abaixo do mínimo (< 20kg)', async () => {
        const result = await testInvalidInput('weight', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: 15,
                    height: 175,
                    measurement_date: new Date()
                });
        }, 'Peso muito baixo (15 kg)');

        expect(result).toBe(true);
    });

    test('1.4 - Rejeitar peso acima do máximo (> 300kg)', async () => {
        const result = await testInvalidInput('weight', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: 350,
                    height: 175,
                    measurement_date: new Date()
                });
        }, 'Peso muito alto (350 kg)');

        expect(result).toBe(true);
    });

    test('1.5 - Rejeitar peso com formato inválido', async () => {
        const result = await testInvalidInput('weight', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: "setenta kilos",
                    height: 175,
                    measurement_date: new Date()
                });
        }, 'Peso com texto ("setenta kilos")');

        expect(result).toBe(true);
    });
});

// ============================================================================
// CATEGORIA 2: VALIDAÇÃO DE ALTURA
// ============================================================================

describe('2. Validação de Altura', () => {
    printMetric('📏 CATEGORIA 2: VALIDAÇÃO DE ALTURA');

    test('2.1 - Rejeitar altura negativa', async () => {
        const result = await testInvalidInput('height', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: 70,
                    height: -175,
                    measurement_date: new Date()
                });
        }, 'Altura negativa (-175 cm)');

        expect(result).toBe(true);
    });

    test('2.2 - Rejeitar altura zero', async () => {
        const result = await testInvalidInput('height', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: 70,
                    height: 0,
                    measurement_date: new Date()
                });
        }, 'Altura zero (0 cm)');

        expect(result).toBe(true);
    });

    test('2.3 - Rejeitar altura abaixo do mínimo (< 50cm)', async () => {
        const result = await testInvalidInput('height', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: 70,
                    height: 30,
                    measurement_date: new Date()
                });
        }, 'Altura muito baixa (30 cm)');

        expect(result).toBe(true);
    });

    test('2.4 - Rejeitar altura acima do máximo (> 250cm)', async () => {
        const result = await testInvalidInput('height', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: 70,
                    height: 300,
                    measurement_date: new Date()
                });
        }, 'Altura muito alta (300 cm)');

        expect(result).toBe(true);
    });

    test('2.5 - Rejeitar altura em metros ao invés de cm', async () => {
        const result = await testInvalidInput('height', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: 70,
                    height: 1.75, // Deveria ser 175 cm
                    measurement_date: new Date()
                });
        }, 'Altura em metros (1.75 ao invés de 175)');

        expect(result).toBe(true);
    });
});

// ============================================================================
// CATEGORIA 3: VALIDAÇÃO DE CIRCUNFERÊNCIAS
// ============================================================================

describe('3. Validação de Circunferências', () => {
    printMetric('📐 CATEGORIA 3: VALIDAÇÃO DE CIRCUNFERÊNCIAS');

    test('3.1 - Rejeitar circunferência da cintura negativa', async () => {
        const result = await testInvalidInput('circumference', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: 70,
                    height: 175,
                    waist_circumference: -80,
                    measurement_date: new Date()
                });
        }, 'Circunferência da cintura negativa (-80 cm)');

        expect(result).toBe(true);
    });

    test('3.2 - Rejeitar circunferência do quadril muito baixa (< 10cm)', async () => {
        const result = await testInvalidInput('circumference', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: 70,
                    height: 175,
                    hip_circumference: 5,
                    measurement_date: new Date()
                });
        }, 'Circunferência do quadril muito baixa (5 cm)');

        expect(result).toBe(true);
    });

    test('3.3 - Rejeitar circunferência do braço muito alta (> 200cm)', async () => {
        const result = await testInvalidInput('circumference', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: 70,
                    height: 175,
                    arm_circumference: 250,
                    measurement_date: new Date()
                });
        }, 'Circunferência do braço muito alta (250 cm)');

        expect(result).toBe(true);
    });

    test('3.4 - Rejeitar circunferência da coxa negativa', async () => {
        const result = await testInvalidInput('circumference', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: 70,
                    height: 175,
                    thigh_circumference: -45,
                    measurement_date: new Date()
                });
        }, 'Circunferência da coxa negativa (-45 cm)');

        expect(result).toBe(true);
    });

    test('3.5 - Rejeitar circunferência da panturrilha zero', async () => {
        const result = await testInvalidInput('circumference', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: 70,
                    height: 175,
                    calf_circumference: 0,
                    measurement_date: new Date()
                });
        }, 'Circunferência da panturrilha zero (0 cm)');

        expect(result).toBe(true);
    });

    test('3.6 - Rejeitar cintura maior que quadril em mulher', async () => {
        const result = await testInvalidInput('circumference', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: 70,
                    height: 165,
                    waist_circumference: 100,
                    hip_circumference: 80, // Cintura > Quadril (implausível)
                    measurement_date: new Date()
                });
        }, 'Cintura maior que quadril em valores extremos');

        expect(result).toBe(true);
    });
});

// ============================================================================
// CATEGORIA 4: VALIDAÇÃO DE IMC E PERCENTUAIS
// ============================================================================

describe('4. Validação de IMC e Percentuais', () => {
    printMetric('📊 CATEGORIA 4: VALIDAÇÃO DE IMC E PERCENTUAIS');

    test('4.1 - Rejeitar percentual de gordura negativo', async () => {
        const result = await testInvalidInput('percentage', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: 70,
                    height: 175,
                    body_fat_percentage: -15,
                    measurement_date: new Date()
                });
        }, 'Percentual de gordura negativo (-15%)');

        expect(result).toBe(true);
    });

    test('4.2 - Rejeitar percentual de gordura acima de 100%', async () => {
        const result = await testInvalidInput('percentage', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: 70,
                    height: 175,
                    body_fat_percentage: 120,
                    measurement_date: new Date()
                });
        }, 'Percentual de gordura acima de 100% (120%)');

        expect(result).toBe(true);
    });

    test('4.3 - Rejeitar percentual de gordura muito baixo (< 3%)', async () => {
        const result = await testInvalidInput('percentage', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: 70,
                    height: 175,
                    body_fat_percentage: 1,
                    measurement_date: new Date()
                });
        }, 'Percentual de gordura muito baixo (1%)');

        expect(result).toBe(true);
    });

    test('4.4 - Rejeitar IMC calculado fora da faixa (< 10 ou > 60)', async () => {
        const result = await testInvalidInput('percentage', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: 10, // IMC = 10 / (1.75)^2 = 3.27 (implausível)
                    height: 175,
                    measurement_date: new Date()
                });
        }, 'IMC muito baixo (< 10)');

        expect(result).toBe(true);
    });

    test('4.5 - Rejeitar massa muscular maior que peso total', async () => {
        const result = await testInvalidInput('percentage', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: 70,
                    height: 175,
                    muscle_mass: 80, // Músculo > Peso (impossível)
                    measurement_date: new Date()
                });
        }, 'Massa muscular maior que peso total');

        expect(result).toBe(true);
    });
});

// ============================================================================
// CATEGORIA 5: VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS
// ============================================================================

describe('5. Validação de Campos Obrigatórios', () => {
    printMetric('✔️  CATEGORIA 5: VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS');

    test('5.1 - Rejeitar medida sem patient_id', async () => {
        const result = await testInvalidInput('required', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    weight: 70,
                    height: 175,
                    measurement_date: new Date()
                    // patient_id ausente
                });
        }, 'Medida sem patient_id');

        expect(result).toBe(true);
    });

    test('5.2 - Rejeitar medida sem peso', async () => {
        const result = await testInvalidInput('required', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    height: 175,
                    measurement_date: new Date()
                    // weight ausente
                });
        }, 'Medida sem peso');

        expect(result).toBe(true);
    });

    test('5.3 - Rejeitar medida sem altura', async () => {
        const result = await testInvalidInput('required', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: 70,
                    measurement_date: new Date()
                    // height ausente
                });
        }, 'Medida sem altura');

        expect(result).toBe(true);
    });

    test('5.4 - Rejeitar medida sem data', async () => {
        const result = await testInvalidInput('required', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: 70,
                    height: 175
                    // measurement_date ausente
                });
        }, 'Medida sem data');

        expect(result).toBe(true);
    });
});

// ============================================================================
// CATEGORIA 6: VALIDAÇÃO DE TIPOS DE DADOS
// ============================================================================

describe('6. Validação de Tipos de Dados', () => {
    printMetric('🔢 CATEGORIA 6: VALIDAÇÃO DE TIPOS DE DADOS');

    test('6.1 - Rejeitar patient_id com tipo inválido', async () => {
        const result = await testInvalidInput('type', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: "abc123", // String ao invés de UUID
                    weight: 70,
                    height: 175,
                    measurement_date: new Date()
                });
        }, 'patient_id com formato inválido');

        expect(result).toBe(true);
    });

    test('6.2 - Rejeitar data em formato inválido', async () => {
        const result = await testInvalidInput('type', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: 70,
                    height: 175,
                    measurement_date: "30/02/2025" // Data inválida
                });
        }, 'Data em formato inválido (30/02/2025)');

        expect(result).toBe(true);
    });

    test('6.3 - Rejeitar valores booleanos em campos numéricos', async () => {
        const result = await testInvalidInput('type', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: true, // Boolean ao invés de number
                    height: 175,
                    measurement_date: new Date()
                });
        }, 'Boolean ao invés de número (weight: true)');

        expect(result).toBe(true);
    });

    test('6.4 - Rejeitar arrays em campos simples', async () => {
        const result = await testInvalidInput('type', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: [70, 75], // Array ao invés de número
                    height: 175,
                    measurement_date: new Date()
                });
        }, 'Array ao invés de número simples');

        expect(result).toBe(true);
    });
});

// ============================================================================
// CATEGORIA 7: VALIDAÇÃO DE CONSISTÊNCIA
// ============================================================================

describe('7. Validação de Consistência', () => {
    printMetric('🔄 CATEGORIA 7: VALIDAÇÃO DE CONSISTÊNCIA');

    test('7.1 - Rejeitar data futura', async () => {
        const result = await testInvalidInput('consistency', async () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: 70,
                    height: 175,
                    measurement_date: futureDate
                });
        }, 'Data futura (1 ano à frente)');

        expect(result).toBe(true);
    });

    test('7.2 - Rejeitar data muito antiga (> 150 anos)', async () => {
        const result = await testInvalidInput('consistency', async () => {
            const ancientDate = new Date();
            ancientDate.setFullYear(ancientDate.getFullYear() - 151);
            
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: 70,
                    height: 175,
                    measurement_date: ancientDate
                });
        }, 'Data muito antiga (151 anos atrás)');

        expect(result).toBe(true);
    });

    test('7.3 - Rejeitar soma de massas maior que peso total', async () => {
        const result = await testInvalidInput('consistency', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: testData.patientId,
                    weight: 70,
                    height: 175,
                    muscle_mass: 50,
                    bone_mass: 5,
                    body_fat_percentage: 30, // Fat = 21kg
                    // Total = 50 + 5 + 21 = 76kg > 70kg (inconsistente)
                    measurement_date: new Date()
                });
        }, 'Soma de massas maior que peso total');

        expect(result).toBe(true);
    });

    test('7.4 - Rejeitar patient_id inexistente', async () => {
        const result = await testInvalidInput('consistency', async () => {
            return await request(app)
                .post('/body-measurement')
                .set('Authorization', `Bearer ${testData.token}`)
                .send({
                    patient_id: '00000000-0000-0000-0000-000000000000', // UUID válido mas inexistente
                    weight: 70,
                    height: 175,
                    measurement_date: new Date()
                });
        }, 'Patient_id inexistente no banco');

        expect(result).toBe(true);
    });
});
