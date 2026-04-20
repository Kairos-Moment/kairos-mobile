import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'kairos_focus';
const NOTIFICATION_ID = 'focus_session';

export const ACTION_PAUSE = 'PAUSE';
export const ACTION_RESUME = 'RESUME';
export const ACTION_STOP = 'STOP';

export async function setupNotifications() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return false;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
            name: 'Focus Session',
            importance: Notifications.AndroidImportance.LOW,
            sound: null,
            vibrationPattern: null,
        });
    }

    // Action categories — only work in standalone builds, not Expo Go
    await Notifications.setNotificationCategoryAsync('focus_active', [
        { identifier: ACTION_PAUSE, buttonTitle: '⏸ Pause', options: { isDestructive: false } },
        { identifier: ACTION_STOP, buttonTitle: '⏹ Stop', options: { isDestructive: true } },
    ]);

    await Notifications.setNotificationCategoryAsync('focus_paused', [
        { identifier: ACTION_RESUME, buttonTitle: '▶ Resume', options: { isDestructive: false } },
        { identifier: ACTION_STOP, buttonTitle: '⏹ Stop', options: { isDestructive: true } },
    ]);

    return true;
}

export async function showSessionNotification(
    timeLeft: number,
    isActive: boolean,
    taskTitle: string
) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_ID,
        content: {
            title: isActive ? '⚡ In Focus — Kairos' : '⏸ Paused — Kairos',
            body: `${taskTitle}  ·  ${timeStr} remaining\nTap to return to your session.`,
            categoryIdentifier: isActive ? 'focus_active' : 'focus_paused',
            autoDismiss: false,
            sticky: true,
            data: { screen: '/(tabs)/focus' },
            ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
        },
        trigger: null,
    });
}

export async function dismissSessionNotification() {
    await Notifications.dismissNotificationAsync(NOTIFICATION_ID);
    await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID);
}
