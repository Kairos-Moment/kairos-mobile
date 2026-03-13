import React from 'react';
import { StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text, View } from '@/components/Themed';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsScreen() {
    const { user, logout } = useAuth();

    if (!user) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Loading user settings...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.profileCard}>
                <Image
                    source={{ uri: user.avatarurl || 'https://via.placeholder.com/150' }}
                    style={styles.avatar}
                />
                <Text style={styles.username}>{user.username || user.name}</Text>
                <Text style={styles.githubId}>GitHub ID: {user.githubid || user.id}</Text>

                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Ionicons name="log-out-outline" size={20} color="#fff" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>App Preferences</Text>
                <TouchableOpacity style={styles.settingItem}>
                    <Text style={styles.settingText}>Notifications</Text>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.settingItem}>
                    <Text style={styles.settingText}>Theme</Text>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.aboutText}>Kairos Mobile v1.0.0</Text>
                <Text style={styles.aboutText}>Mastering the opportune moment.</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        padding: 20,
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    profileCard: {
        width: '100%',
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 15,
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 5,
    },
    githubId: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 20,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ef4444',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 30,
        gap: 8,
    },
    logoutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    section: {
        width: '100%',
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 15,
        paddingLeft: 5,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    settingText: {
        fontSize: 16,
        color: '#1e293b',
    },
    aboutText: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 5,
    },
});
