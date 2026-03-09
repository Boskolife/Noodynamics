const OPEN_CLASS = 'is-open';
const MODAL_SELECTOR = '.popup, .profile-popup';
const OPEN_SELECTOR = '.popup.is-open, .profile-popup.is-open';
const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
const INERT_SKIP_SELECTOR = '.popup, .profile-popup, script, style, link[rel="stylesheet"]';

let isInitialized = false;
let openSeq = 0;
let lastOpener = null;

function isHTMLElement(node) {
  return node instanceof HTMLElement;
}

function getCloseButtonSelector(modal) {
  if (modal.classList.contains('profile-popup')) return '.profile-popup__close';
  return '.popup__close';
}

function getOverlaySelector(modal) {
  if (modal.classList.contains('profile-popup')) return '.profile-popup__overlay';
  return '.popup__overlay';
}

function getFirstFocusable(modal) {
  const closeBtnSelector = getCloseButtonSelector(modal);
  const focusables = Array.from(modal.querySelectorAll(FOCUSABLE_SELECTOR));
  return focusables.find((el) => !(el.matches(closeBtnSelector)));
}

function getFocusableInside(modal) {
  return Array.from(modal.querySelectorAll(FOCUSABLE_SELECTOR)).filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
}

function blurActiveElementIfInside(modal) {
  const { activeElement } = document;
  if (!isHTMLElement(activeElement)) return;
  if (modal.contains(activeElement)) activeElement.blur();
}

function setBackgroundInert(isOn) {
  const children = Array.from(document.body.children);
  children.forEach((el) => {
    if (!(el instanceof HTMLElement)) return;
    if (el.matches(INERT_SKIP_SELECTOR)) return;
    if (isOn) {
      el.setAttribute('inert', '');
      el.setAttribute('aria-hidden', 'true');
    } else {
      el.removeAttribute('inert');
      el.removeAttribute('aria-hidden');
    }
  });
}

function trapFocus(modal, e) {
  if (e.key !== 'Tab') return;
  const focusables = getFocusableInside(modal);
  if (!focusables.length) {
    e.preventDefault();
    return;
  }
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return;

  if (e.shiftKey) {
    if (active === first || !modal.contains(active)) {
      e.preventDefault();
      last.focus();
    }
    return;
  }

  if (active === last) {
    e.preventDefault();
    first.focus();
  }
}

function setModalOpen(modal, isOpen) {
  if (!isHTMLElement(modal)) return;

  if (isOpen) {
    lastOpener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    modal.classList.add(OPEN_CLASS);
    modal.setAttribute('aria-hidden', 'false');
    modal.dataset.modalOpenSeq = String(++openSeq);
    document.body.style.overflow = 'hidden';
    setBackgroundInert(true);
    getFirstFocusable(modal)?.focus();
    return;
  }

  blurActiveElementIfInside(modal);
  modal.classList.remove(OPEN_CLASS);
  modal.setAttribute('aria-hidden', 'true');
  delete modal.dataset.modalOpenSeq;

  // Restore scroll only when there are no open modals left.
  if (!document.querySelector(OPEN_SELECTOR)) {
    document.body.style.overflow = '';
    setBackgroundInert(false);
    if (lastOpener?.isConnected) lastOpener.focus();
    lastOpener = null;
  }
}

export function openModalById(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  closeAllModals();
  setModalOpen(modal, true);
}

export function closeModal(modal) {
  setModalOpen(modal, false);
}

export function closeModalById(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  closeModal(modal);
}

export function closeAllModals() {
  document.querySelectorAll(OPEN_SELECTOR).forEach((modal) => closeModal(modal));
}

function getTopmostOpenModal() {
  const openModals = Array.from(document.querySelectorAll(OPEN_SELECTOR));
  if (!openModals.length) return null;
  return openModals.reduce((best, cur) => {
    const bestSeq = Number(best?.dataset?.modalOpenSeq ?? 0);
    const curSeq = Number(cur?.dataset?.modalOpenSeq ?? 0);
    return curSeq >= bestSeq ? cur : best;
  }, openModals[0]);
}

export function initModalManager() {
  if (isInitialized) return;
  isInitialized = true;

  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!isHTMLElement(target)) return;

    const modal = target.closest(MODAL_SELECTOR);
    if (!modal?.classList.contains(OPEN_CLASS)) return;

    const overlaySelector = getOverlaySelector(modal);
    const closeBtnSelector = getCloseButtonSelector(modal);

    if (target.closest(overlaySelector) || target.closest(closeBtnSelector)) {
      e.preventDefault();
      closeModal(modal);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const top = getTopmostOpenModal();
    if (!top) return;
    e.preventDefault();
    closeModal(top);
  });

  document.addEventListener('keydown', (e) => {
    const top = getTopmostOpenModal();
    if (!top) return;
    trapFocus(top, e);
  });
}

