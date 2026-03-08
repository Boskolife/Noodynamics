/**
 * Auth-related popup flow: reset password, verify code, new password, complete, signup.
 * Links modals and form validation. Depends on initAuthPopup (initPopupsClose) having run first.
 */

import { closePopup } from './auth-popup.js';
import {
  MESSAGES,
  validateEmail,
  validatePasswordStrength,
  setInvalid,
  setValid,
  getInputValue,
} from '../forms/validation.js';

const OPEN_CLASS = 'is-open';
const AUTH_BACKDROP_ID = 'auth-popup-backdrop';

const POPUP_IDS = {
  resetPass: 'reset-pass-popup-backdrop',
  verifyCode: 'verify-code-popup-backdrop',
  enterNewPassword: 'enter-new-password-popup-backdrop',
  resetComplete: 'reset-complete-popup-backdrop',
  signup: 'signup-popup-backdrop',
};

function getOpenPopup() {
  return document.querySelector('.popup.is-open');
}

/** Error id for popup form inputs (matches setInvalid usage). */
function getPopupErrorId(input) {
  if (!input?.id) return null;
  return input.id === 'verify-code-input' ? 'verify-code-error' : `${input.id}-error`;
}

function clearPopupFieldError(input) {
  setValid(input, getPopupErrorId(input));
}

function openPopupById(id) {
  const open = getOpenPopup();
  if (open) closePopup(open);
  const backdrop = document.getElementById(id);
  if (!backdrop) return;
  backdrop.classList.add(OPEN_CLASS);
  backdrop.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  const focusTarget = backdrop.querySelector('button:not(.popup__close), [href], input');
  focusTarget?.focus();
}

/** Returns null if valid, or the first invalid input element. */
function validateResetPassForm(form) {
  const emailInput = form.querySelector('#reset-pass-email');
  const email = getInputValue(emailInput);
  if (!email) {
    setInvalid(emailInput, MESSAGES.required, 'reset-pass-email-error');
    return emailInput;
  }
  if (!validateEmail(email)) {
    setInvalid(emailInput, MESSAGES.email, 'reset-pass-email-error');
    return emailInput;
  }
  setValid(emailInput, 'reset-pass-email-error');
  return null;
}

/** Returns null if valid, or the first invalid input element. */
function validateVerifyCodeForm(form) {
  const input = form.querySelector('#verify-code-input');
  const value = getInputValue(input);
  if (!value) {
    setInvalid(input, MESSAGES.required, 'verify-code-error');
    return input;
  }
  if (!/^\d{6}$/.test(value)) {
    setInvalid(input, MESSAGES.verificationCodeInvalid, 'verify-code-error');
    return input;
  }
  setValid(input, 'verify-code-error');
  return null;
}

/** Returns null if valid, or the first invalid input element. */
function validateEnterNewPasswordForm(form) {
  const newInput = form.querySelector('#new-password');
  const confirmInput = form.querySelector('#confirm-new-password');
  const newVal = getInputValue(newInput);
  const confirmVal = getInputValue(confirmInput);
  let firstInvalid = null;

  if (!newVal) {
    setInvalid(newInput, MESSAGES.required, 'new-password-error');
    if (!firstInvalid) firstInvalid = newInput;
  } else if (!validatePasswordStrength(newVal)) {
    setInvalid(newInput, MESSAGES.passwordStrength, 'new-password-error');
    if (!firstInvalid) firstInvalid = newInput;
  } else {
    setValid(newInput, 'new-password-error');
  }

  if (!confirmVal) {
    setInvalid(confirmInput, MESSAGES.required, 'confirm-new-password-error');
    if (!firstInvalid) firstInvalid = confirmInput;
  } else if (newVal !== confirmVal) {
    setInvalid(confirmInput, MESSAGES.passwordMismatch, 'confirm-new-password-error');
    if (!firstInvalid) firstInvalid = confirmInput;
  } else {
    setValid(confirmInput, 'confirm-new-password-error');
  }
  return firstInvalid;
}

/** Returns null if valid, or the first invalid input element. */
function validateSignupForm(form) {
  const fields = [
    { id: 'signup-first-name', errorId: 'signup-first-name-error', minLength: 2 },
    { id: 'signup-last-name', errorId: 'signup-last-name-error', minLength: 2 },
    { id: 'signup-email', errorId: 'signup-email-error', email: true },
    { id: 'signup-password', errorId: 'signup-password-error', passwordStrength: true },
  ];
  let firstInvalid = null;

  for (const { id, errorId, minLength, email, passwordStrength } of fields) {
    const input = form.querySelector(`#${id}`);
    const value = getInputValue(input);
    if (!value) {
      setInvalid(input, MESSAGES.required, errorId);
      if (!firstInvalid) firstInvalid = input;
    } else if (minLength && value.length < minLength) {
      setInvalid(input, MESSAGES.nameMinLength, errorId);
      if (!firstInvalid) firstInvalid = input;
    } else if (email && !validateEmail(value)) {
      setInvalid(input, MESSAGES.email, errorId);
      if (!firstInvalid) firstInvalid = input;
    } else if (passwordStrength && !validatePasswordStrength(value)) {
      setInvalid(input, MESSAGES.passwordStrength, errorId);
      if (!firstInvalid) firstInvalid = input;
    } else {
      setValid(input, errorId);
    }
  }

  const confirmInput = form.querySelector('#signup-password-confirm');
  const passVal = getInputValue(form.querySelector('#signup-password'));
  const confirmVal = getInputValue(confirmInput);
  if (!confirmVal) {
    setInvalid(confirmInput, MESSAGES.required, 'signup-password-confirm-error');
    if (!firstInvalid) firstInvalid = confirmInput;
  } else if (passVal !== confirmVal) {
    setInvalid(confirmInput, MESSAGES.passwordMismatch, 'signup-password-confirm-error');
    if (!firstInvalid) firstInvalid = confirmInput;
  } else {
    setValid(confirmInput, 'signup-password-confirm-error');
  }
  return firstInvalid;
}

