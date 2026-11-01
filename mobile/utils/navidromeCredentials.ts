import * as SecureStore from 'expo-secure-store';

const KEYS = {
    SERVER_URL: 'navidrome_server_url',
    USERNAME: 'navidrome_username',
    PASSWORD: 'navidrome_password',
} as const;

export interface NavidromeCredentials {
    serverUrl: string;
    username: string;
    password: string;
}

export function normalizeServerUrl(url: string): string {
    let normalized = url.trim().replace(/\/+$/, '');
    if (!normalized) return '';
    if (!/^https?:\/\//i.test(normalized)) {
        normalized = `https://${normalized}`;
    }
    return normalized;
}

export async function getNavidromeCredentials(): Promise<NavidromeCredentials | null> {
    const [serverUrl, username, password] = await Promise.all([
        SecureStore.getItemAsync(KEYS.SERVER_URL),
        SecureStore.getItemAsync(KEYS.USERNAME),
        SecureStore.getItemAsync(KEYS.PASSWORD),
    ]);
    if (!serverUrl || !username || !password) return null;
    return {
        serverUrl: normalizeServerUrl(serverUrl),
        username,
        password,
    };
}

export async function saveNavidromeCredentials(creds: NavidromeCredentials): Promise<void> {
    await Promise.all([
        SecureStore.setItemAsync(KEYS.SERVER_URL, normalizeServerUrl(creds.serverUrl)),
        SecureStore.setItemAsync(KEYS.USERNAME, creds.username.trim()),
        SecureStore.setItemAsync(KEYS.PASSWORD, creds.password),
    ]);
}

export async function clearNavidromeCredentials(): Promise<void> {
    await Promise.all([
        SecureStore.deleteItemAsync(KEYS.SERVER_URL),
        SecureStore.deleteItemAsync(KEYS.USERNAME),
        SecureStore.deleteItemAsync(KEYS.PASSWORD),
    ]);
}
