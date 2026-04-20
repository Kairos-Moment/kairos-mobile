import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet, ScrollView, TouchableOpacity,
    Alert, TextInput, Linking, Switch, StatusBar,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Notifications from 'expo-notifications';

import { Text, View } from '@/components/Themed';
import { getTasks, Task } from '@/api/tasks';
import { createFocusSession } from '@/api/focus';
import {
    setupNotifications, showSessionNotification, dismissSessionNotification,
    ACTION_PAUSE, ACTION_RESUME, ACTION_STOP,
} from '@/utils/sessionNotification';

const GREEK_QUOTES = [
    "We suffer more often in imagination than in reality. — Seneca",
    "The happiness of your life depends upon the quality of your thoughts. — Marcus Aurelius",
    "No man is free who is not master of himself. — Epictetus",
];

const AMBIENT_TRACKS = [
    { name: "Rainfall", url: "https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg" },
    { name: "Ocean Waves", url: "https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg" },
    { name: "Crackling Fire", url: "https://actions.google.com/sounds/v1/ambiences/fire.ogg" },
];

const OFFLINE_DIR = (FileSystem as any).documentDirectory + 'kairos_audio/';

interface LocalTrack {
    name: string;
    uri: string;
}

export default function FocusScreen() {
    const { taskId } = useLocalSearchParams();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTaskId, setSelectedTaskId] = useState<string>('');
    const [customMinutes, setCustomMinutes] = useState(25);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
    const [quote] = useState(() => GREEK_QUOTES[Math.floor(Math.random() * GREEK_QUOTES.length)]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Notification ref for response listener
    const notifListenerRef = useRef<any>(null);

    // Selected task title for notification display
    const activeTaskTitle = tasks.find(t => t.id.toString() === selectedTaskId)?.title || 'Focus Session';

    // Audio
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const player = useAudioPlayer(audioUrl);

    // Normal mode — YouTube
    const [ytInput, setYtInput] = useState('');

    // Encapsulation Mode — offline local audio
    const [encapsulationMode, setEncapsulationMode] = useState(false);
    const [localTracks, setLocalTracks] = useState<LocalTrack[]>([]);
    const [activeTrack, setActiveTrack] = useState<LocalTrack | null>(null);

    useEffect(() => {
        // Enable background audio playback and lock screen controls
        setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: true,
        });
        // Request notification permissions
        setupNotifications();

        // Listen for notification action button taps
        notifListenerRef.current = Notifications.addNotificationResponseReceivedListener(response => {
            const action = response.actionIdentifier;
            if (action === ACTION_PAUSE) setIsActive(false);
            else if (action === ACTION_RESUME) setIsActive(true);
            else if (action === ACTION_STOP) handleSessionComplete();
        });

        return () => {
            notifListenerRef.current?.remove();
            dismissSessionNotification();
        };
    }, []);

    useEffect(() => {
        if (player) {
            player.loop = true;
            if (isActive && audioUrl) player.play();
            else player.pause();
        }
    }, [isActive, audioUrl, player]);

    useEffect(() => {
        getTasks()
            .then(res => {
                const pending = res.filter(t => t.status !== 'completed');
                setTasks(pending);
                if (taskId) setSelectedTaskId(Array.isArray(taskId) ? taskId[0] : taskId);
            })
            .catch(err => console.error("Task fetch failed", err));
    }, [taskId]);

    // Load saved local tracks when Encapsulation Mode turns on
    useEffect(() => {
        if (encapsulationMode) loadLocalTracks();
        else {
            // Switching off — clear local track, revert to no audio
            setActiveTrack(null);
            setAudioUrl(null);
        }
    }, [encapsulationMode]);

    const loadLocalTracks = async () => {
        try {
            const dirInfo = await FileSystem.getInfoAsync(OFFLINE_DIR);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(OFFLINE_DIR, { intermediates: true });
                setLocalTracks([]);
                return;
            }
            const files = await FileSystem.readDirectoryAsync(OFFLINE_DIR);
            const tracks = files.map(f => ({ name: f, uri: OFFLINE_DIR + f }));
            setLocalTracks(tracks);
        } catch (err) {
            console.error("Failed to load local tracks", err);
        }
    };

    const handleImportAudio = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'audio/*',
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const file = result.assets[0];
            const destUri = OFFLINE_DIR + file.name;

            const dirInfo = await FileSystem.getInfoAsync(OFFLINE_DIR);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(OFFLINE_DIR, { intermediates: true });
            }

            await FileSystem.copyAsync({ from: file.uri, to: destUri });
            const newTrack = { name: file.name, uri: destUri };
            setLocalTracks(prev => [...prev, newTrack]);
            Alert.alert('Imported', `"${file.name}" added to your offline library.`);
        } catch (err) {
            console.error("Import failed", err);
            Alert.alert('Error', 'Could not import audio file.');
        }
    };

    const handleDeleteLocalTrack = async (track: LocalTrack) => {
        Alert.alert('Remove Track', `Remove "${track.name}" from offline library?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove', style: 'destructive', onPress: async () => {
                    try {
                        await FileSystem.deleteAsync(track.uri);
                        if (activeTrack?.uri === track.uri) {
                            setActiveTrack(null);
                            setAudioUrl(null);
                        }
                        setLocalTracks(prev => prev.filter(t => t.uri !== track.uri));
                    } catch {
                        Alert.alert('Error', 'Could not remove track.');
                    }
                }
            },
        ]);
    };

    const handleSelectLocalTrack = (track: LocalTrack) => {
        setActiveTrack(track);
        setAudioUrl(track.uri);
    };

    const handleOpenYoutube = () => {
        const id = extractYoutubeId(ytInput);
        if (!id) { Alert.alert('Invalid Link', 'Please enter a valid YouTube URL.'); return; }
        Linking.openURL(`https://www.youtube.com/watch?v=${id}`);
    };

    const extractYoutubeId = (url: string) => {
        const match = url.match(/(?:youtu\.be\/|v=|\/embed\/)([^#&?]{11})/);
        return match ? match[1] : null;
    };

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && isActive) {
            handleSessionComplete();
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isActive, timeLeft]);

    // Keep notification in sync with session state
    useEffect(() => {
        if (isActive || (sessionStartTime && timeLeft > 0)) {
            showSessionNotification(timeLeft, isActive, activeTaskTitle);
        }
    }, [timeLeft, isActive]);

    const handleSessionComplete = async () => {
        setIsActive(false);
        dismissSessionNotification();
        if (!selectedTaskId || !sessionStartTime) { resetTimer(); return; }
        setIsSubmitting(true);
        try {
            await createFocusSession({
                task_id: parseInt(selectedTaskId),
                start_time: sessionStartTime,
                end_time: new Date().toISOString(),
                notes: "Completed via Kairos Mobile",
            });
            Alert.alert("Victory!", "Kairos Achieved.");
            resetTimer();
        } catch {
            Alert.alert("Error", "Could not save focus session.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(customMinutes * 60);
        setSessionStartTime(null);
        dismissSessionNotification();
    };

    const toggleTimer = () => {
        if (!selectedTaskId) { Alert.alert("Select a Labor", "Choose a task to focus on."); return; }
        if (!isActive && !sessionStartTime) setSessionStartTime(new Date().toISOString());
        setIsActive(prev => !prev);
    };

    const formatTime = (s: number) =>
        `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#0a0a14', '#1a1a2e', '#16213e']} style={styles.temple}>
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.greekLabel}>ΝΑΟΣ</Text>
                        <Text style={styles.templeTitle}>Temple of Focus</Text>
                        <View style={styles.headerDivider} />
                        <Text style={styles.quote}>"{quote}"</Text>
                    </View>

                    {/* Timer Card */}
                    <View style={styles.card}>
                        <View style={styles.configSection}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>◆ Labor</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {tasks.map(t => (
                                        <TouchableOpacity
                                            key={t.id}
                                            onPress={() => setSelectedTaskId(t.id.toString())}
                                            style={[styles.taskOption, selectedTaskId === t.id.toString() && styles.activeTaskOption]}
                                        >
                                            <Text style={[styles.taskOptionText, selectedTaskId === t.id.toString() && styles.activeTaskOptionText]}>
                                                {t.title}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>◆ Minutes</Text>
                                <TextInput
                                    style={styles.timeInput}
                                    keyboardType="numeric"
                                    value={customMinutes.toString()}
                                    onChangeText={val => {
                                        const m = parseInt(val) || 0;
                                        setCustomMinutes(m);
                                        if (!isActive) setTimeLeft(m * 60);
                                    }}
                                />
                            </View>
                        </View>

                        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>

                        <View style={styles.actions}>
                            <TouchableOpacity onPress={toggleTimer} style={styles.primaryBtn}>
                                <Ionicons name={isActive ? "pause" : "play"} size={22} color="#1a1a2e" />
                                <Text style={styles.primaryBtnText}>{isActive ? 'Pause' : 'Begin'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={resetTimer} style={styles.secondaryBtn}>
                                <Ionicons name="refresh" size={22} color="#fff" />
                                <Text style={styles.btnText}>Reset</Text>
                            </TouchableOpacity>
                        </View>

                        {isActive && (
                            <TouchableOpacity onPress={handleSessionComplete} style={styles.finishBtn} disabled={isSubmitting}>
                                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                                <Text style={styles.btnText}>Finish Early</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Ambient Sounds */}
                    <View style={styles.audioSection}>
                        <Text style={styles.sectionLabel}>Ambient Sounds</Text>
                        <View style={styles.audioChips}>
                            <TouchableOpacity
                                onPress={() => setAudioUrl(null)}
                                style={[styles.chip, !audioUrl && styles.activeChip]}
                            >
                                <Text style={[styles.chipText, !audioUrl && styles.activeChipText]}>Silence</Text>
                            </TouchableOpacity>
                            {AMBIENT_TRACKS.map(track => (
                                <TouchableOpacity
                                    key={track.name}
                                    onPress={() => setAudioUrl(track.url)}
                                    style={[styles.chip, audioUrl === track.url && styles.activeChip]}
                                >
                                    <Text style={[styles.chipText, audioUrl === track.url && styles.activeChipText]}>{track.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Music Section — switches based on Encapsulation Mode */}
                    <View style={styles.musicSection}>

                        {/* Encapsulation Mode Toggle */}
                        <View style={styles.encapHeader}>
                            <View style={styles.encapTitleRow}>
                                <Ionicons name="headset-outline" size={18} color="#d4af37" />
                                <Text style={styles.encapTitle}>Encapsulation Mode</Text>
                            </View>
                            <Switch
                                value={encapsulationMode}
                                onValueChange={setEncapsulationMode}
                                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(212,175,55,0.4)' }}
                                thumbColor={encapsulationMode ? '#d4af37' : '#555'}
                            />
                        </View>

                        <Text style={styles.encapDesc}>
                            {encapsulationMode
                                ? 'Offline mode — play audio imported from your device.'
                                : 'Online mode — open YouTube tracks in the YouTube app.'}
                        </Text>

                        <View style={styles.modeDivider} />

                        {encapsulationMode ? (
                            /* ── OFFLINE MODE ── */
                            <View>
                                <TouchableOpacity onPress={handleImportAudio} style={styles.importBtn}>
                                    <Ionicons name="cloud-download-outline" size={18} color="#1a1a2e" />
                                    <Text style={styles.importBtnText}>Import Audio File</Text>
                                </TouchableOpacity>

                                {localTracks.length === 0 ? (
                                    <Text style={styles.emptyText}>No offline tracks yet. Import an audio file to begin.</Text>
                                ) : (
                                    localTracks.map(track => (
                                        <View key={track.uri} style={styles.trackRow}>
                                            <TouchableOpacity
                                                style={styles.trackInfo}
                                                onPress={() => handleSelectLocalTrack(track)}
                                            >
                                                <Ionicons
                                                    name={activeTrack?.uri === track.uri ? "pause-circle" : "play-circle-outline"}
                                                    size={22}
                                                    color="#d4af37"
                                                />
                                                <Text
                                                    style={[styles.trackName, activeTrack?.uri === track.uri && styles.trackNameActive]}
                                                    numberOfLines={1}
                                                >
                                                    {track.name}
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => handleDeleteLocalTrack(track)}>
                                                <Ionicons name="trash-outline" size={18} color="#e57373" />
                                            </TouchableOpacity>
                                        </View>
                                    ))
                                )}
                            </View>
                        ) : (
                            /* ── ONLINE MODE ── */
                            <View>
                                <Text style={styles.subLabel}>YouTube Track</Text>
                                <View style={styles.ytRow}>
                                    <Ionicons name="logo-youtube" size={18} color="#ff0000" />
                                    <TextInput
                                        style={styles.ytInput}
                                        placeholder="Paste YouTube link..."
                                        placeholderTextColor="#444"
                                        value={ytInput}
                                        onChangeText={setYtInput}
                                        autoCapitalize="none"
                                    />
                                </View>
                                <TouchableOpacity onPress={handleOpenYoutube} style={styles.ytOpenBtn}>
                                    <Ionicons name="open-outline" size={16} color="#d4af37" />
                                    <Text style={styles.ytOpenText}>Open in YouTube</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                </ScrollView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    temple: { flex: 1 },
    scrollContent: { padding: 20, paddingTop: 24, paddingBottom: 60 },

    header: { alignItems: 'center', marginBottom: 28 },
    greekLabel: { fontSize: 11, color: 'rgba(212,175,55,0.5)', letterSpacing: 6, marginBottom: 4 },
    templeTitle: { fontSize: 26, fontWeight: 'bold', color: '#d4af37', textTransform: 'uppercase', letterSpacing: 3 },
    headerDivider: { width: 50, height: 1, backgroundColor: 'rgba(212,175,55,0.3)', marginVertical: 10 },
    quote: { fontSize: 12, fontStyle: 'italic', color: '#666', textAlign: 'center', lineHeight: 18, paddingHorizontal: 10 },

    card: {
        backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 24,
        alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.15)',
    },
    configSection: { width: '100%', marginBottom: 16 },
    inputGroup: { marginBottom: 14 },
    label: { fontSize: 11, fontWeight: 'bold', color: '#d4af37', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    taskOption: {
        backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 14, paddingVertical: 7,
        borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    activeTaskOption: { backgroundColor: '#d4af37', borderColor: '#d4af37' },
    taskOptionText: { color: '#aaa', fontSize: 13 },
    activeTaskOptionText: { color: '#1a1a2e', fontWeight: 'bold' },
    timeInput: {
        backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10,
        color: '#fff', fontSize: 18, textAlign: 'center', width: 80, alignSelf: 'center',
    },
    timerText: { fontSize: 72, fontWeight: 'bold', color: '#fff', marginVertical: 16, fontVariant: ['tabular-nums'] },
    actions: { flexDirection: 'row', gap: 12 },
    primaryBtn: {
        backgroundColor: '#d4af37', flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 24, paddingVertical: 12, borderRadius: 30, gap: 8,
    },
    primaryBtnText: { color: '#1a1a2e', fontSize: 15, fontWeight: 'bold' },
    secondaryBtn: {
        backgroundColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, gap: 8,
    },
    finishBtn: {
        marginTop: 16, backgroundColor: '#4caf50', flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 32, paddingVertical: 12, borderRadius: 30, gap: 8,
    },
    btnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

    audioSection: {
        marginTop: 16, padding: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    sectionLabel: { fontSize: 11, fontWeight: 'bold', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
    audioChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)' },
    activeChip: { backgroundColor: 'rgba(212,175,55,0.15)', borderWidth: 1, borderColor: '#d4af37' },
    chipText: { color: '#666', fontSize: 13 },
    activeChipText: { color: '#d4af37', fontWeight: 'bold' },

    musicSection: {
        marginTop: 16, padding: 18,
        backgroundColor: 'rgba(212,175,55,0.04)',
        borderRadius: 16, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)',
    },
    encapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    encapTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    encapTitle: { fontSize: 15, fontWeight: 'bold', color: '#d4af37' },
    encapDesc: { fontSize: 12, color: '#555', marginTop: 6, lineHeight: 17 },
    modeDivider: { height: 1, backgroundColor: 'rgba(212,175,55,0.15)', marginVertical: 14 },

    importBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#d4af37', borderRadius: 10, paddingVertical: 12, marginBottom: 14,
    },
    importBtnText: { color: '#1a1a2e', fontWeight: 'bold', fontSize: 14 },
    emptyText: { color: '#444', fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 18 },
    trackRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    trackInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 10 },
    trackName: { color: '#aaa', fontSize: 13, flex: 1 },
    trackNameActive: { color: '#d4af37', fontWeight: 'bold' },

    subLabel: { color: '#888', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
    ytRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, paddingHorizontal: 10, gap: 8, marginBottom: 10,
    },
    ytInput: { flex: 1, color: '#fff', paddingVertical: 10, fontSize: 13 },
    ytOpenBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: 'rgba(212,175,55,0.08)', borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.25)', borderRadius: 10, paddingVertical: 10,
    },
    ytOpenText: { color: '#d4af37', fontSize: 13, fontWeight: '600' },
});
