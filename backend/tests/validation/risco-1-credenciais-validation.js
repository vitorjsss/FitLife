#!/usr/bin/env node

/**
 * ========================================
 * TESTES DE VALIDAÇÃO - RISCO 1
 * Sistema: FitLife
 * Parâmetro: Validação de Credenciais
 * Risco Original: 8 (Alto)
 * ========================================
 */

import {
    validateEmail,
    validatePassword,
    validateUsername,
    validateLoginCredentials,
    validateRegisterCredentials,
    normalizeEmail,
    normalizeUsername
} from '../../src/utils/validationRules.js';

// Cores ANSI para output
const colors = {
    reset: '\x1b[0m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
};

function runTest(testName, testFn) {
    testResults.total++;
    console.log(`\n${colors.blue}Teste ${testResults.total}: ${testName}${colors.reset}`);
    try {
        testFn();
        testResults.passed++;
        testResults.details.push({ name: testName, status: 'PASSED' });
        console.log(`${colors.green}✓ Passou${colors.reset}`);
    } catch (error) {
        testResults.failed++;
        testResults.details.push({ name: testName, status: 'FAILED', error: error.message });
        console.log(`${colors.red}✗ Falhou: ${error.message}${colors.reset}`);
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function printHeader() {
    console.log(`${colors.cyan}`);
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║  VALIDAÇÃO - RISCO 8: Credenciais Login       ║');
    console.log('║  Sistema: FitLife                              ║');
    console.log('║  Data: 27/11/2025                             ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log(`${colors.reset}\n`);
}

// ============================================
// TESTES DE EMAIL
// ============================================

function testEmailValidation() {
    console.log(`${colors.cyan}\n[1/6] Testando validação de email...${colors.reset}`);

    // Emails válidos
    runTest('Deve aceitar email válido simples', () => {
        const result = validateEmail('user@example.com');
        assert(result.valid === true, `Esperado válido, recebido: ${JSON.stringify(result)}`);
    });

    runTest('Deve aceitar email com subdomínio', () => {
        const result = validateEmail('user@mail.example.com');
        assert(result.valid === true, `Esperado válido, recebido: ${JSON.stringify(result)}`);
    });

    runTest('Deve aceitar email com caracteres especiais válidos', () => {
        const result = validateEmail('user.name+tag@example.co.uk');
        assert(result.valid === true, `Esperado válido, recebido: ${JSON.stringify(result)}`);
    });

    runTest('Deve aceitar email com números', () => {
        const result = validateEmail('user123@example456.com');
        assert(result.valid === true, `Esperado válido, recebido: ${JSON.stringify(result)}`);
    });

    // Emails inválidos
    runTest('Deve rejeitar email sem @', () => {
        const result = validateEmail('userexample.com');
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
        assert(result.error !== null, 'Erro deve ser informado');
    });

    runTest('Deve rejeitar email sem domínio', () => {
        const result = validateEmail('user@');
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
    });

    runTest('Deve rejeitar email sem parte local', () => {
        const result = validateEmail('@example.com');
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
    });

    runTest('Deve rejeitar email com pontos consecutivos', () => {
        const result = validateEmail('user..name@example.com');
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
    });

    runTest('Deve rejeitar email começando com ponto', () => {
        const result = validateEmail('.user@example.com');
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
    });

    runTest('Deve rejeitar email terminando com ponto', () => {
        const result = validateEmail('user.@example.com');
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
    });

    runTest('Deve rejeitar email sem TLD', () => {
        const result = validateEmail('user@example');
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
    });

    runTest('Deve rejeitar email muito curto', () => {
        const result = validateEmail('a@b.c');
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
    });

    runTest('Deve rejeitar email vazio', () => {
        const result = validateEmail('');
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
    });

    runTest('Deve rejeitar email null', () => {
        const result = validateEmail(null);
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
    });
}

// ============================================
// TESTES DE SENHA
// ============================================

function testPasswordValidation() {
    console.log(`${colors.cyan}\n[2/6] Testando validação de senha...${colors.reset}`);

    // Senhas válidas
    runTest('Deve aceitar senha forte válida', () => {
        const result = validatePassword('Test@123');
        assert(result.valid === true, `Esperado válido, recebido: ${JSON.stringify(result)}`);
        assert(result.strength !== 'none', 'Força deve ser informada');
    });

    runTest('Deve aceitar senha muito forte', () => {
        const result = validatePassword('MyVeryStr0ng!P@ssw0rd2024');
        assert(result.valid === true, `Esperado válido, recebido: ${JSON.stringify(result)}`);
        assert(result.strength === 'very_strong' || result.strength === 'strong', 'Senha deve ser classificada como forte');
    });

    runTest('Deve aceitar senha com todos os caracteres especiais permitidos', () => {
        const result = validatePassword('Abc123!@#$%');
        assert(result.valid === true, `Esperado válido, recebido: ${JSON.stringify(result)}`);
    });

    // Senhas inválidas
    runTest('Deve rejeitar senha muito curta', () => {
        const result = validatePassword('Test@1');
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
        assert(result.error.includes('8 caracteres'), 'Erro deve mencionar tamanho mínimo');
    });

    runTest('Deve rejeitar senha sem letra maiúscula', () => {
        const result = validatePassword('test@123');
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
        assert(result.error.includes('maiúscula'), 'Erro deve mencionar letra maiúscula');
    });

    runTest('Deve rejeitar senha sem letra minúscula', () => {
        const result = validatePassword('TEST@123');
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
        assert(result.error.includes('minúscula'), 'Erro deve mencionar letra minúscula');
    });

    runTest('Deve rejeitar senha sem número', () => {
        const result = validatePassword('Test@Test');
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
        assert(result.error.includes('número'), 'Erro deve mencionar número');
    });

    runTest('Deve rejeitar senha sem caractere especial', () => {
        const result = validatePassword('Test1234');
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
        assert(result.error.includes('especial'), 'Erro deve mencionar caractere especial');
    });

    runTest('Deve rejeitar senha com sequência comum', () => {
        const result = validatePassword('Pass12345!');
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
        assert(result.error.includes('comum'), 'Erro deve mencionar sequência comum');
    });

    runTest('Deve rejeitar senha vazia', () => {
        const result = validatePassword('');
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
    });

    runTest('Deve rejeitar senha null', () => {
        const result = validatePassword(null);
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
    });
}

// ============================================
// TESTES DE USERNAME
// ============================================

function testUsernameValidation() {
    console.log(`${colors.cyan}\n[3/6] Testando validação de username...${colors.reset}`);

    // Usernames válidos
    runTest('Deve aceitar username válido simples', () => {
        const result = validateUsername('johndoe');
        assert(result.valid === true, `Esperado válido, recebido: ${JSON.stringify(result)}`);
    });

    runTest('Deve aceitar username com números', () => {
        const result = validateUsername('user123');
        assert(result.valid === true, `Esperado válido, recebido: ${JSON.stringify(result)}`);
    });

    runTest('Deve aceitar username com underscore', () => {
        const result = validateUsername('user_name');
        assert(result.valid === true, `Esperado válido, recebido: ${JSON.stringify(result)}`);
    });

    runTest('Deve aceitar username com hífen', () => {
        const result = validateUsername('user-name');
        assert(result.valid === true, `Esperado válido, recebido: ${JSON.stringify(result)}`);
    });

    // Usernames inválidos
    runTest('Deve rejeitar username muito curto', () => {
        const result = validateUsername('ab');
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
        assert(result.error.includes('3 caracteres'), 'Erro deve mencionar tamanho mínimo');
    });

    runTest('Deve rejeitar username muito longo', () => {
        const result = validateUsername('a'.repeat(31));
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
        assert(result.error.includes('30 caracteres'), 'Erro deve mencionar tamanho máximo');
    });

    runTest('Deve rejeitar username começando com número', () => {
        const result = validateUsername('1user');
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
        assert(result.error.includes('letra'), 'Erro deve mencionar que deve começar com letra');
    });

    runTest('Deve rejeitar username com caracteres especiais inválidos', () => {
        const result = validateUsername('user@name');
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
    });

    runTest('Deve rejeitar username com espaços', () => {
        const result = validateUsername('user name');
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
    });

    runTest('Deve rejeitar username reservado (admin)', () => {
        const result = validateUsername('admin');
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
        assert(result.error.includes('não permitido'), 'Erro deve mencionar que é reservado');
    });

    runTest('Deve rejeitar username vazio', () => {
        const result = validateUsername('');
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
    });
}

// ============================================
// TESTES DE NORMALIZAÇÃO
// ============================================

function testNormalization() {
    console.log(`${colors.cyan}\n[4/6] Testando normalização de dados...${colors.reset}`);

    runTest('Deve normalizar email para lowercase', () => {
        const result = normalizeEmail('USER@EXAMPLE.COM');
        assert(result === 'user@example.com', `Esperado 'user@example.com', recebido: ${result}`);
    });

    runTest('Deve remover espaços do email', () => {
        const result = normalizeEmail('  user@example.com  ');
        assert(result === 'user@example.com', `Esperado 'user@example.com', recebido: ${result}`);
    });

    runTest('Deve normalizar email misto', () => {
        const result = normalizeEmail('  UsEr@ExAmPlE.CoM  ');
        assert(result === 'user@example.com', `Esperado 'user@example.com', recebido: ${result}`);
    });

    runTest('Deve remover espaços do username', () => {
        const result = normalizeUsername('  johndoe  ');
        assert(result === 'johndoe', `Esperado 'johndoe', recebido: ${result}`);
    });

    runTest('Deve manter case do username', () => {
        const result = normalizeUsername('JohnDoe');
        assert(result === 'JohnDoe', `Esperado 'JohnDoe', recebido: ${result}`);
    });
}

// ============================================
// TESTES DE VALIDAÇÃO COMPLETA
// ============================================

function testCompleteValidation() {
    console.log(`${colors.cyan}\n[5/6] Testando validação completa de credenciais...${colors.reset}`);

    // Login válido
    runTest('Deve aceitar credenciais de login válidas', () => {
        const result = validateLoginCredentials({
            email: 'user@example.com',
            password: 'Test@123'
        });
        assert(result.valid === true, `Esperado válido, recebido: ${JSON.stringify(result)}`);
        assert(Object.keys(result.errors).length === 0, 'Não deve haver erros');
    });

    // Login inválido
    runTest('Deve rejeitar login com email inválido', () => {
        const result = validateLoginCredentials({
            email: 'invalid-email',
            password: 'Test@123'
        });
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
        assert(result.errors.email !== undefined, 'Erro de email deve estar presente');
    });

    runTest('Deve rejeitar login sem senha', () => {
        const result = validateLoginCredentials({
            email: 'user@example.com',
            password: ''
        });
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
        assert(result.errors.password !== undefined, 'Erro de senha deve estar presente');
    });

    // Registro válido
    runTest('Deve aceitar credenciais de registro válidas', () => {
        const result = validateRegisterCredentials({
            username: 'johndoe',
            email: 'john@example.com',
            password: 'SecureP@ss123'
        });
        assert(result.valid === true, `Esperado válido, recebido: ${JSON.stringify(result)}`);
        assert(Object.keys(result.errors).length === 0, 'Não deve haver erros');
    });

    // Registro inválido
    runTest('Deve rejeitar registro com múltiplos erros', () => {
        const result = validateRegisterCredentials({
            username: '1user', // inválido
            email: 'invalid', // inválido
            password: 'weak' // inválido
        });
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
        assert(result.errors.username !== undefined, 'Erro de username deve estar presente');
        assert(result.errors.email !== undefined, 'Erro de email deve estar presente');
        assert(result.errors.password !== undefined, 'Erro de senha deve estar presente');
    });
}

// ============================================
// TESTES DE CASOS DE BORDA
// ============================================

function testEdgeCases() {
    console.log(`${colors.cyan}\n[6/6] Testando casos de borda...${colors.reset}`);

    runTest('Deve tratar email com caracteres Unicode', () => {
        const result = validateEmail('usuário@exemplo.com');
        // Pode aceitar ou rejeitar dependendo da política
        assert(result.valid === false, 'Unicode não é suportado por nossa regex');
    });

    runTest('Deve tratar entrada com tipo incorreto (número)', () => {
        const result = validateEmail(123);
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
    });

    runTest('Deve tratar entrada undefined', () => {
        const result = validateEmail(undefined);
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
    });

    runTest('Deve aceitar senha no limite mínimo', () => {
        const result = validatePassword('Test@123'); // exatamente 8 caracteres
        assert(result.valid === true, `Esperado válido, recebido: ${JSON.stringify(result)}`);
    });

    runTest('Deve aceitar username no limite mínimo', () => {
        const result = validateUsername('abc'); // exatamente 3 caracteres
        assert(result.valid === true, `Esperado válido, recebido: ${JSON.stringify(result)}`);
    });

    runTest('Deve aceitar username no limite máximo', () => {
        const result = validateUsername('a' + 'b'.repeat(29)); // exatamente 30 caracteres
        assert(result.valid === true, `Esperado válido, recebido: ${JSON.stringify(result)}`);
    });

    runTest('Deve tratar email com múltiplos @', () => {
        const result = validateEmail('user@@example.com');
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
    });

    runTest('Deve tratar senha com apenas espaços', () => {
        const result = validatePassword('        ');
        assert(result.valid === false, `Esperado inválido, recebido: ${JSON.stringify(result)}`);
    });
}

// ============================================
// EXECUTAR TODOS OS TESTES
// ============================================

function runAllTests() {
    printHeader();

    testEmailValidation();
    testPasswordValidation();
    testUsernameValidation();
    testNormalization();
    testCompleteValidation();
    testEdgeCases();

    // Relatório final
    console.log(`\n${colors.cyan}==================================================`);
    console.log('RELATÓRIO FINAL');
    console.log(`==================================================${colors.reset}\n`);

    console.log(`Total de testes: ${testResults.total}`);
    console.log(`${colors.green}Testes passaram: ${testResults.passed}${colors.reset}`);
    console.log(`${colors.red}Testes falharam: ${testResults.failed}${colors.reset}`);

    console.log(`\n${colors.cyan}==================================================${colors.reset}\n`);

    if (testResults.failed === 0) {
        console.log(`${colors.green}✅ TODOS OS TESTES PASSARAM!${colors.reset}`);
        console.log(`${colors.green}Sistema de validação funcionando corretamente${colors.reset}\n`);
        process.exit(0);
    } else {
        console.log(`${colors.red}⚠️ ALGUNS TESTES FALHARAM${colors.reset}`);
        console.log(`${colors.red}Verifique as implementações acima${colors.reset}\n`);

        console.log(`${colors.yellow}Testes que falharam:${colors.reset}`);
        testResults.details
            .filter(t => t.status === 'FAILED')
            .forEach(t => console.log(`  ${colors.red}✗${colors.reset} ${t.name}: ${t.error}`));
        console.log('');

        process.exit(1);
    }
}

// Executar testes
runAllTests();
