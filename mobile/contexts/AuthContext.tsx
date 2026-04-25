import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
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

    const checkAuthStatus = useCallback(async () => {
        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            if (!token) {
                setIsAuthenticated(false);
                setUser(null);
                setIsLoading(false);
                return;
            }
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const res = await apiClient.get('/auth/login/success', { timeout: 5000 });
            if (res.data.success) {
                setUser(res.data.user);
                setIsAuthenticated(true);
            } else {
                await SecureStore.deleteItemAsync(TOKEN_KEY);
                setIsAuthenticated(false);
            }
        } catch {
            // On network error keep user logged in if token exists
            const token = await SecureStore.getItemAsync(TOKEN_KEY).catch(() => null);
            setIsAuthenticated(!!token);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const safety = setTimeout(() => setIsLoading(false), 6000);
        checkAuthStatus().finally(() => clearTimeout(safety));
    }, [checkAuthStatus]);

    const login = async () => {
        try {
            const redirectUri = AuthSession.makeRedirectUri({
                scheme: 'mobile',
                path: 'login-success',
            });
            console.log('[AUTH] Redirect URI:', redirectUri);
            const authUrl = `${apiClient.defaults.baseURL}/auth/github/mobile?redirect_uri=${encodeURIComponent(redirectUri)}`;
            await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
            // Token handling is done in app/login-success.tsx
        } catch (err: any) {
            console.error('[AUTH] Login error:', err?.message);
            Alert.alert('Authentication Error', 'Could not complete GitHub login.');
        }
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        delete apiClient.defaults.headers.common['Authorization'];
        setUser(null);
        setIsAuthenticated(false);
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
