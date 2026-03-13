import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    TextInput,
    View as RNView
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Text, View } from '@/components/Themed';
import { getTasks, Task } from '@/api/tasks';
import { createFocusSession } from '@/api/focus';

const GREEK_QUOTES = [
    "We suffer more often in imagination than in reality. — Seneca",
    "The happiness of your life depends upon the quality of your thoughts. — Marcus Aurelius",
    "No man is free who is not master of himself. — Epictetus"
];

const AMBIENT_TRACKS = [
    { name: "Rainfall", url: "https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg" },
    { name: "Ocean Waves", url: "https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg" },
    { name: "Crackling Fire", url: "https://actions.google.com/sounds/v1/ambiences/fire.ogg" },
];

export default function FocusScreen() {
    const { taskId } = useLocalSearchParams();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTaskId, setSelectedTaskId] = useState<string>('');
    const [customMinutes, setCustomMinutes] = useState(25);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
    const [quote] = useState(() => GREEK_QUOTES[Math.floor(Math.random() * GREEK_QUOTES.length)]);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Audio Player
    const player = useAudioPlayer(audioUrl);

    useEffect(() => {
        if (player) {
            player.loop = true;
            if (isActive && audioUrl) {
                player.play();
            } else {
                player.pause();
            }
        }
    }, [isActive, audioUrl, player]);

    // Load Tasks
    useEffect(() => {
        const loadTasks = async () => {
            try {
                const res = await getTasks();
                const pending = res.filter(t => !t.is_completed);
                setTasks(pending);

                if (taskId) {
                    setSelectedTaskId(Array.isArray(taskId) ? taskId[0] : taskId);
                }
            } catch (err) {
                console.error("Task fetch failed", err);
            }
        };
        loadTasks();
    }, [taskId]);

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && isActive) {
            handleSessionComplete();
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft]);

    const handleSessionComplete = async () => {
        setIsActive(false);

        if (!selectedTaskId || !sessionStartTime) {
            resetTimer();
            return;
        }

        setIsSubmitting(true);
        try {
            await createFocusSession({
                task_id: parseInt(selectedTaskId),
                start_time: sessionStartTime,
                end_time: new Date().toISOString(),
                notes: "Completed via Kairos Mobile"
            });
            Alert.alert("Victory!", "Kairos Achieved.");
            resetTimer();
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Could not save focus session.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(customMinutes * 60);
        setSessionStartTime(null);
    };

    const toggleTimer = () => {
        if (!selectedTaskId) {
            Alert.alert("Select a Labor", "Choose a task to focus on.");
            return;
        }
        if (!isActive && !sessionStartTime) {
            setSessionStartTime(new Date().toISOString());
        }
        setIsActive(!isActive);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1a1a2e', '#16213e']}
                style={styles.temple}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Text style={styles.templeTitle}>The Temple of Focus</Text>
                        <Text style={styles.quote}>“{quote}”</Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.configSection}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Labor</Text>
                                <View style={styles.pickerFake}>
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
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Minutes</Text>
                                <TextInput
                                    style={styles.timeInput}
                                    keyboardType="numeric"
                                    value={customMinutes.toString()}
                                    onChangeText={(val) => {
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
                                <Ionicons name={isActive ? "pause" : "play"} size={24} color="#fff" />
                                <Text style={styles.btnText}>{isActive ? 'Pause' : 'Begin'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={resetTimer} style={styles.secondaryBtn}>
                                <Ionicons name="refresh" size={24} color="#fff" />
                                <Text style={styles.btnText}>Reset</Text>
                            </TouchableOpacity>
                        </View>

                        {isActive && (
                            <TouchableOpacity onPress={handleSessionComplete} style={styles.finishBtn}>
                                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                                <Text style={styles.btnText}>Finish Early</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.audioSection}>
                        <Text style={styles.audioTitle}>
                            <Ionicons name="musical-notes" size={20} color="#d4af37" /> Ambient Sounds
                        </Text>
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
                </ScrollView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    temple: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    templeTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#d4af37',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    quote: {
        fontSize: 14,
        fontStyle: 'italic',
        color: '#a0a0a0',
        textAlign: 'center',
        marginTop: 10,
        paddingHorizontal: 20,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    configSection: {
        width: '100%',
        marginBottom: 30,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#888',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    pickerFake: {
        flexDirection: 'row',
    },
    taskOption: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    activeTaskOption: {
        backgroundColor: '#d4af37',
        borderColor: '#d4af37',
    },
    taskOptionText: {
        color: '#fff',
        fontSize: 14,
    },
    activeTaskOptionText: {
        color: '#1a1a2e',
        fontWeight: 'bold',
    },
    timeInput: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: 12,
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
        width: 80,
        alignSelf: 'center',
    },
    timerText: {
        fontSize: 72,
        fontWeight: 'bold',
        color: '#fff',
        marginVertical: 20,
        fontVariant: ['tabular-nums'],
    },
    actions: {
        flexDirection: 'row',
        gap: 15,
    },
    primaryBtn: {
        backgroundColor: '#d4af37',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 30,
        gap: 10,
    },
    secondaryBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 30,
        gap: 10,
    },
    finishBtn: {
        marginTop: 20,
        backgroundColor: '#4caf50',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 12,
        borderRadius: 30,
        gap: 10,
    },
    btnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    audioSection: {
        marginTop: 40,
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 15,
    },
    audioTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#d4af37',
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    audioChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    activeChip: {
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        borderWidth: 1,
        borderColor: '#d4af37',
    },
    chipText: {
        color: '#888',
        fontSize: 14,
    },
    activeChipText: {
        color: '#d4af37',
        fontWeight: 'bold',
    },
});
