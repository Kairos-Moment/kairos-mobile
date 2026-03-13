import React, { useState } from 'react';
import styles from './LibraryModal.module.css';
import { IoClose, IoSearch, IoTrash, IoMusicalNotes } from 'react-icons/io5';

const LibraryModal = ({ isOpen, onClose, savedTracks, onSelectTrack, onDeleteTrack }) => {
    const [searchTerm, setSearchTerm] = useState('');

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <header className={styles.header}>
                    <h2><IoMusicalNotes /> Personal Library</h2>
                    <button onClick={onClose} className={styles.closeBtn}><IoClose size={24} /></button>
                </header>

                <div className={styles.searchSection}>
                    <div className={styles.searchWrapper}>
                        <IoSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search your tracks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                            autoFocus
                        />
                    </div>
                </div>

                <ul className={styles.trackList}>
                    {savedTracks
                        .filter(track => track.title.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(track => (
                            <li key={track.id} className={styles.trackItem}>
                                <span
                                    className={styles.trackTitle}
                                    onClick={() => { onSelectTrack(track); onClose(); }}
                                    title="Click to play"
                                >
                                    {track.title}
                                </span>
                                <button
                                    onClick={() => onDeleteTrack(track.id)}
                                    className={styles.deleteBtn}
                                    title="Remove from library"
                                >
                                    <IoTrash />
                                </button>
                            </li>
                        ))}
                    {savedTracks.length === 0 && (
                        <li className={styles.emptyState}>No tracks saved yet.</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default LibraryModal;