export function initPopupFlows() {
  const authBackdrop = document.getElementById(AUTH_BACKDROP_ID);
  const signupBackdrop = document.getElementById(POPUP_IDS.signup);
  const resetPassBackdrop = document.getElementById(POPUP_IDS.resetPass);
  const verifyCodeBackdrop = document.getElementById(POPUP_IDS.verifyCode);
  const enterNewPasswordBackdrop = document.getElementById(POPUP_IDS.enterNewPassword);
  const resetCompleteBackdrop = document.getElementById(POPUP_IDS.resetComplete);

  if (authBackdrop) {
    const forgotLink = authBackdrop.querySelector('a.popup__form-link');
    if (forgotLink) {
      forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        openPopupById(POPUP_IDS.resetPass);
      });
    }
    const signupLink = authBackdrop.querySelector('a.popup__link');
    if (signupLink) {
      signupLink.addEventListener('click', (e) => {
        e.preventDefault();
        openPopupById(POPUP_IDS.signup);
      });
    }
  }

  if (signupBackdrop) {
    const loginLink = signupBackdrop.querySelector('.js-open-login');
    if (loginLink) {
      loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        openPopupById(AUTH_BACKDROP_ID);
      });
    }
    const signupForm = signupBackdrop.querySelector('.js-signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const firstInvalid = validateSignupForm(signupForm);
        if (firstInvalid) {
          firstInvalid.focus();
          return;
        }
        const data = Object.fromEntries(new FormData(signupForm).entries());
        console.log('Signup form data:', data);
        signupForm.reset();
        closePopup(signupBackdrop);
      });
      signupForm.addEventListener('input', (e) => {
        if (e.target.matches('input, select, textarea')) clearPopupFieldError(e.target);
      });
    }
  }

  const resetPassForm = resetPassBackdrop?.querySelector('.js-reset-pass-form');
  if (resetPassForm) {
    resetPassForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const firstInvalid = validateResetPassForm(resetPassForm);
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }
      const email = getInputValue(resetPassForm.querySelector('#reset-pass-email'));
      const emailSpan = verifyCodeBackdrop?.querySelector('.js-verify-email');
      if (emailSpan) emailSpan.textContent = email;
      closePopup(resetPassBackdrop);
      openPopupById(POPUP_IDS.verifyCode);
    });
    resetPassForm.addEventListener('input', (e) => {
      if (e.target.matches('input, select, textarea')) clearPopupFieldError(e.target);
    });
  }

  const verifyCodeForm = verifyCodeBackdrop?.querySelector('.js-verify-code-form');
  if (verifyCodeForm) {
    verifyCodeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const firstInvalid = validateVerifyCodeForm(verifyCodeForm);
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }
      const data = Object.fromEntries(new FormData(verifyCodeForm).entries());
      console.log('Verify code form data:', data);
      closePopup(verifyCodeBackdrop);
      openPopupById(POPUP_IDS.enterNewPassword);
    });
    verifyCodeForm.addEventListener('input', (e) => {
      if (e.target.matches('input, select, textarea')) clearPopupFieldError(e.target);
    });
  }
  const resendBtn = verifyCodeBackdrop?.querySelector('.js-resend-code');
  if (resendBtn) {
    resendBtn.addEventListener('click', () => {
      console.log('Resend verification code');
    });
  }

  const enterNewPasswordForm = enterNewPasswordBackdrop?.querySelector('.js-enter-new-password-form');
  if (enterNewPasswordForm) {
    enterNewPasswordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const firstInvalid = validateEnterNewPasswordForm(enterNewPasswordForm);
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }
      const data = Object.fromEntries(new FormData(enterNewPasswordForm).entries());
      console.log('New password form data:', data);
      closePopup(enterNewPasswordBackdrop);
      openPopupById(POPUP_IDS.resetComplete);
    });
    enterNewPasswordForm.addEventListener('input', (e) => {
      if (e.target.matches('input, select, textarea')) clearPopupFieldError(e.target);
    });
  }

  const returnToLoginBtn = resetCompleteBackdrop?.querySelector('.js-return-to-login');
  if (returnToLoginBtn) {
    returnToLoginBtn.addEventListener('click', () => {
      closePopup(resetCompleteBackdrop);
      openPopupById(AUTH_BACKDROP_ID);
    });
  }
}
