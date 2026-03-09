const OPEN_CLASS = 'is-open';
const MODAL_SELECTOR = '.popup, .profile-popup';
const OPEN_SELECTOR = '.popup.is-open, .profile-popup.is-open';
const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

let isInitialized = false;
let openSeq = 0;

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

function blurActiveElementIfInside(modal) {
  const { activeElement } = document;
  if (!isHTMLElement(activeElement)) return;
  if (modal.contains(activeElement)) activeElement.blur();
}

function setModalOpen(modal, isOpen) {
  if (!isHTMLElement(modal)) return;

  if (isOpen) {
    modal.classList.add(OPEN_CLASS);
    modal.setAttribute('aria-hidden', 'false');
    modal.dataset.modalOpenSeq = String(++openSeq);
    document.body.style.overflow = 'hidden';
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
}

