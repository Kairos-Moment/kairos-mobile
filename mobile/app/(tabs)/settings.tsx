import React, { useCallback, useEffect, useState } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text, View } from '@/components/Themed';
import { useAuth } from '@/contexts/AuthContext';
import {
    getNavidromeCredentials,
    saveNavidromeCredentials,
    clearNavidromeCredentials,
    normalizeServerUrl,
} from '@/utils/navidromeCredentials';
import { pingNavidrome } from '@/services/navidrome';

export default function SettingsScreen() {
    const { user, logout } = useAuth();

    const [serverUrl, setServerUrl] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const loadCredentials = useCallback(async () => {
        const creds = await getNavidromeCredentials();
        if (creds) {
            setServerUrl(creds.serverUrl);
            setUsername(creds.username);
            setPassword(creds.password);
        }
    }, []);

    useEffect(() => {
        loadCredentials();
    }, [loadCredentials]);

    const handleSaveNavidrome = async () => {
        const normalized = normalizeServerUrl(serverUrl);
        if (!normalized || !username.trim() || !password) {
            Alert.alert('Missing fields', 'Server URL, username, and password are required.');
            return;
        }
        setIsSaving(true);
        try {
            await saveNavidromeCredentials({
                serverUrl: normalized,
                username: username.trim(),
                password,
            });
            Alert.alert('Saved', 'Navidrome credentials saved on this device.');
        } catch {
            Alert.alert('Error', 'Could not save credentials.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestConnection = async () => {
        const normalized = normalizeServerUrl(serverUrl);
        if (!normalized || !username.trim() || !password) {
            Alert.alert('Missing fields', 'Enter server URL, username, and password first.');
            return;
        }
        setIsTesting(true);
        try {
            await pingNavidrome({
                serverUrl: normalized,
                username: username.trim(),
                password,
            });
            Alert.alert('Connected', 'Successfully reached your Navidrome server.');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Connection failed';
            Alert.alert('Connection failed', message);
        } finally {
            setIsTesting(false);
        }
    };

    const handleClearNavidrome = () => {
        Alert.alert('Clear Navidrome', 'Remove saved server credentials from this device?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Clear',
                style: 'destructive',
                onPress: async () => {
                    await clearNavidromeCredentials();
                    setServerUrl('');
                    setUsername('');
                    setPassword('');
                },
            },
        ]);
    };

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
                <Text style={styles.sectionTitle}>Navidrome</Text>
                <Text style={styles.sectionHint}>
                    Connect your self-hosted music server. Credentials stay on this device only.
                </Text>

                <Text style={styles.fieldLabel}>Server URL</Text>
                <TextInput
                    style={styles.input}
                    placeholder="https://music.example.com"
                    placeholderTextColor="#94a3b8"
                    value={serverUrl}
                    onChangeText={setServerUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                />

                <Text style={styles.fieldLabel}>Username</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor="#94a3b8"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                />

                <Text style={styles.fieldLabel}>Password</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#94a3b8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                />

                <View style={styles.navidromeActions}>
                    <TouchableOpacity
                        style={styles.testButton}
                        onPress={handleTestConnection}
                        disabled={isTesting}
                    >
                        {isTesting ? (
                            <ActivityIndicator color="#1e293b" size="small" />
                        ) : (
                            <>
                                <Ionicons name="pulse-outline" size={18} color="#1e293b" />
                                <Text style={styles.testButtonText}>Test connection</Text>
                            </>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSaveNavidrome}
                        disabled={isSaving}
                    >
                        <Ionicons name="save-outline" size={18} color="#fff" />
                        <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.clearLink} onPress={handleClearNavidrome}>
                    <Text style={styles.clearLinkText}>Clear saved credentials</Text>
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
        marginBottom: 8,
        paddingLeft: 5,
    },
    sectionHint: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 16,
        paddingHorizontal: 5,
        lineHeight: 18,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 6,
        paddingLeft: 5,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1e293b',
        marginBottom: 14,
    },
    navidromeActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
    },
    testButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#d4af37',
        paddingVertical: 12,
        borderRadius: 10,
    },
    testButtonText: {
        color: '#1e293b',
        fontWeight: 'bold',
        fontSize: 14,
    },
    saveButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#1e293b',
        paddingVertical: 12,
        borderRadius: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    clearLink: {
        marginTop: 12,
        alignItems: 'center',
    },
    clearLinkText: {
        color: '#ef4444',
        fontSize: 13,
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
