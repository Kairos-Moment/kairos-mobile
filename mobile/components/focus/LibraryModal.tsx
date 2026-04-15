import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SavedTrack } from '@/api/focus';

interface Props {
    visible: boolean;
    onClose: () => void;
    savedTracks: SavedTrack[];
    onSelectTrack: (track: SavedTrack) => void;
    onDeleteTrack: (id: number) => void;
}

export default function LibraryModal({ visible, onClose, savedTracks, onSelectTrack, onDeleteTrack }: Props) {
    const [search, setSearch] = useState('');

    const filtered = savedTracks.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = (id: number) => {
        Alert.alert('Remove Track', 'Remove this from your library?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => onDeleteTrack(id) },
        ]);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Ionicons name="musical-notes" size={20} color="#d4af37" />
                            <Text style={styles.title}>Personal Library</Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchRow}>
                        <Ionicons name="search" size={16} color="#888" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search your tracks..."
                            placeholderTextColor="#555"
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>

                    {filtered.length === 0 ? (
                        <Text style={styles.empty}>No tracks saved yet.</Text>
                    ) : (
                        <FlatList
                            data={filtered}
                            keyExtractor={item => item.id.toString()}
                            renderItem={({ item }) => (
                                <View style={styles.trackRow}>
                                    <TouchableOpacity
                                        style={styles.trackTitle}
                                        onPress={() => { onSelectTrack(item); onClose(); }}
                                    >
                                        <Ionicons name="play-circle-outline" size={18} color="#d4af37" />
                                        <Text style={styles.trackText} numberOfLines={1}>{item.title}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                                        <Ionicons name="trash-outline" size={18} color="#e57373" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modal: {
        backgroundColor: '#1a1a2e',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '70%',
        borderTopWidth: 1,
        borderColor: 'rgba(212,175,55,0.3)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 10,
        paddingHorizontal: 12,
        marginBottom: 16,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        paddingVertical: 10,
        fontSize: 14,
    },
    trackRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    trackTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
        marginRight: 12,
    },
    trackText: {
        color: '#fff',
        fontSize: 15,
        flex: 1,
    },
    empty: {
        color: '#555',
        textAlign: 'center',
        marginTop: 30,
        fontSize: 14,
    },
});
