import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { isToday, isSameWeek, isSameMonth, parseISO } from 'date-fns';

import { Text, View } from '@/components/Themed';
import OracleInsight from '@/components/dashboard/OracleInsight';
import HabitCard from '@/components/habits/HabitCard';
import apiClient from '@/api/client';
import {
    fetchHabits,
    createHabit,
    deleteHabit,
    logHabit,
    undoHabitLog,
    fetchHabitLogs,
    Habit
} from '@/api/habits';

const AFFIRMATIONS = [
    "We are what we repeatedly do. Excellence, then, is not an act, but a habit. — Aristotle",
    "Small actions, done consistently, create giant results.",
    "Focus on the process, not the outcome. The seed will grow.",
    "Discipline is the bridge between goals and accomplishment."
];

export default function HabitsScreen() {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [completedMap, setCompletedMap] = useState<Record<number, boolean>>({});
    const [progressMap, setProgressMap] = useState<Record<number, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [insightData, setInsightData] = useState(null);
    const [isLoadingInsights, setIsLoadingInsights] = useState(true);
    const [quote] = useState(AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [frequency, setFrequency] = useState(1);
    const [targetCount, setTargetCount] = useState(1);

    const fetchOracle = useCallback(async () => {
        try {
            const response = await apiClient.get('/insights');
            setInsightData(response.data);
        } catch (error) {
            console.error("Oracle failed to perceive your habits:", error);
        }
    }, []);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setIsLoadingInsights(true);
        try {
            const habitsData = await fetchHabits();
            setHabits(habitsData);

            const statusMap: Record<number, boolean> = {};
            const progMap: Record<number, number> = {};
            const now = new Date();

            await Promise.all(habitsData.map(async (habit) => {
                try {
                    const logs = await fetchHabitLogs(habit.id);
                    const target = habit.target_count || 1;

                    let periodLogs = [];
                    if (habit.frequency === 1) { // Daily
                        periodLogs = logs.filter(log => isToday(parseISO(log.completion_date)));
                    } else if (habit.frequency === 2) { // Weekly
                        periodLogs = logs.filter(log => isSameWeek(parseISO(log.completion_date), now));
                    } else if (habit.frequency === 3) { // Monthly
                        periodLogs = logs.filter(log => isSameMonth(parseISO(log.completion_date), now));
                    }

                    progMap[habit.id] = periodLogs.length;
                    statusMap[habit.id] = periodLogs.length >= target;
                } catch (e) {
                    console.error(`Could not fetch logs for habit ${habit.id}`);
                }
            }));

            setCompletedMap(statusMap);
            setProgressMap(progMap);
            await fetchOracle();
        } catch (err) {
            console.error("Error loading habits:", err);
        } finally {
            setIsLoading(false);
            setIsLoadingInsights(false);
            setRefreshing(false);
        }
    }, [fetchOracle]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, [loadData]);

    const handleLog = async (id: number) => {
        const habit = habits.find(h => h.id === id);
        const target = habit?.target_count || 1;

        // Optimistic Update
        setProgressMap(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
        if ((progressMap[id] || 0) + 1 >= target) {
            setCompletedMap(prev => ({ ...prev, [id]: true }));
        }

        try {
            await logHabit(id);
            await fetchOracle();
        } catch (err) {
            loadData();
            Alert.alert("Error", "Could not log habit.");
        }
    };

    const handleUndoLog = async (id: number) => {
        setProgressMap(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) }));
        setCompletedMap(prev => ({ ...prev, [id]: false }));

        try {
            await undoHabitLog(id);
            await fetchOracle();
        } catch (err) {
            loadData();
            Alert.alert("Error", "Could not undo habit.");
        }
    };

    const handleDelete = async (id: number) => {
        Alert.alert(
            "Uproot Habit",
            "Do you want to uproot this habit?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Uproot",
                    style: "destructive",
                    onPress: async () => {
                        await deleteHabit(id);
                        loadData();
                    }
                }
            ]
        );
    };

    const handleCreate = async () => {
        if (!newTitle) return;
        try {
            await createHabit({
                title: newTitle,
                frequency,
                target_count: targetCount,
                is_active: true,
            });
            setShowModal(false);
            setNewTitle("");
            setTargetCount(1);
            loadData();
        } catch (err) {
            Alert.alert("Error", "Failed to create habit");
        }
    };

    const dailyHabits = habits.filter(h => h.frequency === 1);
    const pendingCount = dailyHabits.filter(h => !completedMap[h.id]).length;
    const allCleared = dailyHabits.length > 0 && pendingCount === 0;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#ffffff', '#f5e6ab']}
                style={styles.gradientHeader}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    <OracleInsight insightData={insightData} isLoading={isLoadingInsights} />

                    <View style={[styles.reminderCard, allCleared && styles.allClearedCard]}>
                        <Ionicons
                            name="leaf"
                            size={24}
                            color={allCleared ? "#27ae60" : "#d4af37"}
                        />
                        <View style={styles.reminderContent}>
                            <Text style={styles.reminderTitle}>
                                {allCleared
                                    ? "All virtues practiced."
                                    : pendingCount > 0
                                        ? `${pendingCount} habit${pendingCount > 1 ? 's' : ''} pending.`
                                        : "Plant a seed to begin."
                                }
                            </Text>
                            <Text style={styles.quoteText}>"{quote}"</Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Daily Rhythms</Text>
                        {habits.filter(h => h.frequency === 1).map(habit => (
                            <HabitCard
                                key={habit.id}
                                habit={habit}
                                isDone={completedMap[habit.id]}
                                progress={progressMap[habit.id] || 0}
                                onLog={() => handleLog(habit.id)}
                                onUndo={() => handleUndoLog(habit.id)}
                                onDelete={() => handleDelete(habit.id)}
                            />
                        ))}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Longer Term Growth</Text>
                        {habits.filter(h => h.frequency !== 1).map(habit => (
                            <HabitCard
                                key={habit.id}
                                habit={habit}
                                isDone={completedMap[habit.id]}
                                progress={progressMap[habit.id] || 0}
                                onLog={() => handleLog(habit.id)}
                                onUndo={() => handleUndoLog(habit.id)}
                                onDelete={() => handleDelete(habit.id)}
                            />
                        ))}
                    </View>
                </ScrollView>
            </LinearGradient>

            <TouchableOpacity
                style={styles.fab}
                onPress={() => setShowModal(true)}
            >
                <Ionicons name="add" size={32} color="#fff" />
            </TouchableOpacity>

            <Modal
                visible={showModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Plant a New Habit</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="What virtue will you practice?"
                            placeholderTextColor="#999"
                            value={newTitle}
                            onChangeText={setNewTitle}
                            autoFocus
                        />

                        <View style={styles.formRow}>
                            <View style={styles.formItem}>
                                <Text style={styles.label}>Frequency</Text>
                                <View style={styles.pickerContainer}>
                                    {/* Simplified for now, in a real app would use a Picker component */}
                                    <TouchableOpacity onPress={() => setFrequency(1)} style={[styles.option, frequency === 1 && styles.activeOption]}>
                                        <Text style={[styles.optionText, frequency === 1 && styles.activeOptionText]}>D</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setFrequency(2)} style={[styles.option, frequency === 2 && styles.activeOption]}>
                                        <Text style={[styles.optionText, frequency === 2 && styles.activeOptionText]}>W</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setFrequency(3)} style={[styles.option, frequency === 3 && styles.activeOption]}>
                                        <Text style={[styles.optionText, frequency === 3 && styles.activeOptionText]}>M</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.formItem}>
                                <Text style={styles.label}>Target</Text>
                                <TextInput
                                    style={[styles.input, { marginTop: 0 }]}
                                    keyboardType="numeric"
                                    value={targetCount.toString()}
                                    onChangeText={(val) => setTargetCount(parseInt(val) || 1)}
                                />
                            </View>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.cancelBtn}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleCreate} style={styles.saveBtn}>
                                <Text style={styles.saveBtnText}>Plant</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradientHeader: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    reminderCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        borderLeftWidth: 5,
        borderLeftColor: '#d4af37',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    allClearedCard: {
        borderLeftColor: '#27ae60',
        backgroundColor: '#f0fdf4',
    },
    reminderContent: {
        marginLeft: 12,
        flex: 1,
    },
    reminderTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    quoteText: {
        fontSize: 12,
        fontStyle: 'italic',
        color: '#666',
        marginTop: 2,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 4,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#d4af37',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
        color: '#333',
    },
    formRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    formItem: {
        flex: 1,
        marginRight: 10,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    pickerContainer: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 4,
    },
    option: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeOption: {
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    optionText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#999',
    },
    activeOptionText: {
        color: '#d4af37',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    cancelBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginRight: 10,
    },
    cancelBtnText: {
        color: '#666',
        fontSize: 16,
    },
    saveBtn: {
        backgroundColor: '#d4af37',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
