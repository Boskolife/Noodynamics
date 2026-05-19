/**
 * E-book reader entry point.
 * Initializes reader UI, state, and panels.
 */

import { initReaderUI } from './reader-ui.js';
import { initAudioPlayer } from '../ui/audio-player.js';

function initReader() {
  initReaderUI();
  initAudioPlayer();
}

if (typeof document !== 'undefined') {
  const { readyState } = document;
  if (readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReader);
  } else {
    initReader();
  }
}
