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

/** Get error element id for a rule (input id + '-error' or explicit errorId). */
function getErrorId(rule) {
  if (rule.errorId) return rule.errorId;
  if (rule.type === 'radio' && rule.name) return `${rule.name}-error`;
  return rule.id ? `${rule.id}-error` : null;
}

export function setRadioGroupInvalid(form, name, errorId, message) {
  form.querySelectorAll(`input[name="${name}"]`).forEach((r) => {
    r.classList.add(ERROR_CLASS);
    r.setAttribute('aria-invalid', 'true');
  });
  setErrorById(errorId, message);
}

export function setRadioGroupValid(form, name, errorId) {
  form.querySelectorAll(`input[name="${name}"]`).forEach((r) => {
    r.classList.remove(ERROR_CLASS);
    r.removeAttribute('aria-invalid');
  });
  clearErrorById(errorId);
}

/**
 * Validate a form using a list of rules. Returns the first invalid element or null.
 * Rules: array of objects. Each rule can be:
 * - Input: { id, errorId?, required?, minLength?, email?, passwordStrength?, amount?, when?(form) }
 * - Radio: { type: 'radio', name, errorId? }
 * - Checkbox: { type: 'checkbox', id, errorId?, message? } (message used when unchecked)
 * - Select: { type: 'select', id, errorId?, wrapperSelector? } (wrapperSelector for custom select wrapper)
 * - Match: { id, errorId?, matchId, required? } (value must match matchId field, e.g. confirm password)
 * - VerificationCode: { id, errorId?, required? } (6 digits)
 * When "when" is a function: rule is only validated (and cleared) when when(form) is true.
 */
export function validateFormWithRules(form, rules) {
  let firstInvalid = null;
  const msg = MESSAGES;

  for (const rule of rules) {
    const errorId = getErrorId(rule);
    if (rule.when && typeof rule.when === 'function' && !rule.when(form)) {
      const input = rule.type === 'radio' ? form.querySelector(`input[name="${rule.name}"]`) : form.querySelector(`#${rule.id}`);
      if (rule.type === 'select' && rule.wrapperSelector) {
        const wrapper = form.querySelector(rule.wrapperSelector);
        if (wrapper) wrapper.classList.remove(ERROR_CLASS);
      }
      if (input) setValid(input, errorId);
      continue;
    }

    if (rule.type === 'radio') {
      const checked = form.querySelector(`input[name="${rule.name}"]:checked`);
      if (!checked) {
        setRadioGroupInvalid(form, rule.name, errorId, msg.required);
        if (!firstInvalid) firstInvalid = form.querySelector(`input[name="${rule.name}"]`);
      } else {
        setRadioGroupValid(form, rule.name, errorId);
      }
      continue;
    }

    if (rule.type === 'checkbox') {
      const input = form.querySelector(`#${rule.id}`);
      const message = rule.message ?? msg.required;
      if (!input?.checked) {
        setInvalid(input, message, errorId);
        if (!firstInvalid) firstInvalid = input;
      } else {
        setValid(input, errorId);
      }
      continue;
    }

    if (rule.type === 'select') {
      const input = form.querySelector(`#${rule.id}`);
      const value = getInputValue(input);
      const wrapper = rule.wrapperSelector ? form.querySelector(rule.wrapperSelector) : null;
      if (!value) {
        if (input) {
          input.classList.add(ERROR_CLASS);
          input.setAttribute('aria-invalid', 'true');
        }
        if (wrapper) wrapper.classList.add(ERROR_CLASS);
        setErrorById(errorId, msg.required);
        if (!firstInvalid) firstInvalid = wrapper?.querySelector('.select__trigger') ?? input;
      } else {
        if (input) setValid(input, null);
        if (wrapper) wrapper.classList.remove(ERROR_CLASS);
        clearErrorById(errorId);
      }
      continue;
    }

    const input = form.querySelector(`#${rule.id}`);
    if (!input) continue;

    const value = getInputValue(input);

    if (rule.matchId) {
      const matchValue = getInputValue(form.querySelector(`#${rule.matchId}`));
      if (rule.required && !value) {
        setInvalid(input, msg.required, errorId);
        if (!firstInvalid) firstInvalid = input;
      } else if (value !== matchValue) {
        setInvalid(input, msg.passwordMismatch, errorId);
        if (!firstInvalid) firstInvalid = input;
      } else {
        setValid(input, errorId);
      }
      continue;
    }

    if (rule.verificationCode) {
      if (!value) {
        setInvalid(input, msg.required, errorId);
        if (!firstInvalid) firstInvalid = input;
      } else if (!/^\d{6}$/.test(value)) {
        setInvalid(input, msg.verificationCodeInvalid, errorId);
        if (!firstInvalid) firstInvalid = input;
      } else {
        setValid(input, errorId);
      }
      continue;
    }

    if (rule.required && !value) {
      setInvalid(input, msg.required, errorId);
      if (!firstInvalid) firstInvalid = input;
      continue;
    }

    if (!value && !rule.required) {
      setValid(input, errorId);
      continue;
    }

    if (rule.minLength != null && value.length < rule.minLength) {
      setInvalid(input, rule.minLength === 2 ? msg.nameMinLength : msg.messageMinLength, errorId);
      if (!firstInvalid) firstInvalid = input;
      continue;
    }

    if (rule.email && !validateEmail(value)) {
      setInvalid(input, msg.email, errorId);
      if (!firstInvalid) firstInvalid = input;
      continue;
    }

    if (rule.passwordStrength && !validatePasswordStrength(value)) {
      setInvalid(input, msg.passwordStrength, errorId);
      if (!firstInvalid) firstInvalid = input;
      continue;
    }

    if (rule.amount) {
      const num = parseFloat(String(value).replace(/,/g, '.'));
      if (Number.isNaN(num) || num <= 0) {
        setInvalid(input, msg.amountInvalid, errorId);
        if (!firstInvalid) firstInvalid = input;
        continue;
      }
    }

    setValid(input, errorId);
  }

  return firstInvalid;
}

/** Clear error for one field by input/name (e.g. on input event). Use for forms that use validateFormWithRules. */
export function clearFieldErrorByTarget(form, target) {
  const id = target.id;
  const name = target.getAttribute('name');
  if (name && target.type === 'radio') {
    setRadioGroupValid(form, name, `${name}-error`);
    return;
  }
  if (id) setValid(target, `${id}-error`);
}
