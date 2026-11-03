import test from 'node:test';
import assert from 'node:assert/strict';

import { shouldRepeatTrack, resetPlaybackPosition } from './audioPlayback.mjs';

test('local encapsulation tracks repeat while the session is running', () => {
  assert.equal(shouldRepeatTrack({ source: 'local', title: 'drone', url: 'file:///audio.mp3' }), true);
  assert.equal(shouldRepeatTrack({ source: 'ambient', title: 'rain', url: 'https://example.com/rain.mp3', loop: true }), true);
  assert.equal(shouldRepeatTrack({ source: 'navidrome', title: 'song', url: 'https://example.com/song.mp3', loop: false }), false);
});

test('reset playback rewinds the current track to the start', () => {
  const startedAt = 42;
  const reset = resetPlaybackPosition(startedAt, 0);
  assert.equal(reset, 0);
});
