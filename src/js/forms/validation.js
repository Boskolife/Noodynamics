/**
 * Shared form validation helpers: error state, messages, email check.
 * Used by footer, journal, make-donation and other form modules.
 */

export const ERROR_CLASS = 'is-invalid';

export const MESSAGES = {
  required: 'This field is required.',
  email: 'Please enter a valid email address.',
  nameMinLength: 'Must be at least 2 characters.',
  messageMinLength: 'Message must be at least 10 characters.',
  amountInvalid: 'Please enter a valid amount.',
  /** Membership application: agree to institutional principles / terms. */
  agreeTerms: 'You must agree to the membership terms to continue.',
  /** Donation form: agree to create an account. */
  agreeCreateAccount: 'You must agree to create an account to continue.',
  /** Password strength: 8+ chars, upper, lower, number. */
  passwordStrength: 'Password must be at least 8 characters with one uppercase, one lowercase, and one number.',
  /** Password and confirm must match. */
  passwordMismatch: 'Passwords do not match.',
  /** Verification code: 6 digits. */
  verificationCodeInvalid: 'Please enter a valid 6-digit code.',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value) {
  return EMAIL_REGEX.test(value ?? '');
}

/** Password: min 8 chars, at least one upper, one lower, one number. */
export function validatePasswordStrength(value) {
  const v = value ?? '';
  if (v.length < 8) return false;
  if (!/[A-Z]/.test(v)) return false;
  if (!/[a-z]/.test(v)) return false;
  if (!/[0-9]/.test(v)) return false;
  return true;
}

export function getErrorElement(idOrInput) {
  const id = typeof idOrInput === 'string' ? idOrInput : (idOrInput?.id || idOrInput?.name);
  if (!id) return null;
  const errorId = id.endsWith('-error') ? id : `${id}-error`;
  return document.getElementById(errorId);
}

export function setErrorById(errorId, message) {
  const el = document.getElementById(errorId);
  if (el) el.textContent = message;
}

export function clearErrorById(errorId) {
  const el = document.getElementById(errorId);
  if (el) el.textContent = '';
}

export function setInvalid(input, message, errorId) {
  if (input) {
    input.classList.add(ERROR_CLASS);
    input.setAttribute('aria-invalid', 'true');
  }
  if (errorId) setErrorById(errorId, message);
}

export function setValid(input, errorId) {
  if (input) {
    input.classList.remove(ERROR_CLASS);
    input.removeAttribute('aria-invalid');
  }
  if (errorId) clearErrorById(errorId);
}

export function getInputValue(input) {
  return (input?.value ?? '').trim();
}

export function clearAllFormErrors(form) {
  form.querySelectorAll('[id$="-error"]').forEach((el) => { el.textContent = ''; });
  form.querySelectorAll(`.${ERROR_CLASS}`).forEach((el) => el.classList.remove(ERROR_CLASS));
  form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
}
