/**
 * Auth popup: open via header button, close via overlay, close button, or Escape.
 */

const BACKDROP_SELECTOR = '#auth-popup-backdrop';
const OPEN_BTN_SELECTOR = '.js-open-auth-popup';
const OPEN_CLASS = 'is-open';

export function initAuthPopup() {
  const backdrop = document.querySelector(BACKDROP_SELECTOR);
  const openButtons = document.querySelectorAll(OPEN_BTN_SELECTOR);
  if (!backdrop) return;

  const open = () => {
    backdrop.classList.add(OPEN_CLASS);
    backdrop.setAttribute('aria-hidden', 'false');
    document.querySelector(OPEN_BTN_SELECTOR)?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    backdrop.querySelector('button:not(.auth-popup__close), [href], input')?.focus();
  };

  const close = () => {
    const openBtn = document.querySelector(OPEN_BTN_SELECTOR);
    backdrop.classList.remove(OPEN_CLASS);
    backdrop.setAttribute('aria-hidden', 'true');
    openBtn?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    openBtn?.focus();
  };

  const handleKeydown = (e) => {
    if (e.key === 'Escape' && backdrop.classList.contains(OPEN_CLASS)) {
      e.preventDefault();
      close();
    }
  };

  openButtons.forEach((btn) => btn.addEventListener('click', (e) => { e.preventDefault(); open(); }));
  backdrop.querySelector('.auth-popup__overlay')?.addEventListener('click', close);
  backdrop.querySelector('.auth-popup__close')?.addEventListener('click', close);
  document.addEventListener('keydown', handleKeydown);
  backdrop.querySelector('.auth-popup__form')?.addEventListener('submit', (e) => e.preventDefault());
}
