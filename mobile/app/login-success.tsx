import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginSuccessScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ token: string; code: string; error: string }>();
    const { checkAuthStatus } = useAuth();

    useEffect(() => {
        const handle = async () => {
            const { token, code, error } = params;

            if (error) {
                Alert.alert('Login Failed', `OAuth error: ${error}`);
                router.replace('/login');
                return;
            }

            try {
                let finalToken = token;

                if (!finalToken && code) {
                    // GitHub redirected here directly with a code — exchange it via backend
                    const res = await apiClient.post('/auth/github/mobile/token', {
                        code,
                        redirect_uri: 'mobile://login-success',
                    });
                    finalToken = res.data.token;
                }

                if (!finalToken) {
                    Alert.alert('Login Failed', 'Could not obtain access token.');
                    router.replace('/login');
                    return;
                }

                await SecureStore.setItemAsync('kairos_auth_token', finalToken);
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${finalToken}`;
                await checkAuthStatus();
            } catch (e: any) {
                Alert.alert('Login Failed', e?.response?.data?.error || e.message);
                router.replace('/login');
            }
        };
        handle();
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#d4af37" />
        </View>
    );
}
