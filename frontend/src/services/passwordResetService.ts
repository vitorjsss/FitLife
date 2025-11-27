import axios from 'axios';
import { API_CONFIG } from '../config/api';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
});

export interface PasswordResetResponse {
  authId: string; // UUID string, não number
  message: string;
}

export interface VerifyCodeResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

/**
 * Solicita recuperação de senha via email
 * Envia código 2FA para o email do usuário
 */
export async function requestPasswordReset(email: string): Promise<PasswordResetResponse> {
  const response = await api.post('/auth/request-password-reset', { email });
  return response.data;
}

/**
 * Verifica o código 2FA enviado por email
 */
export async function verifyPasswordResetCode(authId: string, code: string): Promise<VerifyCodeResponse> {
  const response = await api.post('/auth/verify-password-reset-code', { 
    authId, // Envia como string UUID, não converte para number
    code 
  });
  return response.data;
}

/**
 * Redefine a senha do usuário após verificação do código
 */
export async function resetPassword(
  authId: string, 
  code: string, 
  newPassword: string
): Promise<ResetPasswordResponse> {
  const response = await api.post('/auth/reset-password', { 
    authId, // Envia como string UUID, não converte para number 
    code,
    newPassword 
  });
  return response.data;
}

/**
 * Altera senha do usuário autenticado (dentro da conta)
 * Requer senha atual para validação
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
  accessToken: string
): Promise<{ message: string }> {
  const response = await api.post(
    '/auth/change-password',
    { currentPassword, newPassword },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data;
}
