import React from 'react';
import { StyleSheet, TouchableOpacity, ImageBackground, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/contexts/AuthContext';

const GREEK_QUOTE = "The secret of change is to focus all your energy not on fighting the old, but on building the new. — Socrates";

export default function LoginScreen() {
    const { login } = useAuth();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#0a0a14', '#1a1a2e', '#16213e']}
                style={styles.background}
            >
                {/* Decorative top border */}
                <View style={styles.topBorder} />

                <View style={styles.content}>
                    {/* Greek ornament */}
                    <Text style={styles.ornament}>⚡</Text>

                    <Text style={styles.title}>KAIROS</Text>
                    <Text style={styles.greekTitle}>ΚΑΙΡΟΣ</Text>
                    <Text style={styles.subtitle}>Mastering the Opportune Moment</Text>

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerSymbol}>◆</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Quote */}
                    <Text style={styles.quote}>"{GREEK_QUOTE}"</Text>

                    {/* Card */}
                    <View style={styles.card}>
                        <Text style={styles.welcomeText}>Hail, Initiate.</Text>
                        <Text style={styles.description}>
                            Bind your GitHub identity to enter the Agora and begin your labors.
                        </Text>

                        <TouchableOpacity style={styles.githubBtn} onPress={login} activeOpacity={0.85}>
                            <Ionicons name="logo-github" size={22} color="#1a1a2e" />
                            <Text style={styles.btnText}>Enter with GitHub</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Decorative bottom border */}
                <View style={styles.bottomBorder} />
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    background: { flex: 1, justifyContent: 'center' },
    topBorder: {
        height: 3,
        backgroundColor: '#d4af37',
        marginHorizontal: 0,
    },
    bottomBorder: {
        height: 3,
        backgroundColor: '#d4af37',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
        paddingVertical: 40,
    },
    ornament: {
        fontSize: 36,
        marginBottom: 12,
    },
    title: {
        fontSize: 52,
        fontWeight: 'bold',
        color: '#d4af37',
        letterSpacing: 10,
    },
    greekTitle: {
        fontSize: 16,
        color: 'rgba(212,175,55,0.5)',
        letterSpacing: 8,
        marginTop: 4,
    },
    subtitle: {
        fontSize: 11,
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 3,
        marginTop: 8,
        textAlign: 'center',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
        width: '80%',
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(212,175,55,0.3)',
    },
    dividerSymbol: {
        color: '#d4af37',
        marginHorizontal: 10,
        fontSize: 10,
    },
    quote: {
        fontSize: 12,
        fontStyle: 'italic',
        color: '#666',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 32,
        paddingHorizontal: 10,
    },
    card: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 16,
        padding: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.2)',
    },
    welcomeText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 1,
        marginBottom: 10,
    },
    description: {
        fontSize: 13,
        color: '#777',
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 20,
    },
    githubBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#d4af37',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 30,
        gap: 10,
        width: '100%',
        justifyContent: 'center',
    },
    btnText: {
        color: '#1a1a2e',
        fontSize: 15,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
