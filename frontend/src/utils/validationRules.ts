/**
 * ================================================
 * REGRAS DE VALIDAÇÃO PADRONIZADAS - FITLIFE
 * ================================================
 * Mitigação Risco 8: Validação de Credenciais
 * 
 * Este módulo centraliza todas as regras de validação
 * para garantir consistência entre frontend e backend
 * ================================================
 */

// ============================================
// 1. REGRAS DE EMAIL
// ============================================

/**
 * Regex para validação de email
 * Aceita: user@domain.com, user.name@domain.co.uk, user+tag@domain.com
 * Rejeita: user@domain, @domain.com, user@.com, user..name@domain.com
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export interface ValidationResult {
    valid: boolean;
    error: string | null;
}

export interface PasswordValidationResult extends ValidationResult {
    strength?: 'none' | 'weak' | 'medium' | 'strong' | 'very_strong';
}

export interface CredentialsValidationResult {
    valid: boolean;
    errors: Record<string, string>;
}

/**
 * Validação completa de email
 * @param email - Email a ser validado
 * @returns Resultado da validação
 */
export function validateEmail(email: string): ValidationResult {
    // 1. Verificar se email foi fornecido
    if (!email || typeof email !== 'string') {
        return { valid: false, error: 'Email é obrigatório' };
    }

    // 2. Remover espaços em branco
    const trimmedEmail = email.trim();

    // 3. Verificar comprimento mínimo e máximo
    if (trimmedEmail.length < 5) {
        return { valid: false, error: 'Email muito curto (mínimo 5 caracteres)' };
    }

    if (trimmedEmail.length > 254) {
        return { valid: false, error: 'Email muito longo (máximo 254 caracteres)' };
    }

    // 4. Verificar formato com regex
    if (!EMAIL_REGEX.test(trimmedEmail)) {
        return { valid: false, error: 'Formato de email inválido' };
    }

    // 5. Verificar partes do email
    const parts = trimmedEmail.split('@');
    if (parts.length !== 2) {
        return { valid: false, error: 'Email deve conter exatamente um @' };
    }

    const [localPart, domainPart] = parts;

    // 6. Validar parte local (antes do @)
    if (localPart.length < 1 || localPart.length > 64) {
        return { valid: false, error: 'Parte local do email inválida' };
    }

    if (localPart.startsWith('.') || localPart.endsWith('.')) {
        return { valid: false, error: 'Email não pode começar ou terminar com ponto' };
    }

    if (localPart.includes('..')) {
        return { valid: false, error: 'Email não pode conter pontos consecutivos' };
    }

    // 7. Validar domínio (depois do @)
    if (domainPart.length < 3) {
        return { valid: false, error: 'Domínio muito curto' };
    }

    if (domainPart.startsWith('-') || domainPart.endsWith('-')) {
        return { valid: false, error: 'Domínio inválido' };
    }

    if (!domainPart.includes('.')) {
        return { valid: false, error: 'Domínio deve conter pelo menos um ponto' };
    }

    // 8. Validar TLD (Top Level Domain)
    const tld = domainPart.split('.').pop();
    if (!tld || tld.length < 2) {
        return { valid: false, error: 'TLD inválido' };
    }

    return { valid: true, error: null };
}

// ============================================
// 2. REGRAS DE SENHA
// ============================================

/**
 * Requisitos de senha:
 * - Mínimo 8 caracteres
 * - Pelo menos 1 letra maiúscula
 * - Pelo menos 1 letra minúscula
 * - Pelo menos 1 número
 * - Pelo menos 1 caractere especial
 */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).{8,}$/;

/**
 * Validação completa de senha
 * @param password - Senha a ser validada
 * @returns Resultado da validação com indicador de força
 */
export function validatePassword(password: string): PasswordValidationResult {
    // 1. Verificar se senha foi fornecida
    if (!password || typeof password !== 'string') {
        return { valid: false, error: 'Senha é obrigatória', strength: 'none' };
    }

    // 2. Verificar comprimento mínimo
    if (password.length < 8) {
        return { valid: false, error: 'Senha deve ter no mínimo 8 caracteres', strength: 'weak' };
    }

    // 3. Verificar comprimento máximo
    if (password.length > 128) {
        return { valid: false, error: 'Senha muito longa (máximo 128 caracteres)', strength: 'none' };
    }

    // 4. Verificar letra minúscula
    if (!/[a-z]/.test(password)) {
        return { valid: false, error: 'Senha deve conter pelo menos uma letra minúscula', strength: 'weak' };
    }

    // 5. Verificar letra maiúscula
    if (!/[A-Z]/.test(password)) {
        return { valid: false, error: 'Senha deve conter pelo menos uma letra maiúscula', strength: 'weak' };
    }

    // 6. Verificar número
    if (!/\d/.test(password)) {
        return { valid: false, error: 'Senha deve conter pelo menos um número', strength: 'weak' };
    }

    // 7. Verificar caractere especial
    if (!/[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]/.test(password)) {
        return { valid: false, error: 'Senha deve conter pelo menos um caractere especial (!@#$%^&*...)', strength: 'weak' };
    }

    // 8. Verificar sequências comuns (opcional)
    const commonSequences = ['12345', 'abcde', 'qwerty', 'password', '123456'];
    const lowerPassword = password.toLowerCase();
    for (const seq of commonSequences) {
        if (lowerPassword.includes(seq)) {
            return { valid: false, error: 'Senha contém sequência muito comum', strength: 'weak' };
        }
    }

    // 9. Calcular força da senha
    let strength: 'medium' | 'strong' | 'very_strong' = 'medium';
    if (password.length >= 12 && /[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]/.test(password)) {
        strength = 'strong';
    }
    if (password.length >= 16) {
        strength = 'very_strong';
    }

    return { valid: true, error: null, strength };
}

