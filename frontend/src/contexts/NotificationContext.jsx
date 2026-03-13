import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const NotificationContext = createContext();

export const useNotifications = () => {
    return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState(() => {
        const saved = localStorage.getItem('kairos_notifications');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('kairos_notifications', JSON.stringify(notifications));
    }, [notifications]);

    const addNotification = useCallback((message, type = 'info') => {
        const newNote = {
            id: uuidv4(),
            message,
            type, // 'info', 'success', 'warning', 'urgent'
            isRead: false,
            timestamp: new Date().toISOString(),
        };
        setNotifications((prev) => [newNote, ...prev]);
    }, []);

    const markAsRead = useCallback((id) => {
        setNotifications((prev) =>
            prev.map((note) =>
                note.id === id ? { ...note, isRead: true } : note
            )
        );
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const value = {
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        clearNotifications
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};