import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import { Platform, Alert } from 'react-native';
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

// Ensure WebBrowser can handle the redirect
WebBrowser.maybeCompleteAuthSession();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Helper: Initialize API client with token
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
            console.log("[AUTH] Checking login status...");

            // Re-apply token from store on every check (boot safety)
            const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
            if (savedToken) {
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
            }

            const response = await apiClient.get('/auth/login/success', { timeout: 5000 });
            if (response.status === 200 && response.data.success) {
                console.log("[AUTH] Logged in as:", response.data.user.username);
                setUser(response.data.user);
                setIsAuthenticated(true);
            } else {
                console.log("[AUTH] Not logged in (success: false).");
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.log("[AUTH] Auth check failed (unauthorized or unreachable).");
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    // Deep link listener (Captures redirects from external browser or proxy)
    useEffect(() => {
        const handleDeepLink = async (event: { url: string }) => {
            console.log("[AUTH] Deep link received:", event.url);
            const { queryParams } = Linking.parse(event.url);

            if (queryParams?.token) {
                console.log("[AUTH] Token found in deep link! Bridging session...");
                await setupToken(queryParams.token as string);
                await checkAuthStatus();
            } else if (queryParams?.success === 'true') {
                console.log("[AUTH] Success flag found, checking status...");
                await checkAuthStatus();
            }
        };

        const subscription = Linking.addEventListener('url', handleDeepLink);

        Linking.getInitialURL().then((url) => {
            if (url) handleDeepLink({ url });
        });

        return () => subscription.remove();
    }, [checkAuthStatus, setupToken]);

    const logout = async () => {
        try {
            await apiClient.get('/auth/logout');
            await setupToken(null);
            setUser(null);
            setIsAuthenticated(false);
        } catch (error) {
            console.error("[AUTH] Logout failed:", error);
            // Still clear local state on error
            await setupToken(null);
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    const login = async () => {
        // Hardcode the Expo Go redirect URI format with path so the deep link routes correctly
        const redirectUri = AuthSession.makeRedirectUri({ path: 'login-success' });
        console.log("[AUTH] Login initiated. Redirect URI:", redirectUri);

        const authUrl = `${apiClient.defaults.baseURL}/auth/github/mobile?redirect_uri=${encodeURIComponent(redirectUri)}`;

        try {
            const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
            console.log("[AUTH] Browser result:", JSON.stringify(result));

            const resultUrl = result.type === 'success' ? (result as any).url : null;

            if (resultUrl) {
                console.log("[AUTH] Result URL:", resultUrl);
                const { queryParams } = Linking.parse(resultUrl);
                console.log("[AUTH] Query params:", JSON.stringify(queryParams));

                if (queryParams?.token) {
                    console.log("[AUTH] Token received, setting up session...");
                    await setupToken(queryParams.token as string);
                    await checkAuthStatus();
                } else if (queryParams?.error) {
                    Alert.alert("Login Failed", `GitHub auth error: ${queryParams.error} - ${queryParams.detail || ''}`);
                }
            } else {
                console.log("[AUTH] Browser closed without a redirect. Full result:", JSON.stringify(result));
                Alert.alert("Login Incomplete", `Browser closed with type: ${result.type}`);
            }
        } catch (error: any) {
            console.error("[AUTH] Login Error:", error);
            Alert.alert("Authentication Error", "Could not complete GitHub login.");
        }
    };

    const value = {
        user,
        isAuthenticated,
        isLoading,
        checkAuthStatus,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
