/**
 * Auth popup: open via header login button, close via overlay, close button, or Escape.
 */

const BACKDROP_SELECTOR = '#auth-popup-backdrop';
const OPEN_BTN_SELECTOR = '.js-open-auth-popup';
const OPEN_CLASS = 'is-open';

function initAuthPopup() {
  const backdrop = document.querySelector(BACKDROP_SELECTOR);
  const openButtons = document.querySelectorAll(OPEN_BTN_SELECTOR);

  if (!backdrop) return;

  function open() {
    backdrop.classList.add(OPEN_CLASS);
    backdrop.setAttribute('aria-hidden', 'false');
    const openBtn = document.querySelector(OPEN_BTN_SELECTOR);
    if (openBtn) openBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    const focusTarget = backdrop.querySelector('button:not(.auth-popup__close), [href], input');
    if (focusTarget) focusTarget.focus();
  }

  function close() {
    backdrop.classList.remove(OPEN_CLASS);
    backdrop.setAttribute('aria-hidden', 'true');
    const openBtn = document.querySelector(OPEN_BTN_SELECTOR);
    if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    openBtn?.focus();
  }

  function handleKeydown(e) {
    if (e.key !== 'Escape') return;
    if (!backdrop.classList.contains(OPEN_CLASS)) return;
    e.preventDefault();
    close();
  }

  openButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      open();
    });
  });

  backdrop.querySelector('.auth-popup__overlay')?.addEventListener('click', close);
  backdrop.querySelector('.auth-popup__close')?.addEventListener('click', close);

  document.addEventListener('keydown', handleKeydown);

  // Prevent form submit from navigating; could add real submit logic later
  backdrop.querySelector('.auth-popup__form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    // close(); // optionally close on submit
  });
}

export { initAuthPopup };
