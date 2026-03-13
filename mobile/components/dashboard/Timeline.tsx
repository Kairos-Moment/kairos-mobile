import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { format } from 'date-fns';

import { Task } from '@/api/tasks';

interface TimelineProps {
    tasks: Task[];
    isLoading: boolean;
    onEdit: (task: Task) => void;
    onDelete: (id: number) => void;
    onToggle: (task: Task) => void;
    onStartFocus: (id: number) => void;
}

const Timeline = ({ tasks, isLoading, onEdit, onDelete, onToggle, onStartFocus }: TimelineProps) => {
    if (isLoading) {
        return (
            <View style={styles.container}>
                {[1, 2, 3].map(i => (
                    <View key={i} style={styles.skeletonItem} />
                ))}
            </View>
        );
    }

    if (!tasks || tasks.length === 0) {
        return (
            <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>⏳</Text>
                <Text style={styles.emptyTitle}>Your timeline is clear.</Text>
                <Text style={styles.emptyText}>No labors assigned for today.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {tasks.map(task => (
                <View key={task.id} style={styles.timelineItem}>
                    <View style={styles.timeSection}>
                        <Text style={styles.timeText}>
                            {task.due_date ? format(new Date(task.due_date), 'h:mm a') : '--'}
                        </Text>
                        <View style={[styles.dot, task.is_urgent && styles.urgentDot]} />
                        <View style={styles.line} />
                    </View>

                    <TouchableOpacity
                        style={[styles.card, task.is_urgent && styles.urgentCard]}
                        onPress={() => onEdit(task)}
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.headerLeft}>
                                <TouchableOpacity onPress={() => onToggle(task)} style={styles.checkbox}>
                                    <FontAwesome
                                        name={task.is_completed ? "check-square" : "square-o"}
                                        size={18}
                                        color={task.is_completed ? "#4caf50" : "#888"}
                                    />
                                </TouchableOpacity>
                                <Text style={styles.typeText}>{task.is_urgent ? 'Urgent' : 'Task'}</Text>
                            </View>
                            <View style={styles.actions}>
                                <TouchableOpacity onPress={() => onStartFocus(task.id)}>
                                    <FontAwesome name="play" size={16} color="#4caf50" style={styles.actionIcon} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <Text style={[styles.title, task.is_completed && styles.completedText]}>
                            {task.title}
                        </Text>
                    </TouchableOpacity>
                </View>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
    },
    timelineItem: {
        flexDirection: 'row',
        minHeight: 100,
    },
    timeSection: {
        width: 80,
        alignItems: 'center',
        marginRight: 10,
    },
    timeText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#2196f3',
        zIndex: 1,
    },
    urgentDot: {
        backgroundColor: '#ff4d4d',
    },
    line: {
        flex: 1,
        width: 2,
        backgroundColor: '#e0e0e0',
    },
    card: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    urgentCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#ff4d4d',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    checkbox: {
        padding: 4,
    },
    typeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#888',
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    completedText: {
        textDecorationLine: 'line-through',
        color: '#888',
    },
    actions: {
        flexDirection: 'row',
    },
    actionIcon: {
        marginLeft: 12,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    skeletonItem: {
        height: 80,
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        marginBottom: 16,
    }
});

export default Timeline;
