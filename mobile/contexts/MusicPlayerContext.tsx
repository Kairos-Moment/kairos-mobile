import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { shouldRepeatTrack } from '@/utils/audioPlayback';

export type TrackSource = 'ambient' | 'local' | 'navidrome' | 'saved';

export interface PlayableTrack {
    url: string;
    title: string;
    artist?: string;
    artworkUrl?: string;
    source: TrackSource;
    loop?: boolean;
}

interface MusicPlayerContextValue {
    currentTrack: PlayableTrack | null;
    streamUrl: string | null;
    playTrack: (track: PlayableTrack) => void;
    stop: () => void;
    pause: () => void;
    resume: () => void;
    restartCurrentTrack: () => void;
    setFocusSessionActive: (active: boolean) => void;
    hasTrack: boolean;
}

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null);

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
    const [currentTrack, setCurrentTrack] = useState<PlayableTrack | null>(null);
    const [streamUrl, setStreamUrl] = useState<string | null>(null);
    const focusSessionActiveRef = useRef(false);

    const player = useAudioPlayer(streamUrl ?? undefined);

    useEffect(() => {
        setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: true,
        });
    }, []);

    useEffect(() => {
        if (!player) return;
        player.loop = shouldRepeatTrack(currentTrack);
    }, [player, currentTrack]);

    const syncPlayback = useCallback(() => {
        if (!player || !streamUrl) return;
        if (focusSessionActiveRef.current) {
            player.play();
        } else {
            player.pause();
        }
    }, [player, streamUrl]);

    useEffect(() => {
        syncPlayback();
    }, [streamUrl, player, syncPlayback]);

    const playTrack = useCallback((track: PlayableTrack) => {
        setCurrentTrack(track);
        setStreamUrl(track.url);
    }, []);

    const stop = useCallback(() => {
        player?.pause();
        setCurrentTrack(null);
        setStreamUrl(null);
    }, [player]);

    const pause = useCallback(() => {
        player?.pause();
    }, [player]);

    const resume = useCallback(() => {
        if (streamUrl && focusSessionActiveRef.current) {
            player?.play();
        }
    }, [player, streamUrl]);

    const restartCurrentTrack = useCallback(() => {
        if (!player || !streamUrl) return;
        void player.seekTo(0);
        if (focusSessionActiveRef.current) {
            player.play();
        } else {
            player.pause();
        }
    }, [player, streamUrl]);

    const setFocusSessionActive = useCallback(
        (active: boolean) => {
            focusSessionActiveRef.current = active;
            syncPlayback();
        },
        [syncPlayback]
    );

    const value: MusicPlayerContextValue = {
        currentTrack,
        streamUrl,
        playTrack,
        stop,
        pause,
        resume,
        restartCurrentTrack,
        setFocusSessionActive,
        hasTrack: !!streamUrl,
    };

    return (
        <MusicPlayerContext.Provider value={value}>
            {children}
        </MusicPlayerContext.Provider>
    );
}

export function useMusicPlayer(): MusicPlayerContextValue {
    const ctx = useContext(MusicPlayerContext);
    if (!ctx) {
        throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
    }
    return ctx;
}
