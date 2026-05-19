/**
 * Global ambient audio toggle (bottom-left on all pages).
 */

const AUDIO_SELECTOR = '#site-audio';
const TOGGLE_SELECTOR = '.js-site-audio-toggle';
const MEDIA_SELECTOR = '.js-site-audio-media';
const FOOTER_SELECTOR = '#footer';
const FOOTER_HIDDEN_CLASS = 'site-audio--footer-hidden';
const AUDIO_FILE = 'audio/noodynamics-audio.mp3';

function getAudioUrl() {
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${AUDIO_FILE}`;
}

function setPlayingState(toggle, isPlaying) {
  toggle.setAttribute('aria-pressed', String(isPlaying));
  toggle.setAttribute('aria-label', isPlaying ? 'Pause ambient audio' : 'Play ambient audio');
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

  media.src = getAudioUrl();
  initAudioFooterHide(root);

  toggle.addEventListener('click', async () => {
    if (media.paused) {
      try {
        await media.play();
        setPlayingState(toggle, true);
      } catch {
        setPlayingState(toggle, false);
      }
      return;
    }

    media.pause();
    setPlayingState(toggle, false);
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
