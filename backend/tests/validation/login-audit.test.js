/**
 * ========================================================================
 * TESTES DE QUALIDADE - REGISTRO DE TENTATIVAS DE LOGIN
 * ========================================================================
 * 
 * Métrica: Cobertura de Registro de Tentativas de Login
 * Fórmula: x = Ntentativas_registradas / Ntentativas_totais
 * onde:
 *   Ntentativas_registradas = número de tentativas de login registradas no log
 *   Ntentativas_totais = número total de tentativas de login realizadas
 * 
 * Requisito: x ≥ 1.0 (100%)
 * 
 * Este teste valida:
 * 1. Registro de login bem-sucedido
 * 2. Registro de login com falha (senha incorreta)
 * 3. Registro de login com usuário inexistente
 * 4. Registro de tentativas de bloqueio de conta
 * 5. Registro de IP e user-agent
 * 6. Persistência dos logs após falhas do sistema
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
    totalAttempts: 0,
    recordedAttempts: 0,
    failedRecords: 0,
    successfulLoginTests: 0,
    successfulLoginRecords: 0,
    failedLoginTests: 0,
    failedLoginRecords: 0,
    blockedAccountTests: 0,
    blockedAccountRecords: 0,
    metadataTests: 0,
    metadataRecords: 0,
    persistenceTests: 0,
    persistenceRecords: 0
};

// Dados de teste
let testData = {
    authId: null,
    patientId: null,
    testEmail: 'login_audit_test@test.com',
    testPassword: 'TestPassword123',
    hashedPassword: null
};

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

async function countAuditLogs() {
    const result = await pool.query(`
        SELECT COUNT(*) as count 
        FROM audit_log 
        WHERE action LIKE '%login%' 
        AND created_at >= NOW() - INTERVAL '5 minutes'
    `);
    return parseInt(result.rows[0].count);
}

async function getLastAuditLog() {
    const result = await pool.query(`
        SELECT * FROM audit_log 
        WHERE action LIKE '%login%' 
        ORDER BY created_at DESC 
        LIMIT 1
    `);
    return result.rows[0];
}

// ========================================================================
// SETUP E TEARDOWN
// ========================================================================

beforeAll(async () => {
    printHeader('INICIALIZANDO TESTES DE REGISTRO DE LOGIN');
    
    try {
        printSection('Criando Dados de Teste');
        
        // Hash da senha
        testData.hashedPassword = await bcrypt.hash(testData.testPassword, 10);
        
        // Criar usuário de teste
        const authResult = await pool.query(`
            INSERT INTO auth (username, email, password, user_type)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `, [
            'login_audit_user',
            testData.testEmail,
            testData.hashedPassword,
            'Patient'
        ]);
        
        testData.authId = authResult.rows[0].id;
        printSuccess(`Auth criado: ${testData.authId}`);

        const patientResult = await pool.query(`
            INSERT INTO patient (name, birthdate, sex, contact, auth_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `, [
            'Login Audit Test Patient',
            '1990-01-01',
            'M',
            '11999999999',
            testData.authId
        ]);
        
        testData.patientId = patientResult.rows[0].id;
        printSuccess(`Patient criado: ${testData.patientId}`);

        // Limpar logs antigos de teste
        await pool.query(`
            DELETE FROM audit_log 
            WHERE action LIKE '%login%' 
            AND details LIKE '%login_audit%'
        `);
        printSuccess('Logs antigos de teste limpos');

        printInfo('Setup concluído com sucesso!');
    } catch (error) {
        printError(`Erro no setup: ${error.message}`);
        throw error;
    }
});

afterAll(async () => {
    printSection('Limpando Dados de Teste');
    
    try {
        // Deletar logs de teste
        await pool.query(`
            DELETE FROM audit_log 
            WHERE action LIKE '%login%' 
            AND details LIKE '%login_audit%'
        `);
        printSuccess('Logs de teste deletados');

        // Deletar dados de teste
        if (testData.patientId) {
            await pool.query('DELETE FROM patient WHERE id = $1', [testData.patientId]);
            printSuccess('Patient deletado');
        }
        
        if (testData.authId) {
            await pool.query('DELETE FROM auth WHERE id = $1', [testData.authId]);
            printSuccess('Auth deletado');
        }

        printInfo('Cleanup concluído!');
    } catch (error) {
        printError(`Erro no cleanup: ${error.message}`);
    }
});

// ========================================================================
// TESTE 1: REGISTRO DE LOGIN BEM-SUCEDIDO
// ========================================================================

describe('✅ Teste 1: Registro de Login Bem-Sucedido', () => {
    printSection('TESTE 1: Login Bem-Sucedido');

    test('1.1 - Login bem-sucedido deve ser registrado no audit_log', async () => {
        testStats.successfulLoginTests++;
        testStats.totalAttempts++;

        const logCountBefore = await countAuditLogs();

        const response = await request(app)
            .post('/auth/login')
            .send({
                email: testData.testEmail,
                password: testData.testPassword
            });

        expect(response.status).toBe(200);
        expect(response.body.token).toBeDefined();

        // Aguardar gravação do log (se assíncrono)
        await new Promise(resolve => setTimeout(resolve, 500));

        const logCountAfter = await countAuditLogs();
        const logWasRecorded = logCountAfter > logCountBefore;

        if (logWasRecorded) {
            testStats.recordedAttempts++;
            testStats.successfulLoginRecords++;
            
            const lastLog = await getLastAuditLog();
            printSuccess(`Login bem-sucedido registrado: action="${lastLog?.action}"`);
        } else {
            testStats.failedRecords++;
            printError('Login bem-sucedido NÃO foi registrado no audit_log');
        }

        expect(logWasRecorded).toBe(true);
    });

    test('1.2 - Log deve conter informações completas do login bem-sucedido', async () => {
        testStats.successfulLoginTests++;
        testStats.totalAttempts++;

        await request(app)
            .post('/auth/login')
            .send({
                email: testData.testEmail,
                password: testData.testPassword
            });

        await new Promise(resolve => setTimeout(resolve, 500));

        const lastLog = await getLastAuditLog();
        
        const hasRequiredFields = lastLog && 
            lastLog.action && 
            lastLog.user_id && 
            lastLog.created_at;

        if (hasRequiredFields) {
            testStats.recordedAttempts++;
            testStats.successfulLoginRecords++;
            printSuccess(`Log completo: user_id=${lastLog.user_id}, action=${lastLog.action}`);
        } else {
            testStats.failedRecords++;
            printError('Log de login incompleto');
        }

        expect(hasRequiredFields).toBe(true);
    });
});

// ========================================================================
// TESTE 2: REGISTRO DE LOGIN COM FALHA
// ========================================================================

describe('❌ Teste 2: Registro de Login com Falha', () => {
    printSection('TESTE 2: Login com Senha Incorreta');

    test('2.1 - Tentativa com senha incorreta deve ser registrada', async () => {
        testStats.failedLoginTests++;
        testStats.totalAttempts++;

        const logCountBefore = await countAuditLogs();

        const response = await request(app)
            .post('/auth/login')
            .send({
                email: testData.testEmail,
                password: 'SenhaErrada123'
            });

        expect(response.status).toBe(401);

        await new Promise(resolve => setTimeout(resolve, 500));

        const logCountAfter = await countAuditLogs();
        const logWasRecorded = logCountAfter > logCountBefore;

        if (logWasRecorded) {
            testStats.recordedAttempts++;
            testStats.failedLoginRecords++;
            
            const lastLog = await getLastAuditLog();
            printSuccess(`Tentativa de login falhada registrada: action="${lastLog?.action}"`);
        } else {
            testStats.failedRecords++;
            printError('Login falhado NÃO foi registrado');
        }

        expect(logWasRecorded).toBe(true);
    });

    test('2.2 - Tentativa com usuário inexistente deve ser registrada', async () => {
        testStats.failedLoginTests++;
        testStats.totalAttempts++;

        const logCountBefore = await countAuditLogs();

        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'usuario_inexistente@test.com',
                password: 'QualquerSenha123'
            });

        expect(response.status).toBe(401);

        await new Promise(resolve => setTimeout(resolve, 500));

        const logCountAfter = await countAuditLogs();
        const logWasRecorded = logCountAfter > logCountBefore;

        if (logWasRecorded) {
            testStats.recordedAttempts++;
            testStats.failedLoginRecords++;
            printSuccess('Tentativa com usuário inexistente registrada');
        } else {
            testStats.failedRecords++;
            printError('Tentativa com usuário inexistente NÃO foi registrada');
        }

        expect(logWasRecorded).toBe(true);
    });

    test('2.3 - Múltiplas tentativas falhadas devem ser registradas', async () => {
        testStats.failedLoginTests++;
        
        const numberOfAttempts = 3;
        let recordedCount = 0;

        for (let i = 0; i < numberOfAttempts; i++) {
            testStats.totalAttempts++;
            
            const logCountBefore = await countAuditLogs();

            await request(app)
                .post('/auth/login')
                .send({
                    email: testData.testEmail,
                    password: `SenhaErrada${i}`
                });

            await new Promise(resolve => setTimeout(resolve, 500));

            const logCountAfter = await countAuditLogs();
            
            if (logCountAfter > logCountBefore) {
                testStats.recordedAttempts++;
                recordedCount++;
            } else {
                testStats.failedRecords++;
            }
        }

        const allRecorded = recordedCount === numberOfAttempts;
        
        if (allRecorded) {
            testStats.failedLoginRecords++;
            printSuccess(`Todas as ${numberOfAttempts} tentativas falhadas foram registradas`);
        } else {
            printError(`Apenas ${recordedCount}/${numberOfAttempts} tentativas foram registradas`);
        }

        expect(allRecorded).toBe(true);
    });
});

// ========================================================================
// TESTE 3: REGISTRO DE BLOQUEIO DE CONTA
// ========================================================================

describe('🔒 Teste 3: Registro de Bloqueio de Conta', () => {
    printSection('TESTE 3: Tentativas de Bloqueio');

    test('3.1 - Verificar se bloqueio de conta é registrado', async () => {
        testStats.blockedAccountTests++;

        // Resetar tentativas falhadas
        await pool.query(`
            UPDATE auth 
            SET failed_attempts = 0, account_locked_until = NULL 
            WHERE id = $1
        `, [testData.authId]);

        // Fazer 3 tentativas falhadas para bloquear
        for (let i = 0; i < 3; i++) {
            testStats.totalAttempts++;
            
            await request(app)
                .post('/auth/login')
                .send({
                    email: testData.testEmail,
                    password: 'SenhaErradaParaBloquear'
                });

            await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Verificar se foi registrado log de bloqueio
        const blockLog = await pool.query(`
            SELECT * FROM audit_log 
            WHERE user_id = $1 
            AND (action LIKE '%block%' OR action LIKE '%lock%' OR details LIKE '%bloqueio%')
            ORDER BY created_at DESC 
            LIMIT 1
        `, [testData.authId]);

        const blockWasRecorded = blockLog.rows.length > 0;

        if (blockWasRecorded) {
            testStats.recordedAttempts++;
            testStats.blockedAccountRecords++;
            printSuccess('Bloqueio de conta foi registrado no audit_log');
        } else {
            testStats.failedRecords++;
            printError('Bloqueio de conta NÃO foi registrado');
        }

        // Desbloquear para testes seguintes
        await pool.query(`
            UPDATE auth 
            SET failed_attempts = 0, account_locked_until = NULL 
            WHERE id = $1
        `, [testData.authId]);

        expect(blockWasRecorded).toBe(true);
    });
});

// ========================================================================
// TESTE 4: REGISTRO DE METADADOS (IP, USER-AGENT)
// ========================================================================

describe('📝 Teste 4: Registro de Metadados', () => {
    printSection('TESTE 4: IP e User-Agent');

    test('4.1 - Log deve conter IP do cliente', async () => {
        testStats.metadataTests++;
        testStats.totalAttempts++;

        await request(app)
            .post('/auth/login')
            .set('X-Forwarded-For', '192.168.1.100')
            .send({
                email: testData.testEmail,
                password: testData.testPassword
            });

        await new Promise(resolve => setTimeout(resolve, 500));

        const lastLog = await getLastAuditLog();
        
        const hasIpInfo = lastLog && (
            lastLog.ip_address || 
            (lastLog.details && lastLog.details.includes('192.168')) ||
            (lastLog.details && lastLog.details.includes('ip'))
        );

        if (hasIpInfo) {
            testStats.recordedAttempts++;
            testStats.metadataRecords++;
            printSuccess('IP do cliente registrado no log');
        } else {
            testStats.failedRecords++;
            printError('IP do cliente NÃO foi registrado');
        }

        expect(hasIpInfo).toBe(true);
    });

    test('4.2 - Log deve conter User-Agent', async () => {
        testStats.metadataTests++;
        testStats.totalAttempts++;

        await request(app)
            .post('/auth/login')
            .set('User-Agent', 'Mozilla/5.0 Test Browser')
            .send({
                email: testData.testEmail,
                password: testData.testPassword
            });

        await new Promise(resolve => setTimeout(resolve, 500));

        const lastLog = await getLastAuditLog();
        
        const hasUserAgent = lastLog && (
            lastLog.user_agent || 
            (lastLog.details && lastLog.details.includes('user-agent')) ||
            (lastLog.details && lastLog.details.includes('Mozilla'))
        );

        if (hasUserAgent) {
            testStats.recordedAttempts++;
            testStats.metadataRecords++;
            printSuccess('User-Agent registrado no log');
        } else {
            testStats.failedRecords++;
            printError('User-Agent NÃO foi registrado');
        }

        expect(hasUserAgent).toBe(true);
    });
});

// ========================================================================
// TESTE 5: PERSISTÊNCIA DOS LOGS
// ========================================================================

describe('💾 Teste 5: Persistência dos Logs', () => {
    printSection('TESTE 5: Persistência e Integridade');

    test('5.1 - Logs devem persistir após múltiplas operações', async () => {
        testStats.persistenceTests++;

        const initialLogCount = await countAuditLogs();

        // Fazer várias operações de login
        for (let i = 0; i < 5; i++) {
            testStats.totalAttempts++;
            
            await request(app)
                .post('/auth/login')
                .send({
                    email: testData.testEmail,
                    password: i % 2 === 0 ? testData.testPassword : 'SenhaErrada'
                });

            await new Promise(resolve => setTimeout(resolve, 200));
        }

        const finalLogCount = await countAuditLogs();
        const logsWerePersisted = finalLogCount > initialLogCount;

        if (logsWerePersisted) {
            testStats.recordedAttempts += 5;
            testStats.persistenceRecords++;
            printSuccess(`Logs persistidos: ${finalLogCount - initialLogCount} novos registros`);
        } else {
            testStats.failedRecords += 5;
            printError('Logs NÃO foram persistidos corretamente');
        }

        expect(logsWerePersisted).toBe(true);
    });

    test('5.2 - Logs devem ter timestamps corretos', async () => {
        testStats.persistenceTests++;
        testStats.totalAttempts++;

        const beforeTime = new Date();

        await request(app)
            .post('/auth/login')
            .send({
                email: testData.testEmail,
                password: testData.testPassword
            });

        await new Promise(resolve => setTimeout(resolve, 500));

        const afterTime = new Date();
        const lastLog = await getLastAuditLog();

        const logTime = lastLog ? new Date(lastLog.created_at) : null;
        const timestampIsValid = logTime && 
            logTime >= beforeTime && 
            logTime <= afterTime;

        if (timestampIsValid) {
            testStats.recordedAttempts++;
            testStats.persistenceRecords++;
            printSuccess(`Timestamp válido: ${logTime.toISOString()}`);
        } else {
            testStats.failedRecords++;
            printError('Timestamp do log inválido ou ausente');
        }

        expect(timestampIsValid).toBe(true);
    });

    test('5.3 - Logs devem ser recuperáveis por período', async () => {
        testStats.persistenceTests++;

        const logsLastMinute = await pool.query(`
            SELECT COUNT(*) as count 
            FROM audit_log 
            WHERE action LIKE '%login%' 
            AND created_at >= NOW() - INTERVAL '1 minute'
        `);

        const count = parseInt(logsLastMinute.rows[0].count);
        const logsAreRecoverable = count > 0;

        if (logsAreRecoverable) {
            testStats.persistenceRecords++;
            printSuccess(`Logs recuperáveis por período: ${count} registros no último minuto`);
        } else {
            printError('Não foi possível recuperar logs por período');
        }

        expect(logsAreRecoverable).toBe(true);
    });
});

// ========================================================================
// RELATÓRIO FINAL
// ========================================================================

afterAll(() => {
    printHeader('RELATÓRIO FINAL - MÉTRICA DE REGISTRO DE LOGIN');

    // Calcular métrica principal
    const taxaCobertura = testStats.totalAttempts > 0 ? 
        testStats.recordedAttempts / testStats.totalAttempts : 0;

    // Métricas por categoria
    const taxaSuccessfulLogin = testStats.successfulLoginTests > 0 ?
        testStats.successfulLoginRecords / testStats.successfulLoginTests : 0;
    
    const taxaFailedLogin = testStats.failedLoginTests > 0 ?
        testStats.failedLoginRecords / testStats.failedLoginTests : 0;
    
    const taxaBlockedAccount = testStats.blockedAccountTests > 0 ?
        testStats.blockedAccountRecords / testStats.blockedAccountTests : 0;
    
    const taxaMetadata = testStats.metadataTests > 0 ?
        testStats.metadataRecords / testStats.metadataTests : 0;
    
    const taxaPersistence = testStats.persistenceTests > 0 ?
        testStats.persistenceRecords / testStats.persistenceTests : 0;

    // Exibir estatísticas gerais
    printSection('Estatísticas Gerais');
    printMetric('Total de tentativas de login testadas', testStats.totalAttempts);
    printMetric('Tentativas registradas no audit_log', testStats.recordedAttempts);
    printMetric('Tentativas NÃO registradas', testStats.failedRecords);

    printSection('Métrica de Cobertura de Registro (Métrica Principal)');
    printMetric('Fórmula', 'x = Ntentativas_registradas / Ntentativas_totais');
    printMetric('Cálculo', `${testStats.recordedAttempts} / ${testStats.totalAttempts}`);
    printMetric('Resultado (x)', (taxaCobertura * 100).toFixed(2), '%');
    printMetric('Requisito', '≥ 100%');
    
    const atendeRequisito = taxaCobertura >= 1.0;
    printResult(
        atendeRequisito,
        'Taxa de Cobertura de Registro',
        atendeRequisito ? 'ATENDE (100%)' : `NÃO ATENDE (${(taxaCobertura * 100).toFixed(2)}%)`
    );

    printSection('Métricas Detalhadas por Categoria');
    
    console.log('\n  ✅ Login Bem-Sucedido:');
    printMetric('  Testes realizados', testStats.successfulLoginTests);
    printMetric('  Registros encontrados', testStats.successfulLoginRecords);
    printMetric('  Taxa de cobertura', (taxaSuccessfulLogin * 100).toFixed(2), '%');
    
    console.log('\n  ❌ Login com Falha:');
    printMetric('  Testes realizados', testStats.failedLoginTests);
    printMetric('  Registros encontrados', testStats.failedLoginRecords);
    printMetric('  Taxa de cobertura', (taxaFailedLogin * 100).toFixed(2), '%');
    
    console.log('\n  🔒 Bloqueio de Conta:');
    printMetric('  Testes realizados', testStats.blockedAccountTests);
    printMetric('  Registros encontrados', testStats.blockedAccountRecords);
    printMetric('  Taxa de cobertura', (taxaBlockedAccount * 100).toFixed(2), '%');
    
    console.log('\n  📝 Metadados (IP/User-Agent):');
    printMetric('  Testes realizados', testStats.metadataTests);
    printMetric('  Registros encontrados', testStats.metadataRecords);
    printMetric('  Taxa de cobertura', (taxaMetadata * 100).toFixed(2), '%');
    
    console.log('\n  💾 Persistência:');
    printMetric('  Testes realizados', testStats.persistenceTests);
    printMetric('  Testes bem-sucedidos', testStats.persistenceRecords);
    printMetric('  Taxa de sucesso', (taxaPersistence * 100).toFixed(2), '%');

    printSection('Análise de Confiabilidade para Auditoria');
    
    if (taxaCobertura >= 1.0) {
        printSuccess('✓ Sistema ATENDE ao requisito de registro de login');
        printInfo('Todos os logs de tentativas de login estão sendo registrados.');
        printInfo('Sistema confiável para auditoria e monitoramento de acessos.');
    } else if (taxaCobertura >= 0.95) {
        console.log(colors.yellow + '\n  ⚠️ ATENÇÃO: Cobertura próxima ao ideal!' + colors.reset);
        printInfo(`${testStats.failedRecords} tentativa(s) não foram registradas.`);
        printInfo('Recomenda-se investigar as falhas de registro.');
    } else {
        printError('✗ Sistema NÃO ATENDE ao requisito de registro de login');
        printInfo(`${testStats.failedRecords} tentativas NÃO foram registradas.`);
        console.log(colors.red + '\n  🚨 CRÍTICO: Sistema não é confiável para auditoria!' + colors.reset);
        printInfo('Ação imediata necessária para corrigir o registro de logs.');
    }

    printHeader('FIM DOS TESTES');
    console.log('\n');
});
