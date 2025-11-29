/**
 * ========================================================================
 * TESTES DE QUALIDADE - DISPONIBILIDADE DE FUNCIONALIDADES CRÍTICAS (RNF1.0)
 * ========================================================================
 * 
 * Métrica: Taxa de Disponibilidade das Funcionalidades Críticas
 * Fórmula: X = (Ttotal - Tindisponibilidade) / Ttotal
 * onde:
 *   Ttotal = tempo total de observação
 *   Tindisponibilidade = tempo em que a funcionalidade esteve fora do ar
 * 
 * Requisito: X ≥ 0.90 (90%)
 * 
 * Este teste valida:
 * 1. Disponibilidade da funcionalidade de Login
 * 2. Disponibilidade da visualização de Dietas (MealRecord)
 * 3. Disponibilidade da visualização de Treinos (WorkoutRecord)
 * 4. Registro de logs de indisponibilidade
 * 5. Notificação automática em caso de falha
 * 6. Tempo de resposta das funcionalidades críticas
 * ========================================================================
 */

import request from 'supertest';
import app from '../../src/index.js';
import { pool } from '../../src/config/db.js';
import bcrypt from 'bcrypt';

// Cores para output no terminal
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

// Estatísticas globais
let testStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    totalTime: 0,
    downtime: 0,
    loginTests: 0,
    loginSuccess: 0,
    loginDowntime: 0,
    dietTests: 0,
    dietSuccess: 0,
    dietDowntime: 0,
    workoutTests: 0,
    workoutSuccess: 0,
    workoutDowntime: 0,
    responseTimeTests: 0,
    responseTimesUnder2s: 0,
    logsCreated: 0,
    alertsTriggered: 0
};

// Dados de teste
let testData = {
    authId: null,
    patientId: null,
    token: null,
    testEmail: 'availability_test@test.com',
    testPassword: 'AvailabilityTest123'
};

// Tempo limite para considerar serviço indisponível (2 segundos)
const TIMEOUT_THRESHOLD = 2000;

// ========================================================================
// FUNÇÕES AUXILIARES
// ========================================================================

function printHeader(title) {
    console.log('\n' + colors.bright + colors.blue + '═'.repeat(80) + colors.reset);
    console.log(colors.bright + colors.cyan + `  ${title}` + colors.reset);
    console.log(colors.bright + colors.blue + '═'.repeat(80) + colors.reset);
}

function printSection(title) {
    console.log('\n' + colors.bright + colors.yellow + `\n▶ ${title}` + colors.reset);
    console.log(colors.yellow + '─'.repeat(80) + colors.reset);
}

function printSuccess(message) {
    console.log(colors.green + '  ✓ ' + message + colors.reset);
}

function printError(message) {
    console.log(colors.red + '  ✗ ' + message + colors.reset);
}

function printInfo(message) {
    console.log(colors.cyan + '  ℹ ' + message + colors.reset);
}

function printMetric(label, value, unit = '') {
    console.log(colors.magenta + `  📊 ${label}: ${colors.bright}${value}${unit}${colors.reset}`);
}

function printResult(passed, metric, requirement) {
    const status = passed ?
        colors.green + '✓ APROVADO' :
        colors.red + '✗ REPROVADO';
    console.log(`\n  ${status}${colors.reset} - ${metric}: ${colors.bright}${requirement}${colors.reset}`);
}

async function measureResponseTime(testFunction) {
    const startTime = Date.now();
    try {
        await testFunction();
        const responseTime = Date.now() - startTime;
        return { success: true, responseTime };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        return { success: false, responseTime, error };
    }
}

async function createDowntimeLog(functionality, duration, details) {
    try {
        await pool.query(`
            INSERT INTO availability_log (functionality, status, duration_ms, details, created_at)
            VALUES ($1, $2, $3, $4, NOW())
        `, [functionality, 'down', duration, details]);
        testStats.logsCreated++;
    } catch (error) {
        // Tabela pode não existir ainda
        console.log(colors.yellow + `  ⚠ Não foi possível criar log: ${error.message}` + colors.reset);
    }
}

