export interface RepeatableTrack {
  source?: string;
  title?: string;
  url?: string;
  loop?: boolean;
}

export function shouldRepeatTrack(track?: RepeatableTrack | null): boolean {
  if (!track) return false;
  if (track.source === 'local') return true;
  return !!track.loop;
}

export function resetPlaybackPosition(currentPositionSeconds: number, startAtSeconds = 0): number {
  return Math.max(0, startAtSeconds);
}