// ============================================
// 3. REGRAS DE USERNAME
// ============================================

/**
 * Regex para validação de username
 * Aceita: letras, números, underscore, hífen
 * Deve começar com letra
 * 3-30 caracteres
 */
export const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]{2,29}$/;

/**
 * Validação completa de username
 * @param username - Username a ser validado
 * @returns Resultado da validação
 */
export function validateUsername(username: string): ValidationResult {
    // 1. Verificar se username foi fornecido
    if (!username || typeof username !== 'string') {
        return { valid: false, error: 'Username é obrigatório' };
    }

    // 2. Remover espaços em branco
    const trimmedUsername = username.trim();

    // 3. Verificar comprimento
    if (trimmedUsername.length < 3) {
        return { valid: false, error: 'Username deve ter no mínimo 3 caracteres' };
    }

    if (trimmedUsername.length > 30) {
        return { valid: false, error: 'Username deve ter no máximo 30 caracteres' };
    }

    // 4. Verificar se começa com letra
    if (!/^[a-zA-Z]/.test(trimmedUsername)) {
        return { valid: false, error: 'Username deve começar com uma letra' };
    }

    // 5. Verificar formato com regex
    if (!USERNAME_REGEX.test(trimmedUsername)) {
        return { valid: false, error: 'Username pode conter apenas letras, números, underscore e hífen' };
    }

    // 6. Verificar palavras reservadas
    const reserved = ['admin', 'root', 'system', 'null', 'undefined'];
    if (reserved.includes(trimmedUsername.toLowerCase())) {
        return { valid: false, error: 'Username não permitido' };
    }

    return { valid: true, error: null };
}

// ============================================
// 4. VALIDAÇÃO COMPLETA DE CREDENCIAIS
// ============================================

/**
 * Valida credenciais de login
 * @param credentials - { email, password }
 * @returns Resultado da validação com erros por campo
 */
export function validateLoginCredentials(credentials: { email: string; password: string }): CredentialsValidationResult {
    const errors: Record<string, string> = {};

    // Validar email
    const emailValidation = validateEmail(credentials.email);
    if (!emailValidation.valid) {
        errors.email = emailValidation.error || 'Email inválido';
    }

    // Validar senha (apenas presença no login)
    if (!credentials.password || credentials.password.length === 0) {
        errors.password = 'Senha é obrigatória';
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Valida credenciais de registro
 * @param credentials - { username, email, password }
 * @returns Resultado da validação com erros por campo
 */
export function validateRegisterCredentials(credentials: { username: string; email: string; password: string }): CredentialsValidationResult {
    const errors: Record<string, string> = {};

    // Validar username
    const usernameValidation = validateUsername(credentials.username);
    if (!usernameValidation.valid) {
        errors.username = usernameValidation.error || 'Username inválido';
    }

    // Validar email
    const emailValidation = validateEmail(credentials.email);
    if (!emailValidation.valid) {
        errors.email = emailValidation.error || 'Email inválido';
    }

    // Validar senha (completa no registro)
    const passwordValidation = validatePassword(credentials.password);
    if (!passwordValidation.valid) {
        errors.password = passwordValidation.error || 'Senha inválida';
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
}

// ============================================
// 5. NORMALIZAÇÃO DE DADOS
// ============================================

/**
 * Normaliza email (lowercase, trim)
 * @param email - Email a ser normalizado
 * @returns Email normalizado
 */
export function normalizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {
        return '';
    }
    return email.trim().toLowerCase();
}

/**
 * Normaliza username (trim)
 * @param username - Username a ser normalizado
 * @returns Username normalizado
 */
export function normalizeUsername(username: string): string {
    if (!username || typeof username !== 'string') {
        return '';
    }
    return username.trim();
}

// ============================================
// 6. CONSTANTES EXPORTADAS
// ============================================

export const VALIDATION_CONSTANTS = {
    EMAIL: {
        MIN_LENGTH: 5,
        MAX_LENGTH: 254,
        REGEX: EMAIL_REGEX
    },
    PASSWORD: {
        MIN_LENGTH: 8,
        MAX_LENGTH: 128,
        REGEX: PASSWORD_REGEX,
        REQUIRED_CHARS: {
            lowercase: true,
            uppercase: true,
            number: true,
            special: true
        }
    },
    USERNAME: {
        MIN_LENGTH: 3,
        MAX_LENGTH: 30,
        REGEX: USERNAME_REGEX
    }
};

export default {
    validateEmail,
    validatePassword,
    validateUsername,
    validateLoginCredentials,
    validateRegisterCredentials,
    normalizeEmail,
    normalizeUsername,
    VALIDATION_CONSTANTS,
    EMAIL_REGEX,
    PASSWORD_REGEX,
    USERNAME_REGEX
};
