/**
 * Journal subscribe form: custom validation errors and submit handler.
 * Shows per-field errors (like footer form), sets aria-invalid, focuses first invalid.
 * Logs form data to console on valid submit.
 */

const FORM_SELECTOR = '.journal__top-form';
const ERROR_CLASS = 'is-invalid';

const messages = {
  required: 'This field is required.',
  email: 'Please enter a valid email address.',
  nameMinLength: 'Name must be at least 2 characters.',
};

function getErrorElement(input) {
  const id = input.id || input.name;
  if (!id) return null;
  return document.getElementById(`${id}-error`);
}

function setInvalid(input, message) {
  input.classList.add(ERROR_CLASS);
  input.setAttribute('aria-invalid', 'true');
  const errorEl = getErrorElement(input);
  if (errorEl) {
    errorEl.textContent = message;
  }
}

function setValid(input) {
  input.classList.remove(ERROR_CLASS);
  input.removeAttribute('aria-invalid');
  const id = input.id || input.name;
  if (!id) return;
  const errorEl = document.getElementById(`${id}-error`);
  if (errorEl) {
    errorEl.textContent = '';
  }
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '');
}

function validateForm(form) {
  const nameInput = form.querySelector('#journal-name');
  const emailInput = form.querySelector('#journal-email');

  let firstInvalid = null;

  const name = (nameInput?.value || '').trim();
  const email = (emailInput?.value || '').trim();

  if (!name) {
    setInvalid(nameInput, messages.required);
    if (!firstInvalid) firstInvalid = nameInput;
  } else if (name.length < 2) {
    setInvalid(nameInput, messages.nameMinLength);
    if (!firstInvalid) firstInvalid = nameInput;
  } else {
    setValid(nameInput);
  }

  if (!email) {
    setInvalid(emailInput, messages.required);
    if (!firstInvalid) firstInvalid = emailInput;
  } else if (!validateEmail(email)) {
    setInvalid(emailInput, messages.email);
    if (!firstInvalid) firstInvalid = emailInput;
  } else {
    setValid(emailInput);
  }

  return firstInvalid;
}

function clearFieldError(input) {
  setValid(input);
}

export function initJournalForm() {
  if (typeof document === 'undefined') return;

  const form = document.querySelector(FORM_SELECTOR);
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const firstInvalid = validateForm(form);
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    console.log('Journal subscribe form data:', data);

    form.reset();
    form.querySelectorAll('[id$="-error"]').forEach((el) => {
      el.textContent = '';
    });
  });

  form.addEventListener('input', (event) => {
    const target = event.target;
    if (target.matches('input')) {
      clearFieldError(target);
    }
  });

  form.addEventListener('change', (event) => {
    const target = event.target;
    if (target.matches('input')) {
      clearFieldError(target);
    }
  });
}
