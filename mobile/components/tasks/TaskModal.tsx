import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Task, Subtask, createTask, updateTask } from '@/api/tasks';
import { Goal, getGoals, createGoal } from '@/api/goals';

interface TaskModalProps {
    visible: boolean;
    onClose: () => void;
    onTaskSaved: (task: Task) => void;
    taskToEdit?: Task | null;
}

export default function TaskModal({ visible, onClose, onTaskSaved, taskToEdit }: TaskModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);
    const [isImportant, setIsImportant] = useState(false);
    const [dueDate, setDueDate] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [goalName, setGoalName] = useState('');
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchGoals = async () => {
            try {
                const fetchedGoals = await getGoals();
                setGoals(fetchedGoals);
            } catch (err) {
                console.error("Failed to fetch goals:", err);
            }
        };
        if (visible) {
            fetchGoals();
        }
    }, [visible]);

    useEffect(() => {
        if (taskToEdit && visible) {
            setTitle(taskToEdit.title);
            setDescription(taskToEdit.description || '');
            setIsUrgent(taskToEdit.is_urgent || false);
            setIsImportant(taskToEdit.is_important || false);
            if (taskToEdit.due_date) {
                setDueDate(new Date(taskToEdit.due_date));
            }
            if (taskToEdit.goal_id) {
                const foundGoal = goals.find(g => g.id === taskToEdit.goal_id);
                if (foundGoal) setGoalName(foundGoal.title);
            }
            setSubtasks(taskToEdit.subtasks || []);
        } else if (visible) {
            // Reset form for new task
            setTitle('');
            setDescription('');
            setIsUrgent(false);
            setIsImportant(false);
            setDueDate(new Date());
            setGoalName('');
            setSubtasks([]);
            setError(null);
        }
    }, [taskToEdit, visible, goals]);

    const handleAddSubtask = () => {
        setSubtasks([...subtasks, { title: '', is_completed: false }]);
    };

    const handleSubtaskChange = (index: number, value: string) => {
        const newSubtasks = [...subtasks];
        newSubtasks[index].title = value;
        setSubtasks(newSubtasks);
    };

    const handleRemoveSubtask = (index: number) => {
        setSubtasks(subtasks.filter((_, i) => i !== index));
    };

    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDueDate(selectedDate);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            setError("Task Title is required.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Goal Logic: Find ID or Create New
            let finalGoalId = null;
            if (goalName.trim()) {
                const existingGoal = goals.find(g => g.title.toLowerCase() === goalName.trim().toLowerCase());
                if (existingGoal) {
                    finalGoalId = existingGoal.id;
                } else {
                    const newGoal = await createGoal({
                        title: goalName,
                        status: 'active',
                        description: 'Created from task modal'
                    });
                    finalGoalId = newGoal.id;
                }
            }

            const taskData: Partial<Task> = {
                title,
                description,
                is_urgent: isUrgent,
                is_important: isImportant,
                due_date: dueDate.toISOString(),
                goal_id: finalGoalId,
                status: taskToEdit ? taskToEdit.status : 'pending',
                subtasks: subtasks.filter(st => st.title.trim() !== '')
            };

            let response: Task;
            if (taskToEdit) {
                response = await updateTask(taskToEdit.id, taskData);
            } else {
                response = await createTask(taskData);
            }

            onTaskSaved(response);
            onClose();
        } catch (err) {
            console.error("Failed to save task:", err);
            setError("Could not save task. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContainer}
                >
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={28} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>{taskToEdit ? 'Edit Task' : 'New Task'}</Text>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            style={styles.saveButton}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.form}>
                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Task Title</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="What needs to be done?"
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description (Optional)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Add details..."
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.label}>Priority</Text>
                            <View style={styles.priorityContainer}>
                                <TouchableOpacity
                                    style={[styles.priorityBtn, isUrgent && styles.urgentActive]}
                                    onPress={() => setIsUrgent(!isUrgent)}
                                >
                                    <Ionicons name="flash" size={16} color={isUrgent ? '#fff' : '#666'} />
                                    <Text style={[styles.priorityBtnText, isUrgent && styles.activeText]}>Urgent</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.priorityBtn, isImportant && styles.importantActive]}
                                    onPress={() => setIsImportant(!isImportant)}
                                >
                                    <Ionicons name="star" size={16} color={isImportant ? '#fff' : '#666'} />
                                    <Text style={[styles.priorityBtnText, isImportant && styles.activeText]}>Important</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Due Date</Text>
                            <TouchableOpacity
                                style={styles.datePickerBtn}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={20} color="#2196f3" />
                                <Text style={styles.dateText}>
                                    {dueDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                </Text>
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={dueDate}
                                    mode="datetime"
                                    display="default"
                                    onChange={onDateChange}
                                />
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Goal / Category</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Health, Work, Personal"
                                value={goalName}
                                onChangeText={setGoalName}
                            />
                        </View>

                        <View style={styles.subtasksHeader}>
                            <Text style={styles.label}>Sub-tasks</Text>
                            <TouchableOpacity onPress={handleAddSubtask} style={styles.addBtn}>
                                <Ionicons name="add-circle" size={24} color="#d4af37" />
                            </TouchableOpacity>
                        </View>

                        {subtasks.map((st, index) => (
                            <View key={index} style={styles.subtaskItem}>
                                <TextInput
                                    style={styles.subtaskInput}
                                    placeholder={`Step ${index + 1}`}
                                    value={st.title}
                                    onChangeText={(val) => handleSubtaskChange(index, val)}
                                />
                                <TouchableOpacity onPress={() => handleRemoveSubtask(index)}>
                                    <Ionicons name="trash-outline" size={20} color="#f44336" />
                                </TouchableOpacity>
                            </View>
                        ))}

                        <View style={{ height: 40 }} />
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '90%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    closeButton: {
        padding: 4,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    saveButton: {
        backgroundColor: '#d4af37',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    form: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    section: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#eee',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    priorityContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    priorityBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
        gap: 8,
    },
    urgentActive: {
        backgroundColor: '#ff4d4d',
    },
    importantActive: {
        backgroundColor: '#2196f3',
    },
    priorityBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    activeText: {
        color: '#fff',
    },
    datePickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f7ff',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#cce5ff',
        gap: 10,
    },
    dateText: {
        fontSize: 16,
        color: '#333',
    },
    subtasksHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    subtaskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        paddingRight: 12,
    },
    subtaskInput: {
        flex: 1,
        padding: 10,
        fontSize: 14,
        color: '#333',
    },
    addBtn: {
        padding: 4,
    },
    errorContainer: {
        backgroundColor: '#ffebee',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    errorText: {
        color: '#f44336',
        fontSize: 14,
    },
});
