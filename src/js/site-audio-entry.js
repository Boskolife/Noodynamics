/**
 * Standalone entry for global ambient audio (loaded from footer on all pages).
 * Kept separate from main.js / reader.js so Vite does not attach main.scss to an "audio-player" chunk.
 */

import { initAudioPlayer } from './ui/audio-player.js';

if (typeof document !== 'undefined') {
  const { readyState } = document;
  if (readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAudioPlayer);
  } else {
    initAudioPlayer();
  }
}
