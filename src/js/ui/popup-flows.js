/**
 * Auth-related popup flow: reset password, verify code, new password, complete, signup.
 * Links modals and form validation. Depends on initAuthPopup (initPopupsClose) having run first.
 */

import { closePopup } from './auth-popup.js';
import {
  validateFormWithRules,
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

const RESET_PASS_RULES = [
  { id: 'reset-pass-email', required: true, email: true },
];

const VERIFY_CODE_RULES = [
  { id: 'verify-code-input', errorId: 'verify-code-error', required: true, verificationCode: true },
];

const ENTER_NEW_PASSWORD_RULES = [
  { id: 'new-password', required: true, passwordStrength: true },
  { id: 'confirm-new-password', required: true, matchId: 'new-password' },
];

const SIGNUP_RULES = [
  { id: 'signup-first-name', required: true, minLength: 2 },
  { id: 'signup-last-name', required: true, minLength: 2 },
  { id: 'signup-email', required: true, email: true },
  { id: 'signup-password', required: true, passwordStrength: true },
  { id: 'signup-password-confirm', required: true, matchId: 'signup-password' },
];

function getOpenPopup() {
  return document.querySelector('.popup.is-open');
}

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
        const firstInvalid = validateFormWithRules(signupForm, SIGNUP_RULES);
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
      const firstInvalid = validateFormWithRules(resetPassForm, RESET_PASS_RULES);
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
      const firstInvalid = validateFormWithRules(verifyCodeForm, VERIFY_CODE_RULES);
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
      const firstInvalid = validateFormWithRules(enterNewPasswordForm, ENTER_NEW_PASSWORD_RULES);
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
