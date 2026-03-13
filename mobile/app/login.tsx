import React from 'react';
import { StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Text, View } from '@/components/Themed';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
    const { login } = useAuth();

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1a1a2e', '#16213e']}
                style={styles.background}
            >
                <View style={styles.content}>
                    <Image
                        source={{ uri: 'https://kairos-app.com/logo.png' }} // Placeholder
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>KAIROS</Text>
                    <Text style={styles.subtitle}>Mastering the Opportune Moment</Text>

                    <View style={styles.card}>
                        <Text style={styles.welcomeText}>Welcome back, Initiate.</Text>
                        <Text style={styles.description}>
                            Sign in with your GitHub account to sync your labors and virtues.
                        </Text>

                        <TouchableOpacity style={styles.githubBtn} onPress={login}>
                            <Ionicons name="logo-github" size={24} color="#fff" />
                            <Text style={styles.btnText}>Sign in with GitHub</Text>
                        </TouchableOpacity>

                        <Text style={styles.footerText}>
                            Note: In local development, ensure your backend is accessible from your device/emulator.
                        </Text>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        alignItems: 'center',
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 20,
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#d4af37',
        letterSpacing: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#a0a0a0',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 40,
    },
    card: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    welcomeText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    description: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 20,
    },
    githubBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        paddingHorizontal: 24,
        paddingVertical: 15,
        borderRadius: 30,
        gap: 12,
        width: '100%',
        justifyContent: 'center',
    },
    btnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footerText: {
        fontSize: 10,
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
    }
});
