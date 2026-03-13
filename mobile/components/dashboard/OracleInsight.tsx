import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { FontAwesome, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import { speak } from '@/utils/speech';

interface Task {
    text: string;
    due: string;
    is_urgent: boolean;
}

interface InsightData {
    message: string;
    tasks: Task[];
    productivitySummary?: string;
}

interface OracleInsightProps {
    insightData: InsightData | null;
    isLoading: boolean;
}

const OracleInsight = ({ insightData, isLoading }: OracleInsightProps) => {
    const [subtitle, setSubtitle] = useState('');

    const handleSpeak = () => {
        if (insightData?.message) {
            speak(insightData.message, (text) => {
                setSubtitle(text);
                // Clear subtitle after delay
                setTimeout(() => setSubtitle(''), 5000);
            });
        }
    };
    if (isLoading || !insightData) {
        return (
            <View style={[styles.card, styles.loading]}>
                <Text style={styles.title}>
                    <MaterialCommunityIcons name="trophy" size={24} color="#ffd700" /> The Oracle's Insight
                </Text>
                <View style={styles.skeletonText} />
                <View style={[styles.skeletonText, { width: '60%' }]} />
            </View>
        );
    }

    const { message, tasks } = insightData;
    const hasUrgent = tasks?.some(t => t.is_urgent);

    return (
        <View style={[styles.card, hasUrgent && styles.urgentCard]}>
            <Text style={[styles.title, hasUrgent && styles.urgentTitle]}>
                <MaterialCommunityIcons
                    name={hasUrgent ? "alert-octagram" : "trophy"}
                    size={24}
                    color={hasUrgent ? "#ff4d4d" : "#ffd700"}
                />
                {hasUrgent ? " Priority Alert" : " The Oracle's Insight"}
                <TouchableOpacity onPress={handleSpeak} style={styles.micButton}>
                    <Ionicons name="volume-medium" size={20} color={hasUrgent ? "#ff4d4d" : "#d4af37"} />
                </TouchableOpacity>
            </Text>

            <Text style={styles.message}>{message}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

            {tasks && tasks.length > 0 ? (
                <View style={styles.taskList}>
                    {tasks.map((task, index) => (
                        <View key={index} style={styles.taskItem}>
                            <FontAwesome
                                name={task.is_urgent ? "warning" : "pencil-square-o"}
                                size={16}
                                color={task.is_urgent ? "#ff4d4d" : "#666"}
                                style={styles.taskIcon}
                            />
                            <View style={styles.taskDetails}>
                                <Text style={[styles.taskText, task.is_urgent && styles.urgentTaskText]}>
                                    {task.text}
                                </Text>
                                <Text style={styles.taskDue}>Due: {task.due}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            ) : (
                <Text style={styles.emptyMessage}>No high-priority tasks. The path is clear.</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    urgentCard: {
        borderWidth: 2,
        borderColor: '#ff4d4d',
        backgroundColor: '#fff5f5',
    },
    loading: {
        opacity: 0.6,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    urgentTitle: {
        color: '#ff4d4d',
    },
    message: {
        fontSize: 16,
        lineHeight: 22,
        color: '#333',
        marginBottom: 12,
    },
    taskList: {
        marginTop: 8,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    taskIcon: {
        marginTop: 4,
        marginRight: 10,
    },
    taskDetails: {
        flex: 1,
    },
    taskText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#444',
    },
    urgentTaskText: {
        color: '#ff4d4d',
        fontWeight: '700',
    },
    taskDue: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    emptyMessage: {
        fontSize: 14,
        fontStyle: 'italic',
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
    },
    skeletonText: {
        height: 12,
        backgroundColor: '#e0e0e0',
        borderRadius: 6,
        marginBottom: 8,
        width: '90%',
    },
    micButton: {
        marginLeft: 'auto',
        padding: 4,
    },
    subtitle: {
        fontSize: 12,
        fontStyle: 'italic',
        color: '#d4af37',
        textAlign: 'center',
        marginTop: -8,
        marginBottom: 12,
    }
});

export default OracleInsight;
