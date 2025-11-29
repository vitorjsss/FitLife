/**
 * ================================================
 * TESTES DE INTEGRAÇÃO - VALIDAÇÃO FRONTEND
 * ================================================
 * Risco 1: Validação de Credenciais
 * 
 * Verifica se as telas estão usando validationRules
 * corretamente em todas as validações
 * ================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(description, fn) {
    totalTests++;
    try {
        fn();
        passedTests++;
        console.log(`${colors.green}✓${colors.reset} ${description}`);
        return true;
    } catch (error) {
        failedTests++;
        console.log(`${colors.red}✗${colors.reset} ${description}`);
        console.log(`  ${colors.red}${error.message}${colors.reset}`);
        return false;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertIncludes(text, substring, message) {
    if (!text.includes(substring)) {
        throw new Error(message || `Expected text to include "${substring}"`);
    }
}

function assertNotIncludes(text, substring, message) {
    if (text.includes(substring)) {
        throw new Error(message || `Expected text NOT to include "${substring}"`);
    }
}

// ============================================
// HELPER: LER ARQUIVO
// ============================================

function readFile(relativePath) {
    // __dirname está em backend/tests/validation, então precisamos subir 3 níveis para chegar na raiz
    const fullPath = path.join(__dirname, '../../../', relativePath);
    return fs.readFileSync(fullPath, 'utf-8');
}

// ============================================
// SUITE 1: LOGIN SCREEN
// ============================================

console.log(`\n${colors.cyan}╔══════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.cyan}║  TESTES INTEGRAÇÃO - Validação Frontend       ║${colors.reset}`);
console.log(`${colors.cyan}║  Risco 8: Validação de Credenciais            ║${colors.reset}`);
console.log(`${colors.cyan}╚══════════════════════════════════════════════════╝${colors.reset}\n`);

console.log(`${colors.blue}[1/4] Testando integração em login.tsx...${colors.reset}`);

const loginCode = readFile('frontend/src/screens/login/login.tsx');

test('Login importa validateLoginCredentials', () => {
    assertIncludes(loginCode, "import { validateLoginCredentials", 'Falta import de validateLoginCredentials');
});

test('Login importa normalizeEmail', () => {
    assertIncludes(loginCode, 'normalizeEmail', 'Falta import de normalizeEmail');
});

test('Login NÃO usa Yup', () => {
    assertNotIncludes(loginCode, "import * as yup from", 'Ainda está usando Yup');
    assertNotIncludes(loginCode, 'yupResolver', 'Ainda está usando yupResolver');
});

test('Login chama validateLoginCredentials', () => {
    assertIncludes(loginCode, 'validateLoginCredentials({', 'Não está chamando validateLoginCredentials');
});

test('Login normaliza email antes de enviar', () => {
    assertIncludes(loginCode, 'normalizeEmail(data.email)', 'Não está normalizando email');
});

test('Login verifica validation.valid', () => {
    assertIncludes(loginCode, 'validation.valid', 'Não está verificando validation.valid');
});

test('Login exibe validation.errors', () => {
    assertIncludes(loginCode, 'validationErrors', 'Não está usando validationErrors');
});

// ============================================
// SUITE 2: REGISTER SCREEN
// ============================================

console.log(`\n${colors.blue}[2/4] Testando integração em register.tsx...${colors.reset}`);

const registerCode = readFile('frontend/src/screens/cadastro/register.tsx');

test('Register importa validateRegisterCredentials', () => {
    assertIncludes(registerCode, 'validateRegisterCredentials', 'Falta import de validateRegisterCredentials');
});

test('Register importa validateEmail', () => {
    assertIncludes(registerCode, 'validateEmail', 'Falta import de validateEmail');
});

test('Register importa validatePassword', () => {
    assertIncludes(registerCode, 'validatePassword', 'Falta import de validatePassword');
});

test('Register importa normalizeEmail', () => {
    assertIncludes(registerCode, 'normalizeEmail', 'Falta import de normalizeEmail');
});

test('Register importa normalizeUsername', () => {
    assertIncludes(registerCode, 'normalizeUsername', 'Falta import de normalizeUsername');
});

test('Register NÃO usa Yup', () => {
    assertNotIncludes(registerCode, "import * as yup from", 'Ainda está usando Yup');
    assertNotIncludes(registerCode, 'yupResolver', 'Ainda está usando yupResolver');
});

test('Register chama validateRegisterCredentials', () => {
    assertIncludes(registerCode, 'validateRegisterCredentials({', 'Não está chamando validateRegisterCredentials');
});

test('Register normaliza email', () => {
    assertIncludes(registerCode, 'normalizeEmail(data.email)', 'Não está normalizando email');
});

test('Register verifica credValidation.valid', () => {
    assertIncludes(registerCode, 'credValidation.valid', 'Não está verificando credValidation.valid');
});

test('Register NÃO usa regex local de senha', () => {
    assertNotIncludes(registerCode, 'const passwordPolicy = /^', 'Ainda tem regex local de senha');
});

// ============================================
// SUITE 3: FORGOT PASSWORD SCREEN
// ============================================

console.log(`\n${colors.blue}[3/4] Testando integração em ForgotPasswordScreen.tsx...${colors.reset}`);

const forgotPasswordCode = readFile('frontend/src/screens/login/ForgotPasswordScreen.tsx');

test('ForgotPassword importa validateEmail', () => {
    assertIncludes(forgotPasswordCode, "import { validateEmail", 'Falta import de validateEmail');
});

test('ForgotPassword importa validatePassword', () => {
    assertIncludes(forgotPasswordCode, 'validatePassword', 'Falta import de validatePassword');
});

test('ForgotPassword NÃO tem função local validateEmail', () => {
    assertNotIncludes(forgotPasswordCode, 'const validateEmail = (email: string)', 'Ainda tem função local validateEmail');
});

test('ForgotPassword NÃO tem função local validatePassword', () => {
    assertNotIncludes(forgotPasswordCode, 'const validatePassword = (password: string)', 'Ainda tem função local validatePassword');
});

test('ForgotPassword usa emailValidation.valid', () => {
    assertIncludes(forgotPasswordCode, 'emailValidation.valid', 'Não está verificando emailValidation.valid');
});

test('ForgotPassword usa validation.valid para senha', () => {
    assertIncludes(forgotPasswordCode, 'validation.valid', 'Não está verificando validation.valid');
});

// ============================================
// SUITE 4: CONTA USUARIO SCREEN
// ============================================

console.log(`\n${colors.blue}[4/4] Testando integração em ContaUsuario.tsx...${colors.reset}`);

const contaUsuarioCode = readFile('frontend/src/screens/conta/ContaUsuario.tsx');

test('ContaUsuario importa validatePassword', () => {
    assertIncludes(contaUsuarioCode, "import { validatePassword }", 'Falta import de validatePassword');
});

test('ContaUsuario NÃO tem função local validatePassword', () => {
    assertNotIncludes(contaUsuarioCode, '    const validatePassword = (password: string)', 'Ainda tem função local validatePassword');
});

test('ContaUsuario usa validation.valid', () => {
    assertIncludes(contaUsuarioCode, 'validation.valid', 'Não está verificando validation.valid');
});

test('ContaUsuario usa validation.error', () => {
    assertIncludes(contaUsuarioCode, 'validation.error', 'Não está usando validation.error');
});

test('ContaUsuario NÃO usa validation.isValid', () => {
    assertNotIncludes(contaUsuarioCode, 'validation.isValid', 'Ainda usa validation.isValid (deveria ser validation.valid)');
});

// ============================================
// RELATÓRIO FINAL
// ============================================

console.log(`\n${colors.cyan}${'='.repeat(50)}${colors.reset}`);
console.log(`${colors.cyan}RELATÓRIO FINAL${colors.reset}`);
console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}\n`);

console.log(`Total de testes: ${totalTests}`);
console.log(`${colors.green}Testes passaram: ${passedTests}${colors.reset}`);
console.log(`${colors.red}Testes falharam: ${failedTests}${colors.reset}\n`);

if (failedTests === 0) {
    console.log(`${colors.green}✅ TODOS OS TESTES PASSARAM!${colors.reset}`);
    console.log(`${colors.green}Integração do validationRules funcionando corretamente${colors.reset}\n`);
    process.exit(0);
} else {
    console.log(`${colors.red}❌ ALGUNS TESTES FALHARAM${colors.reset}`);
    console.log(`${colors.red}Verifique a integração do validationRules${colors.reset}\n`);
    process.exit(1);
}