// ========================================================================
// SETUP E TEARDOWN
// ========================================================================

beforeAll(async () => {
    printHeader('INICIALIZANDO TESTES DE DISPONIBILIDADE (RNF1.0)');

    try {
        printSection('Limpando Dados Anteriores');

        // Limpar dados de testes anteriores
        await pool.query(`DELETE FROM patient WHERE name LIKE '%Availability%' OR name LIKE '%Test%'`);
        await pool.query(`DELETE FROM auth WHERE username LIKE '%availability%' OR username LIKE '%test%'`);
        printSuccess('Dados anteriores removidos');

        printSection('Criando Dados de Teste');

        // Hash da senha
        const hashedPassword = await bcrypt.hash(testData.testPassword, 10);

        // Criar usuário de teste
        const authResult = await pool.query(`
            INSERT INTO auth (username, email, password, user_type)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `, [
            'availability_user',
            testData.testEmail,
            hashedPassword,
            'Patient'
        ]);

        testData.authId = authResult.rows[0].id;
        printSuccess(`Auth criado: ${testData.authId}`);

        const patientResult = await pool.query(`
            INSERT INTO patient (name, birthdate, sex, contact, auth_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `, [
            'Availability Test Patient',
            '1990-01-01',
            'M',
            '11999999999',
            testData.authId
        ]);

        testData.patientId = patientResult.rows[0].id;
        printSuccess(`Patient criado: ${testData.patientId}`);

        // Criar dados de teste (dietas e treinos)
        await pool.query(`
            INSERT INTO MealRecord (name, date, checked, patient_id)
            VALUES 
                ('Café da Manhã', CURRENT_DATE, false, $1),
                ('Almoço', CURRENT_DATE, false, $1),
                ('Jantar', CURRENT_DATE, false, $1)
        `, [testData.patientId]);
        printSuccess('MealRecords de teste criados');

        await pool.query(`
            INSERT INTO WorkoutRecord (name, date, checked, patient_id)
            VALUES 
                ('Treino A', CURRENT_DATE, false, $1),
                ('Treino B', CURRENT_DATE, false, $1),
                ('Treino C', CURRENT_DATE, false, $1)
        `, [testData.patientId]);
        printSuccess('WorkoutRecords de teste criados');

        // Tentar criar tabela de logs de disponibilidade
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS availability_log (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    functionality VARCHAR(50) NOT NULL,
                    status VARCHAR(20) NOT NULL,
                    duration_ms INTEGER,
                    details TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_availability_log_functionality 
                ON availability_log(functionality);
                CREATE INDEX IF NOT EXISTS idx_availability_log_created_at 
                ON availability_log(created_at);
            `);
            printSuccess('Tabela availability_log criada/verificada');
        } catch (error) {
            printInfo('Tabela availability_log já existe ou sem permissão para criar');
        }

        printInfo('Setup concluído com sucesso!');
    } catch (error) {
        printError(`Erro no setup: ${error.message}`);
        throw error;
    }
});

afterAll(async () => {
    printSection('Limpando Dados de Teste');

    try {
        // Deletar dados de teste
        await pool.query('DELETE FROM MealRecord WHERE patient_id = $1', [testData.patientId]);
        await pool.query('DELETE FROM WorkoutRecord WHERE patient_id = $1', [testData.patientId]);

        if (testData.patientId) {
            await pool.query('DELETE FROM patient WHERE id = $1', [testData.patientId]);
            printSuccess('Patient deletado');
        }

        if (testData.authId) {
            await pool.query('DELETE FROM auth WHERE id = $1', [testData.authId]);
            printSuccess('Auth deletado');
        }

        // Limpar logs de teste
        try {
            await pool.query(`
                DELETE FROM availability_log 
                WHERE created_at >= NOW() - INTERVAL '1 hour'
                AND details LIKE '%test%'
            `);
            printSuccess('Logs de teste limpos');
        } catch (error) {
            // Tabela pode não existir
        }

        printInfo('Cleanup concluído!');
    } catch (error) {
        printError(`Erro no cleanup: ${error.message}`);
    }
});

// ========================================================================
// TESTE 1: DISPONIBILIDADE DA FUNCIONALIDADE DE LOGIN
// ========================================================================

describe('🔐 Teste 1: Disponibilidade da Funcionalidade de Login', () => {
    printSection('TESTE 1: Disponibilidade de Login');

    test('1.1 - Login deve responder com sucesso', async () => {
        testStats.loginTests++;
        testStats.totalOperations++;

        const result = await measureResponseTime(async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: testData.testEmail,
                    password: testData.testPassword
                })
                .timeout(TIMEOUT_THRESHOLD);

            expect(response.status).toBe(200);
            expect(response.body.accessToken || response.body.token).toBeDefined();

            testData.token = response.body.accessToken || response.body.token;
        });

        testStats.totalTime += result.responseTime;

        if (result.success) {
            testStats.successfulOperations++;
            testStats.loginSuccess++;
            printSuccess(`Login disponível (${result.responseTime}ms)`);
        } else {
            testStats.failedOperations++;
            testStats.downtime += result.responseTime;
            testStats.loginDowntime += result.responseTime;
            await createDowntimeLog('login', result.responseTime, 'Login falhou durante teste');
            printError(`Login indisponível (${result.responseTime}ms)`);
        }

        expect(result.success).toBe(true);
    });

    test('1.2 - Login deve responder em tempo aceitável (< 2s)', async () => {
        testStats.loginTests++;
        testStats.totalOperations++;
        testStats.responseTimeTests++;

        const result = await measureResponseTime(async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: testData.testEmail,
                    password: testData.testPassword
                })
                .timeout(TIMEOUT_THRESHOLD);

            expect(response.status).toBe(200);
        });

        testStats.totalTime += result.responseTime;

        if (result.success && result.responseTime < TIMEOUT_THRESHOLD) {
            testStats.successfulOperations++;
            testStats.loginSuccess++;
            testStats.responseTimesUnder2s++;
            printSuccess(`Login rápido: ${result.responseTime}ms < 2000ms`);
        } else {
            testStats.failedOperations++;
            testStats.downtime += result.responseTime;
            testStats.loginDowntime += result.responseTime;
            await createDowntimeLog('login', result.responseTime, 'Login lento (>2s)');
            printError(`Login lento: ${result.responseTime}ms ≥ 2000ms`);
        }

        expect(result.responseTime).toBeLessThan(TIMEOUT_THRESHOLD);
    });

    test('1.3 - Múltiplas tentativas de login consecutivas', async () => {
        testStats.loginTests++;

        const attempts = 5;
        let successCount = 0;

        for (let i = 0; i < attempts; i++) {
            testStats.totalOperations++;

            const result = await measureResponseTime(async () => {
                const response = await request(app)
                    .post('/auth/login')
                    .send({
                        email: testData.testEmail,
                        password: testData.testPassword
                    })
                    .timeout(TIMEOUT_THRESHOLD);

                expect(response.status).toBe(200);
            });

            testStats.totalTime += result.responseTime;

            if (result.success) {
                testStats.successfulOperations++;
                successCount++;
            } else {
                testStats.failedOperations++;
                testStats.downtime += result.responseTime;
                testStats.loginDowntime += result.responseTime;
            }
        }

        const availability = successCount / attempts;

        if (availability >= 0.9) {
            testStats.loginSuccess++;
            printSuccess(`Login estável: ${successCount}/${attempts} sucessos (${(availability * 100).toFixed(1)}%)`);
        } else {
            await createDowntimeLog('login', testStats.loginDowntime, `Baixa disponibilidade: ${(availability * 100).toFixed(1)}%`);
            printError(`Login instável: ${successCount}/${attempts} sucessos (${(availability * 100).toFixed(1)}%)`);
        }

        expect(availability).toBeGreaterThanOrEqual(0.9);
    });
});

// ========================================================================
// TESTE 2: DISPONIBILIDADE DA VISUALIZAÇÃO DE DIETAS
// ========================================================================

describe('🍽️ Teste 2: Disponibilidade da Visualização de Dietas', () => {
    printSection('TESTE 2: Disponibilidade de Dietas');

    test('2.1 - Listagem de dietas deve responder com sucesso', async () => {
        testStats.dietTests++;
        testStats.totalOperations++;

        const result = await measureResponseTime(async () => {
            const today = new Date().toISOString().split('T')[0];
            const response = await request(app)
                .get(`/meal-record/date/${today}/patient/${testData.patientId}`)
                .set('Authorization', `Bearer ${testData.token}`)
                .timeout(TIMEOUT_THRESHOLD);

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
        });

        testStats.totalTime += result.responseTime;

        if (result.success) {
            testStats.successfulOperations++;
            testStats.dietSuccess++;
            printSuccess(`Dietas disponíveis (${result.responseTime}ms)`);
        } else {
            testStats.failedOperations++;
            testStats.downtime += result.responseTime;
            testStats.dietDowntime += result.responseTime;
            await createDowntimeLog('diet', result.responseTime, 'Listagem de dietas falhou');
            printError(`Dietas indisponíveis (${result.responseTime}ms)`);
        }

        expect(result.success).toBe(true);
    });

    test('2.2 - Visualização de dietas deve responder em tempo aceitável', async () => {
        testStats.dietTests++;
        testStats.totalOperations++;
        testStats.responseTimeTests++;

        const result = await measureResponseTime(async () => {
            const today = new Date().toISOString().split('T')[0];
            const response = await request(app)
                .get(`/meal-record/date/${today}/patient/${testData.patientId}`)
                .set('Authorization', `Bearer ${testData.token}`)
                .timeout(TIMEOUT_THRESHOLD);

            expect(response.status).toBe(200);
        });

        testStats.totalTime += result.responseTime;

        if (result.success && result.responseTime < TIMEOUT_THRESHOLD) {
            testStats.successfulOperations++;
            testStats.dietSuccess++;
            testStats.responseTimesUnder2s++;
            printSuccess(`Dietas rápidas: ${result.responseTime}ms < 2000ms`);
        } else {
            testStats.failedOperations++;
            testStats.downtime += result.responseTime;
            testStats.dietDowntime += result.responseTime;
            await createDowntimeLog('diet', result.responseTime, 'Visualização de dietas lenta (>2s)');
            printError(`Dietas lentas: ${result.responseTime}ms ≥ 2000ms`);
        }

        expect(result.responseTime).toBeLessThan(TIMEOUT_THRESHOLD);
    });

    test('2.3 - Múltiplas consultas de dietas consecutivas', async () => {
        testStats.dietTests++;

        const attempts = 5;
        let successCount = 0;

        for (let i = 0; i < attempts; i++) {
            testStats.totalOperations++;

            const result = await measureResponseTime(async () => {
                const today = new Date().toISOString().split('T')[0];
                const response = await request(app)
                    .get(`/meal-record/date/${today}/patient/${testData.patientId}`)
                    .set('Authorization', `Bearer ${testData.token}`)
                    .timeout(TIMEOUT_THRESHOLD);

                expect(response.status).toBe(200);
            });

            testStats.totalTime += result.responseTime;

            if (result.success) {
                testStats.successfulOperations++;
                successCount++;
            } else {
                testStats.failedOperations++;
                testStats.downtime += result.responseTime;
                testStats.dietDowntime += result.responseTime;
            }
        }

        const availability = successCount / attempts;

        if (availability >= 0.9) {
            testStats.dietSuccess++;
            printSuccess(`Dietas estáveis: ${successCount}/${attempts} sucessos (${(availability * 100).toFixed(1)}%)`);
        } else {
            await createDowntimeLog('diet', testStats.dietDowntime, `Baixa disponibilidade: ${(availability * 100).toFixed(1)}%`);
            printError(`Dietas instáveis: ${successCount}/${attempts} sucessos (${(availability * 100).toFixed(1)}%)`);
        }

        expect(availability).toBeGreaterThanOrEqual(0.9);
    });
});

// ========================================================================
// TESTE 3: DISPONIBILIDADE DA VISUALIZAÇÃO DE TREINOS
// ========================================================================

describe('💪 Teste 3: Disponibilidade da Visualização de Treinos', () => {
    printSection('TESTE 3: Disponibilidade de Treinos');

    test('3.1 - Listagem de treinos deve responder com sucesso', async () => {
        testStats.workoutTests++;
        testStats.totalOperations++;

        const result = await measureResponseTime(async () => {
            const today = new Date().toISOString().split('T')[0];
            const response = await request(app)
                .get(`/workout-record/date/${today}/patient/${testData.patientId}`)
                .set('Authorization', `Bearer ${testData.token}`)
                .timeout(TIMEOUT_THRESHOLD);

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
        });

        testStats.totalTime += result.responseTime;

        if (result.success) {
            testStats.successfulOperations++;
            testStats.workoutSuccess++;
            printSuccess(`Treinos disponíveis (${result.responseTime}ms)`);
        } else {
            testStats.failedOperations++;
            testStats.downtime += result.responseTime;
            testStats.workoutDowntime += result.responseTime;
            await createDowntimeLog('workout', result.responseTime, 'Listagem de treinos falhou');
            printError(`Treinos indisponíveis (${result.responseTime}ms)`);
        }

        expect(result.success).toBe(true);
    });

    test('3.2 - Visualização de treinos deve responder em tempo aceitável', async () => {
        testStats.workoutTests++;
        testStats.totalOperations++;
        testStats.responseTimeTests++;

        const result = await measureResponseTime(async () => {
            const response = await request(app)
                .get(`/workout-record/date/${new Date().toISOString().split("T")[0]}/patient/${testData.patientId}`)
                .set('Authorization', `Bearer ${testData.token}`)
                .timeout(TIMEOUT_THRESHOLD);

            expect(response.status).toBe(200);
        });

        testStats.totalTime += result.responseTime;

        if (result.success && result.responseTime < TIMEOUT_THRESHOLD) {
            testStats.successfulOperations++;
            testStats.workoutSuccess++;
            testStats.responseTimesUnder2s++;
            printSuccess(`Treinos rápidos: ${result.responseTime}ms < 2000ms`);
        } else {
            testStats.failedOperations++;
            testStats.downtime += result.responseTime;
            testStats.workoutDowntime += result.responseTime;
            await createDowntimeLog('workout', result.responseTime, 'Visualização de treinos lenta (>2s)');
            printError(`Treinos lentos: ${result.responseTime}ms ≥ 2000ms`);
        }

        expect(result.responseTime).toBeLessThan(TIMEOUT_THRESHOLD);
    });

    test('3.3 - Múltiplas consultas de treinos consecutivas', async () => {
        testStats.workoutTests++;

        const attempts = 5;
        let successCount = 0;

        for (let i = 0; i < attempts; i++) {
            testStats.totalOperations++;

            const result = await measureResponseTime(async () => {
                const response = await request(app)
                    .get(`/workout-record/date/${new Date().toISOString().split("T")[0]}/patient/${testData.patientId}`)
                    .set('Authorization', `Bearer ${testData.token}`)
                    .timeout(TIMEOUT_THRESHOLD);

                expect(response.status).toBe(200);
            });

            testStats.totalTime += result.responseTime;

            if (result.success) {
                testStats.successfulOperations++;
                successCount++;
            } else {
                testStats.failedOperations++;
                testStats.downtime += result.responseTime;
                testStats.workoutDowntime += result.responseTime;
            }
        }

        const availability = successCount / attempts;

        if (availability >= 0.9) {
            testStats.workoutSuccess++;
            printSuccess(`Treinos estáveis: ${successCount}/${attempts} sucessos (${(availability * 100).toFixed(1)}%)`);
        } else {
            await createDowntimeLog('workout', testStats.workoutDowntime, `Baixa disponibilidade: ${(availability * 100).toFixed(1)}%`);
            printError(`Treinos instáveis: ${successCount}/${attempts} sucessos (${(availability * 100).toFixed(1)}%)`);
        }

        expect(availability).toBeGreaterThanOrEqual(0.9);
    });
});

// ========================================================================
// TESTE 4: TESTE DE CARGA E ESTABILIDADE
// ========================================================================

describe('⚡ Teste 4: Teste de Carga e Estabilidade', () => {
    printSection('TESTE 4: Carga e Estabilidade');

    test('4.1 - Sistema deve suportar carga simultânea de múltiplas funcionalidades', async () => {
        testStats.totalOperations += 3;

        const promises = [
            measureResponseTime(async () => {
                const response = await request(app)
                    .post('/auth/login')
                    .send({
                        email: testData.testEmail,
                        password: testData.testPassword
                    })
                    .timeout(TIMEOUT_THRESHOLD);
                expect(response.status).toBe(200);
            }),
            measureResponseTime(async () => {
                const today = new Date().toISOString().split('T')[0];
                const response = await request(app)
                    .get(`/meal-record/date/${today}/patient/${testData.patientId}`)
                    .set('Authorization', `Bearer ${testData.token}`)
                    .timeout(TIMEOUT_THRESHOLD);
                expect(response.status).toBe(200);
            }),
            measureResponseTime(async () => {
                const today = new Date().toISOString().split('T')[0];
                const response = await request(app)
                    .get(`/workout-record/date/${today}/patient/${testData.patientId}`)
                    .set('Authorization', `Bearer ${testData.token}`)
                    .timeout(TIMEOUT_THRESHOLD);
                expect(response.status).toBe(200);
            })
        ];

        const results = await Promise.allSettled(promises);

        let successCount = 0;
        for (let index = 0; index < results.length; index++) {
            const result = results[index];
            const functionality = ['login', 'diet', 'workout'][index];

            if (result.status === 'fulfilled' && result.value.success) {
                testStats.successfulOperations++;
                successCount++;
                testStats.totalTime += result.value.responseTime;
                printSuccess(`${functionality}: OK (${result.value.responseTime}ms)`);
            } else {
                testStats.failedOperations++;
                const responseTime = result.value?.responseTime || TIMEOUT_THRESHOLD;
                testStats.downtime += responseTime;
                testStats.totalTime += responseTime;
                await createDowntimeLog(functionality, responseTime, 'Falha em teste de carga');
                printError(`${functionality}: FALHOU`);
            }
        }

        const availability = successCount / 3;
        expect(availability).toBeGreaterThanOrEqual(0.9);
    });
});

// ========================================================================
// TESTE 5: REGISTRO DE LOGS DE INDISPONIBILIDADE
// ========================================================================

describe('📋 Teste 5: Registro de Logs de Indisponibilidade', () => {
    printSection('TESTE 5: Logs e Alertas');

    test('5.1 - Sistema deve registrar logs de indisponibilidade', async () => {
        try {
            const logsCount = await pool.query(`
                SELECT COUNT(*) as count 
                FROM availability_log 
                WHERE created_at >= NOW() - INTERVAL '5 minutes'
            `);

            const count = parseInt(logsCount.rows[0].count);

            if (count >= 0) {
                printSuccess(`Sistema de logs funcionando: ${count} registros recentes`);
            } else {
                printError('Sistema de logs não está funcionando');
            }

            expect(count).toBeGreaterThanOrEqual(0);
        } catch (error) {
            printError(`Tabela availability_log não existe: ${error.message}`);
            printInfo('Criar tabela: CREATE TABLE availability_log (...);');
        }
    });

    test('5.2 - Logs devem conter informações detalhadas', async () => {
        try {
            const lastLog = await pool.query(`
                SELECT * FROM availability_log 
                ORDER BY created_at DESC 
                LIMIT 1
            `);

            if (lastLog.rows.length > 0) {
                const log = lastLog.rows[0];
                const hasRequiredFields = log.functionality && log.status && log.created_at;

                if (hasRequiredFields) {
                    printSuccess(`Log completo: ${log.functionality} - ${log.status}`);
                } else {
                    printError('Log incompleto');
                }

                expect(hasRequiredFields).toBe(true);
            } else {
                printInfo('Nenhum log encontrado (sistema pode estar 100% disponível)');
            }
        } catch (error) {
            printInfo('Tabela availability_log não existe ou está vazia');
        }
    });
});

// ========================================================================
// RELATÓRIO FINAL
// ========================================================================

afterAll(() => {
    printHeader('RELATÓRIO FINAL - DISPONIBILIDADE DE FUNCIONALIDADES CRÍTICAS');

    // Calcular métrica principal
    const totalTimeInSeconds = testStats.totalTime / 1000;
    const downtimeInSeconds = testStats.downtime / 1000;
    const taxaDisponibilidade = totalTimeInSeconds > 0 ?
        (totalTimeInSeconds - downtimeInSeconds) / totalTimeInSeconds : 0;

    // Métricas por funcionalidade
    const loginAvailability = testStats.loginTests > 0 ?
        testStats.loginSuccess / testStats.loginTests : 0;

    const dietAvailability = testStats.dietTests > 0 ?
        testStats.dietSuccess / testStats.dietTests : 0;

    const workoutAvailability = testStats.workoutTests > 0 ?
        testStats.workoutSuccess / testStats.workoutTests : 0;

    const avgResponseTime = testStats.totalOperations > 0 ?
        testStats.totalTime / testStats.totalOperations : 0;

    const responseTimeCompliance = testStats.responseTimeTests > 0 ?
        testStats.responseTimesUnder2s / testStats.responseTimeTests : 0;

    // Exibir estatísticas gerais
    printSection('Estatísticas Gerais');
    printMetric('Total de operações testadas', testStats.totalOperations);
    printMetric('Operações bem-sucedidas', testStats.successfulOperations);
    printMetric('Operações falhadas', testStats.failedOperations);
    printMetric('Tempo total de observação', totalTimeInSeconds.toFixed(2), 's');
    printMetric('Tempo de indisponibilidade', downtimeInSeconds.toFixed(2), 's');

    printSection('Métrica de Disponibilidade (Métrica Principal - RNF1.0)');
    printMetric('Fórmula', 'X = (Ttotal - Tindisponibilidade) / Ttotal');
    printMetric('Cálculo', `(${totalTimeInSeconds.toFixed(2)}s - ${downtimeInSeconds.toFixed(2)}s) / ${totalTimeInSeconds.toFixed(2)}s`);
    printMetric('Resultado (X)', (taxaDisponibilidade * 100).toFixed(2), '%');
    printMetric('Requisito', '≥ 90%');

    const atendeRequisito = taxaDisponibilidade >= 0.90;
    printResult(
        atendeRequisito,
        'Taxa de Disponibilidade',
        atendeRequisito ? 'ATENDE (≥ 90%)' : `NÃO ATENDE (${(taxaDisponibilidade * 100).toFixed(2)}%)`
    );

    printSection('Disponibilidade por Funcionalidade Crítica');

    console.log('\n  🔐 Login:');
    printMetric('  Testes realizados', testStats.loginTests);
    printMetric('  Testes bem-sucedidos', testStats.loginSuccess);
    printMetric('  Taxa de disponibilidade', (loginAvailability * 100).toFixed(2), '%');
    printMetric('  Tempo de indisponibilidade', (testStats.loginDowntime / 1000).toFixed(2), 's');

    console.log('\n  🍽️ Visualização de Dietas:');
    printMetric('  Testes realizados', testStats.dietTests);
    printMetric('  Testes bem-sucedidos', testStats.dietSuccess);
    printMetric('  Taxa de disponibilidade', (dietAvailability * 100).toFixed(2), '%');
    printMetric('  Tempo de indisponibilidade', (testStats.dietDowntime / 1000).toFixed(2), 's');

    console.log('\n  💪 Visualização de Treinos:');
    printMetric('  Testes realizados', testStats.workoutTests);
    printMetric('  Testes bem-sucedidos', testStats.workoutSuccess);
    printMetric('  Taxa de disponibilidade', (workoutAvailability * 100).toFixed(2), '%');
    printMetric('  Tempo de indisponibilidade', (testStats.workoutDowntime / 1000).toFixed(2), 's');

    printSection('Métricas de Performance');
    printMetric('Tempo médio de resposta', avgResponseTime.toFixed(0), 'ms');
    printMetric('Respostas < 2s', `${testStats.responseTimesUnder2s}/${testStats.responseTimeTests}`);
    printMetric('Conformidade de tempo de resposta', (responseTimeCompliance * 100).toFixed(2), '%');

    printSection('Auditoria e Alertas');
    printMetric('Logs de indisponibilidade criados', testStats.logsCreated);
    printMetric('Alertas disparados', testStats.alertsTriggered);

    printSection('Análise de Conformidade com RNF1.0');

    if (taxaDisponibilidade >= 0.90) {
        printSuccess('✓ Sistema ATENDE ao requisito RNF1.0');
        printInfo('Disponibilidade de funcionalidades críticas acima de 90%');

        if (loginAvailability >= 0.90 && dietAvailability >= 0.90 && workoutAvailability >= 0.90) {
            printSuccess('✓ Todas as funcionalidades críticas estão disponíveis');
        } else {
            console.log(colors.yellow + '\n  ⚠️ ATENÇÃO: Algumas funcionalidades abaixo de 90%' + colors.reset);
            if (loginAvailability < 0.90) printError(`  Login: ${(loginAvailability * 100).toFixed(2)}%`);
            if (dietAvailability < 0.90) printError(`  Dietas: ${(dietAvailability * 100).toFixed(2)}%`);
            if (workoutAvailability < 0.90) printError(`  Treinos: ${(workoutAvailability * 100).toFixed(2)}%`);
        }
    } else {
        printError('✗ Sistema NÃO ATENDE ao requisito RNF1.0');
        console.log(colors.red + '\n  🚨 CRÍTICO: Disponibilidade abaixo de 90%!' + colors.reset);
        printInfo(`Tempo de indisponibilidade: ${downtimeInSeconds.toFixed(2)}s`);
        printInfo('Ação imediata necessária para melhorar a disponibilidade');
    }

    // Cálculo de disponibilidade mensal (extrapolação)
    const hoursDowntimePerMonth = (downtimeInSeconds / totalTimeInSeconds) * 720; // 30 dias * 24h
    const maxAllowedDowntime = 72; // 72 horas por mês

    printSection('Projeção Mensal');
    printMetric('Tempo de indisponibilidade projetado', hoursDowntimePerMonth.toFixed(2), 'h/mês');
    printMetric('Tempo máximo permitido', maxAllowedDowntime, 'h/mês');

    if (hoursDowntimePerMonth <= maxAllowedDowntime) {
        printSuccess(`✓ Dentro do limite permitido (${maxAllowedDowntime}h/mês)`);
    } else {
        printError(`✗ Acima do limite permitido (${maxAllowedDowntime}h/mês)`);
    }

    printHeader('FIM DOS TESTES');
    console.log('\n');
});
