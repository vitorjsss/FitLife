import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { API_CONFIG } from '../config/api';

export const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
});

const ACCESS_TOKEN_KEY = '@fitlife:access_token';
const REFRESH_TOKEN_KEY = '@fitlife:refresh_token';
const USER_ID_KEY = '@fitlife:user_id';
const USERNAME_KEY = '@fitlife:username';
const USER_ROLE_KEY = '@fitlife:role';

interface RegisterData {
    username: string;
    email: string;
    password: string;
    user_type: string;
}

class AuthService {
    async updateEmail(authId: string, newEmail: string): Promise<any> {
        const accessToken = await this.getAccessToken();
        if (!accessToken) throw new Error('Token não encontrado');
        const response = await apiClient.post('/auth/update-email', { email: newEmail, authId }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        return response.data;
    }
    async getAuthById(authId: string): Promise<any> {
        const accessToken = await this.getAccessToken();
        if (!accessToken) throw new Error('Token não encontrado');
        const response = await apiClient.get(`/auth/by-id/${authId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        return response.data;
    }

    async register(data: RegisterData): Promise<any> {
        data.email = data.email.toLowerCase();
        const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, data);
        return response.data;
    }

    async login(data: { email: string; password: string }) {
        try {
            data.email = data.email.toLowerCase();
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, data);
            const { accessToken, refreshToken, userId, userType, username } = response.data;

            if (!accessToken || !refreshToken || !userId || !userType) {
                throw new Error('Dados de autenticação incompletos do backend.');
            }

            // Salva os tokens e os dados do usuário no AsyncStorage
            await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
            await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
            await AsyncStorage.setItem(USER_ID_KEY, userId); // ID real do paciente/nutricionista/educador
            await AsyncStorage.setItem(USER_ROLE_KEY, userType);

            if (username) {
                await AsyncStorage.setItem(USERNAME_KEY, username);
            }

            return { accessToken, refreshToken, userId, userType, username };
        } catch (error: any) {
            console.error('Erro no login:', error);
            throw error;
        }
    }

    async getAccessToken(): Promise<string | null> {
        return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    }

    async getRefreshToken(): Promise<string | null> {
        return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    }

    decodeToken(token: string): any {
        try {
            return jwtDecode(token);
        } catch {
            return null;
        }
    }

    isTokenValid(token: string | null): boolean {
        if (!token) return false;
        try {
            const decoded: any = this.decodeToken(token);
            if (!decoded || !decoded.exp) return false;
            const currentTime = Date.now() / 1000;
            return decoded.exp > currentTime;
        } catch {
            return false;
        }
    }

    async refreshAccessToken(): Promise<string | null> {
        const refreshToken = await this.getRefreshToken();
        if (!refreshToken) return null;

        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.REFRESH, { refreshToken });
            const { accessToken } = response.data;
            if (accessToken) {
                await AsyncStorage.setItem(ACCESS_TOKEN_KEY, String(accessToken));
                return accessToken;
            }
            return null;
        } catch (error) {
            await this.logout();
            return null;
        }
    }

    async ensureLoggedIn(): Promise<boolean> {
        let accessToken = await this.getAccessToken();
        if (this.isTokenValid(accessToken)) {
            return true;
        }
        // Tenta renovar o token
        accessToken = await this.refreshAccessToken();
        return !!accessToken;
    }

    async logout(): Promise<void> {
        await AsyncStorage.multiRemove([
            ACCESS_TOKEN_KEY,
            REFRESH_TOKEN_KEY,
            USER_ID_KEY,
            USERNAME_KEY,
            USER_ROLE_KEY,
        ]);
    }
}

export const authService = new AuthService();

export async function requestReauth(email: string, password: string) {
    const r = await apiClient.post("/auth/reauth/request", { email, password });
    return r.data; // { authId, message }
}

export async function verifyReauth(authId: string, code: string) {
    const r = await apiClient.post("/auth/reauth/verify", { authId, code });
    return r.data; // { reauthToken }
}

export async function updateEmailWithReauth(authId: string, newEmail: string, reauthToken: string, accessToken?: string) {
    // include access token if available
    const headers: any = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const r = await apiClient.post("/auth/update-email", { email: newEmail, authId, reauthToken }, { headers });
    return r.data;
}

export async function updatePasswordWithReauth(authId: string, newPassword: string, reauthToken: string, accessToken?: string) {
    const headers: any = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const r = await apiClient.post("/auth/update-password", { authId, newPassword, reauthToken }, { headers });
    return r.data;
}

export default {
    apiClient,
    requestReauth,
    verifyReauth,
    updateEmailWithReauth,
    updatePasswordWithReauth,
    // ...other existing functions (login, register, etc.)
};
