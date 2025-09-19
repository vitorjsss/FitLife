import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const ACCESS_TOKEN_KEY = '@fitlife:access_token';
const USERNAME_KEY = '@fitlife:username';
const USER_ROLE_KEY = '@fitlife:role';

const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
});

interface AuthTokens {
    refresh_token: string;
}

interface RegisterData {
    username: string;
    email: string;
    password: string;
    user_type: string;
}

interface LoginData {
    email: string;
    password: string;
}

class AuthService {
    async register(data: RegisterData): Promise<any> {
        const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, data);
        return response.data; // retorna o usuário criado (com id)
    }

    async login(data: LoginData): Promise<string> {
        const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, data);
        const { refresh_token, username, user_type } = response.data;
        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, refresh_token);
        await AsyncStorage.setItem(USERNAME_KEY, username);
        await AsyncStorage.setItem(USER_ROLE_KEY, user_type);
        return refresh_token;
    }

    async getAccessToken(): Promise<string | null> {
        return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
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

    async logout(): Promise<void> {
        await AsyncStorage.multiRemove([
            ACCESS_TOKEN_KEY,
            USERNAME_KEY,
            USER_ROLE_KEY,
        ]);
    }
}

export const authService = new AuthService();