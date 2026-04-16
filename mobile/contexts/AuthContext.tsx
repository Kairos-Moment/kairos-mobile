import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import apiClient from '../api/client';

interface User {
    id: string;
    name: string;
    email: string;
    username?: string;
    avatarurl?: string;
    githubid?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    checkAuthStatus: () => Promise<void>;
    login: () => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TOKEN_KEY = 'kairos_auth_token';

WebBrowser.maybeCompleteAuthSession();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const setupToken = useCallback(async (token: string | null) => {
        if (token) {
            await SecureStore.setItemAsync(TOKEN_KEY, token);
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            delete apiClient.defaults.headers.common['Authorization'];
        }
    }, []);

    const checkAuthStatus = useCallback(async () => {
        try {
            const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
            if (!savedToken) {
                setIsAuthenticated(false);
                setUser(null);
                setIsLoading(false);
                return;
            }
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
            const response = await apiClient.get('/auth/login/success', { timeout: 5000 });
            if (response.status === 200 && response.data.success) {
                setUser(response.data.user);
                setIsAuthenticated(true);
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch {
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    const logout = async () => {
        await setupToken(null);
        setUser(null);
        setIsAuthenticated(false);
    };

    const login = async () => {
        try {
            const redirectUri = AuthSession.makeRedirectUri({ path: 'login-success' });
            console.log("[AUTH] Redirect URI:", redirectUri);

            // Go through backend — GitHub doesn't accept exp:// redirect URIs directly
            const authUrl = `${apiClient.defaults.baseURL}/auth/github/mobile?redirect_uri=${encodeURIComponent(redirectUri)}`;

            const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
            console.log("[AUTH] Browser result type:", result.type);

            if (result.type !== 'success') {
                console.log("[AUTH] Browser closed without success:", result.type);
                return;
            }

            const resultUrl = (result as any).url;
            console.log("[AUTH] Result URL:", resultUrl);

            const { queryParams } = Linking.parse(resultUrl);
            const token = queryParams?.token as string;

            if (!token) {
                const errorDetail = queryParams?.detail || queryParams?.error || 'unknown';
                Alert.alert("Login Failed", `Could not obtain token. Detail: ${errorDetail}`);
                return;
            }

            console.log("[AUTH] Token received, setting up session...");
            await setupToken(token);
            await checkAuthStatus();
        } catch (error: any) {
            console.error("[AUTH] Login Error:", error?.message || error);
            Alert.alert("Authentication Error", "Could not complete GitHub login.");
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isLoading, checkAuthStatus, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
