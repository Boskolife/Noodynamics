/**
 * Modals: shared close behaviour (overlay, close button, Escape).
 * Auth popup: open via header button .js-open-auth-popup.
 * Simple auth: login form submit sets logged-in state and toggles header buttons.
 */

const OPEN_CLASS = 'is-open';
const AUTH_BACKDROP_ID = 'auth-popup-backdrop';
const OPEN_BTN_SELECTOR = '.js-open-auth-popup';
const PROFILE_BTN_SELECTOR = '.js-header-profile';
const PROFILE_DROPDOWN_ID = 'header-profile-dropdown';
const PROFILE_WRAP_SELECTOR = '.header__profile-wrap';
const AUTH_STORAGE_KEY = 'auth_logged_in';

function getAuthState() {
  return sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true';
}

function setAuthState(loggedIn) {
  if (loggedIn) {
    sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
  } else {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function updateHeaderAuthUI(loggedIn) {
  const loginBtn = document.querySelector(OPEN_BTN_SELECTOR);
  const profileBtn = document.querySelector(PROFILE_BTN_SELECTOR);
  const authHidden = 'is-auth-hidden';

  if (loginBtn) {
    if (loggedIn) {
      loginBtn.classList.add(authHidden);
      loginBtn.setAttribute('aria-expanded', 'false');
    } else {
      loginBtn.classList.remove(authHidden);
    }
  }
  if (profileBtn) {
    if (loggedIn) {
      profileBtn.classList.remove(authHidden);
    } else {
      profileBtn.classList.add(authHidden);
    }
  }
}

export function closePopup(backdrop) {
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
  updateHeaderAuthUI(getAuthState());

  const backdrop = document.getElementById(AUTH_BACKDROP_ID);
  const openButtons = document.querySelectorAll(OPEN_BTN_SELECTOR);
  if (!backdrop) return;

  const authForm = backdrop.querySelector('.popup__form');
  if (authForm) {
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = authForm.querySelector('#auth-name');
      const passwordInput = authForm.querySelector('#auth-password');
      const name = (nameInput?.value ?? '').trim();
      const password = (passwordInput?.value ?? '').trim();
      if (!name || !password) return;
      setAuthState(true);
      closePopup(backdrop);
      updateHeaderAuthUI(true);
      authForm.reset();
      document.querySelector(PROFILE_BTN_SELECTOR)?.focus();
    });
  }

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

  initProfileDropdown();
}

function initProfileDropdown() {
  const profileBtn = document.querySelector(PROFILE_BTN_SELECTOR);
  const dropdown = document.getElementById(PROFILE_DROPDOWN_ID);
  const wrap = document.querySelector(PROFILE_WRAP_SELECTOR);
  if (!profileBtn || !dropdown || !wrap) return;

  const closeDropdown = () => {
    dropdown.hidden = true;
    profileBtn.setAttribute('aria-expanded', 'false');
  };

  const openDropdown = () => {
    dropdown.hidden = false;
    profileBtn.setAttribute('aria-expanded', 'true');
  };

  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dropdown.hidden) {
      openDropdown();
    } else {
      closeDropdown();
    }
  });

  document.addEventListener('click', (e) => {
    if (dropdown.hidden) return;
    if (!wrap.contains(e.target)) closeDropdown();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || dropdown.hidden) return;
    closeDropdown();
    profileBtn.focus();
  });

  const logoutBtn = dropdown.querySelector('.js-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      setAuthState(false);
      updateHeaderAuthUI(false);
      closeDropdown();
    });
  }
}
