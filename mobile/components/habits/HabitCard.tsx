import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';

interface Habit {
    id: number;
    title: string;
    frequency: number;
    target_count: number;
    description?: string;
    is_active: boolean;
}

interface HabitCardProps {
    habit: Habit;
    isDone: boolean;
    progress: number;
    onLog: () => void;
    onUndo: () => void;
    onDelete: () => void;
}

const HabitCard = ({ habit, isDone, progress, onLog, onUndo, onDelete }: HabitCardProps) => {
    const target = habit.target_count || 1;
    const percentage = Math.min((progress / target) * 100, 100);

    const getFrequencyLabel = () => {
        if (habit.frequency === 1) return "Daily";
        if (habit.frequency === 2) return "Weekly";
        if (habit.frequency === 3) return "Monthly";
        return "";
    };

    const getStatusText = () => {
        if (isDone) return "Virtue Practiced";
        if (target > 1) return `${progress} / ${target} completed`;
        return "Awaiting Practice";
    };

    return (
        <View style={[styles.card, isDone && styles.completedCard]}>
            <View style={styles.cardInfo}>
                <View style={styles.cardHeader}>
                    <Text style={styles.title}>{habit.title}</Text>
                    <View style={styles.freqTag}>
                        <Text style={styles.freqTagText}>{getFrequencyLabel()}</Text>
                    </View>
                </View>

                {target > 1 && (
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { width: `${percentage}%` }]} />
                    </View>
                )}

                <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>

            <View style={styles.cardActions}>
                {progress > 0 && (
                    <TouchableOpacity onPress={onUndo} style={styles.actionBtn}>
                        <Ionicons name="arrow-undo" size={20} color="#666" />
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    onPress={onLog}
                    style={[styles.actionBtn, isDone && styles.activeCheckBtn]}
                    disabled={isDone}
                >
                    <Ionicons
                        name="checkmark-circle"
                        size={28}
                        color={isDone ? "#4caf50" : "#e0e0e0"}
                    />
                </TouchableOpacity>

                <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
                    <Ionicons name="trash" size={20} color="#ff4d4d" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    completedCard: {
        backgroundColor: '#f8fff8',
        borderColor: '#e8f5e9',
        borderWidth: 1,
    },
    cardInfo: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginRight: 8,
    },
    freqTag: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    freqTagText: {
        fontSize: 10,
        color: '#666',
        fontWeight: 'bold',
    },
    progressContainer: {
        height: 4,
        backgroundColor: '#eee',
        borderRadius: 2,
        marginBottom: 8,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#4caf50',
    },
    statusText: {
        fontSize: 12,
        color: '#888',
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
    },
    actionBtn: {
        padding: 8,
    },
    activeCheckBtn: {
        opacity: 1,
    }
});

export default HabitCard;
