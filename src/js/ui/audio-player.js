/**
 * Global ambient audio toggle (bottom-left on all pages).
 */

const AUDIO_SELECTOR = '#site-audio';
const TOGGLE_SELECTOR = '.js-site-audio-toggle';
const MEDIA_SELECTOR = '.js-site-audio-media';
const FOOTER_SELECTOR = '#footer';
const FOOTER_HIDDEN_CLASS = 'site-audio--footer-hidden';
const AUDIO_FILE = 'audio/noodynamics-audio.mp3';
const STORAGE_KEY = 'noodynamics-site-audio';
const TIME_SAVE_INTERVAL_MS = 2000;

function getAudioUrl() {
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${AUDIO_FILE}`;
}

function loadAudioState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { paused: false, time: 0 };
    const parsed = JSON.parse(raw);
    return {
      paused: Boolean(parsed.paused),
      time: Number.isFinite(parsed.time) ? Math.max(0, parsed.time) : 0,
    };
  } catch {
    return { paused: false, time: 0 };
  }
}

function saveAudioState({ paused, time }) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        paused: Boolean(paused),
        time: Number.isFinite(time) ? Math.max(0, time) : 0,
      }),
    );
  } catch {
    // ignore quota / private mode
  }
}

function applySavedTime(media, time) {
  if (time <= 0) return;
  if (Number.isFinite(media.duration) && time < media.duration) {
    media.currentTime = time;
  } else if (!Number.isFinite(media.duration)) {
    media.currentTime = time;
  }
}

function setPlayingState(toggle, isPlaying) {
  toggle.setAttribute('aria-pressed', String(isPlaying));
  toggle.setAttribute('aria-label', isPlaying ? 'Pause ambient audio' : 'Play ambient audio');
}

async function playMedia(media, toggle) {
  try {
    await media.play();
    setPlayingState(toggle, true);
    return true;
  } catch {
    setPlayingState(toggle, false);
    return false;
  }
}

function pauseMedia(media, toggle) {
  media.pause();
  setPlayingState(toggle, false);
}

function initAutoplay(media, toggle, { shouldAutoplay, startTime }) {
  const removeUnlockListeners = () => {
    document.removeEventListener('pointerdown', unlock);
    document.removeEventListener('keydown', unlock);
  };

  const unlock = async () => {
    if (!shouldAutoplay || !media.paused) return;
    const ok = await playMedia(media, toggle);
    if (ok) removeUnlockListeners();
  };

  const attemptAutoplay = async () => {
    if (!shouldAutoplay || !media.paused) return;
    const ok = await playMedia(media, toggle);
    if (ok) {
      removeUnlockListeners();
      return;
    }
    document.addEventListener('pointerdown', unlock, { passive: true });
    document.addEventListener('keydown', unlock, { passive: true });
  };

  const onReady = async () => {
    applySavedTime(media, startTime);

    if (!shouldAutoplay) {
      media.pause();
      setPlayingState(toggle, false);
      return;
    }

    media.addEventListener('playing', () => removeUnlockListeners(), { once: true });
    await attemptAutoplay();
  };

  if (media.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    void onReady();
    return;
  }

  media.addEventListener('canplay', () => void onReady(), { once: true });
}

function initAudioPersistence(media) {
  const persist = () => {
    saveAudioState({ paused: media.paused, time: media.currentTime });
  };

  let lastTimeSave = 0;
  media.addEventListener('timeupdate', () => {
    if (Date.now() - lastTimeSave < TIME_SAVE_INTERVAL_MS) return;
    lastTimeSave = Date.now();
    if (!media.paused) persist();
  });

  media.addEventListener('play', persist);
  media.addEventListener('pause', persist);
  window.addEventListener('pagehide', persist);
}

function initAudioFooterHide(root) {
  const footer = document.querySelector(FOOTER_SELECTOR);
  if (!footer) return;

  const update = () => {
    const footerTop = footer.getBoundingClientRect().top;
    const audioTop = root.getBoundingClientRect().top;
    const shouldHide = footerTop <= audioTop + 8;
    root.classList.toggle(FOOTER_HIDDEN_CLASS, shouldHide);
  };

  let ticking = false;
  const scheduleUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  };

  update();
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
}

export function initAudioPlayer() {
  const root = document.querySelector(AUDIO_SELECTOR);
  if (!root) return;

  const toggle = root.querySelector(TOGGLE_SELECTOR);
  const media = root.querySelector(MEDIA_SELECTOR);
  if (!toggle || !media) return;

  const saved = loadAudioState();

  media.src = getAudioUrl();
  initAudioFooterHide(root);
  initAudioPersistence(media);
  initAutoplay(media, toggle, {
    shouldAutoplay: !saved.paused,
    startTime: saved.time,
  });

  toggle.addEventListener('click', async () => {
    if (media.paused) {
      await playMedia(media, toggle);
    } else {
      pauseMedia(media, toggle);
    }
    saveAudioState({ paused: media.paused, time: media.currentTime });
  });

  media.addEventListener('ended', () => {
    if (!media.loop) setPlayingState(toggle, false);
  });

  media.addEventListener('pause', () => {
    if (!media.ended) setPlayingState(toggle, false);
  });

  media.addEventListener('play', () => {
    setPlayingState(toggle, true);
  });
}
