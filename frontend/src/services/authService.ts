import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const ACCESS_TOKEN_KEY = '@fitlife:access_token';
const REFRESH_TOKEN_KEY = '@fitlife:refresh_token';
const USERNAME_KEY = '@fitlife:username';
const USER_ROLE_KEY = '@fitlife:role';

const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
});

interface RegisterData {
    username: string;
    email: string;
    password: string;
    user_type: string;
}

class AuthService {
    async register(data: RegisterData): Promise<any> {
        data.email = data.email.toLowerCase();
        const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, data);
        return response.data;
    }

    async login(data: { email: string; password: string }) {
        try {
            data.email = data.email.toLowerCase();
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, data);
            const { accessToken, refreshToken, userId, userType } = response.data;

            if (!accessToken || !refreshToken || !userId || !userType) {
                throw new Error('Dados de autenticação incompletos do backend.');
            }

            await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
            await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
            await AsyncStorage.setItem(USERNAME_KEY, userId);
            await AsyncStorage.setItem(USER_ROLE_KEY, userType);

            return { accessToken, refreshToken, userId, userType };
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
                await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
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
            USERNAME_KEY,
            USER_ROLE_KEY,
        ]);
    }
}

export const authService = new AuthService();