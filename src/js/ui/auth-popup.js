/**
 * Modals: shared close behaviour (overlay, close button, Escape).
 * Auth popup: open via header button .js-open-auth-popup.
 */

const OPEN_CLASS = 'is-open';
const AUTH_BACKDROP_ID = 'auth-popup-backdrop';
const OPEN_BTN_SELECTOR = '.js-open-auth-popup';

function closePopup(backdrop) {
  backdrop.classList.remove(OPEN_CLASS);
  backdrop.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (backdrop.id === AUTH_BACKDROP_ID) {
    const openBtn = document.querySelector(OPEN_BTN_SELECTOR);
    openBtn?.setAttribute('aria-expanded', 'false');
    openBtn?.focus();
  }
}

function initPopupsClose() {
  const popups = document.querySelectorAll('.popup');
  popups.forEach((backdrop) => {
    backdrop.querySelector('.popup__overlay')?.addEventListener('click', () => closePopup(backdrop));
    backdrop.querySelector('.popup__close')?.addEventListener('click', () => closePopup(backdrop));
    backdrop.querySelectorAll('.popup__form').forEach((form) => {
      form.addEventListener('submit', (e) => e.preventDefault());
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const openPopup = document.querySelector('.popup.is-open');
    if (openPopup) {
      e.preventDefault();
      closePopup(openPopup);
    }
  });
}

export function initAuthPopup() {
  initPopupsClose();

  const backdrop = document.getElementById(AUTH_BACKDROP_ID);
  const openButtons = document.querySelectorAll(OPEN_BTN_SELECTOR);
  if (!backdrop) return;

  const open = () => {
    backdrop.classList.add(OPEN_CLASS);
    backdrop.setAttribute('aria-hidden', 'false');
    document.querySelector(OPEN_BTN_SELECTOR)?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    backdrop.querySelector('button:not(.popup__close), [href], input')?.focus();
  };

  openButtons.forEach((btn) => btn.addEventListener('click', (e) => {
    e.preventDefault();
    open();
  }));
}
