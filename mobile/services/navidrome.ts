import { NavidromeCredentials } from '@/utils/navidromeCredentials';

const CLIENT_NAME = 'KairosMobile';
const API_VERSION = '1.16.1';

export interface NavidromeSong {
    id: string;
    title: string;
    artist: string;
    album: string;
    duration?: number;
    coverArt?: string;
}

export interface NavidromePlaylist {
    id: string;
    name: string;
    songCount: number;
}

interface SubsonicResponse {
    status: string;
    error?: { message?: string };
    [key: string]: unknown;
}

function authParams(creds: NavidromeCredentials): Record<string, string> {
    return {
        u: creds.username,
        p: creds.password,
        v: API_VERSION,
        c: CLIENT_NAME,
        f: 'json',
    };
}

function buildUrl(creds: NavidromeCredentials, endpoint: string, extra: Record<string, string> = {}): string {
    const params = new URLSearchParams({ ...authParams(creds), ...extra });
    return `${creds.serverUrl}/rest/${endpoint}?${params.toString()}`;
}

async function subsonicRequest<T>(
    creds: NavidromeCredentials,
    endpoint: string,
    extra: Record<string, string> = {}
): Promise<T> {
    const url = buildUrl(creds, endpoint, extra);
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Navidrome request failed (${res.status})`);
    }
    const json = await res.json();
    const body = json['subsonic-response'] as SubsonicResponse;
    if (!body || body.status !== 'ok') {
        throw new Error(body?.error?.message || 'Navidrome API error');
    }
    return body as T;
}

export async function pingNavidrome(creds: NavidromeCredentials): Promise<boolean> {
    await subsonicRequest<SubsonicResponse>(creds, 'ping.view');
    return true;
}

export function getStreamUrl(creds: NavidromeCredentials, songId: string): string {
    const params = new URLSearchParams({
        id: songId,
        ...authParams(creds),
    });
    return `${creds.serverUrl}/rest/stream?${params.toString()}`;
}

export function getCoverArtUrl(creds: NavidromeCredentials, coverArtId: string, size = 128): string {
    const params = new URLSearchParams({
        id: coverArtId,
        size: String(size),
        ...authParams(creds),
    });
    return `${creds.serverUrl}/rest/getCoverArt?${params.toString()}`;
}

function mapSong(raw: Record<string, unknown>): NavidromeSong {
    return {
        id: String(raw.id),
        title: String(raw.title || 'Unknown'),
        artist: String(raw.artist || 'Unknown Artist'),
        album: String(raw.album || ''),
        duration: typeof raw.duration === 'number' ? raw.duration : undefined,
        coverArt: raw.coverArt ? String(raw.coverArt) : undefined,
    };
}

export async function searchSongs(
    creds: NavidromeCredentials,
    query: string,
    songCount = 25
): Promise<NavidromeSong[]> {
    const body = await subsonicRequest<{
        searchResult3?: { song?: Record<string, unknown> | Record<string, unknown>[] };
    }>(creds, 'search3.view', {
        query,
        songCount: String(songCount),
        albumCount: '0',
        artistCount: '0',
    });

    const songs = body.searchResult3?.song;
    if (!songs) return [];
    const list = Array.isArray(songs) ? songs : [songs];
    return list.map(mapSong);
}

export async function getPlaylists(creds: NavidromeCredentials): Promise<NavidromePlaylist[]> {
    const body = await subsonicRequest<{
        playlists?: { playlist?: Record<string, unknown> | Record<string, unknown>[] };
    }>(creds, 'getPlaylists.view');

    const playlists = body.playlists?.playlist;
    if (!playlists) return [];
    const list = Array.isArray(playlists) ? playlists : [playlists];
    return list.map(p => ({
        id: String(p.id),
        name: String(p.name || 'Playlist'),
        songCount: Number(p.songCount || 0),
    }));
}

export async function getPlaylistSongs(
    creds: NavidromeCredentials,
    playlistId: string
): Promise<NavidromeSong[]> {
    const body = await subsonicRequest<{
        playlist?: { entry?: Record<string, unknown> | Record<string, unknown>[] };
    }>(creds, 'getPlaylist.view', { id: playlistId });

    const entries = body.playlist?.entry;
    if (!entries) return [];
    const list = Array.isArray(entries) ? entries : [entries];
    return list.map(mapSong);
}
