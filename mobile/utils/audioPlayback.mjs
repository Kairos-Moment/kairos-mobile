export function shouldRepeatTrack(track) {
  if (!track) return false;
  if (track.source === 'local') return true;
  return !!track.loop;
}

export function resetPlaybackPosition(currentPositionSeconds, startAtSeconds = 0) {
  return Math.max(0, startAtSeconds);
}
