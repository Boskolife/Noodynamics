/**
 * Footer contact form: custom validation errors and submit handler.
 * Shows per-field errors (like application form), sets aria-invalid, focuses first invalid.
 * Logs form data to console on valid submit.
 */

const FORM_SELECTOR = '.footer__col-form';
const ERROR_CLASS = 'is-invalid';

const messages = {
  required: 'This field is required.',
  email: 'Please enter a valid email address.',
  nameMinLength: 'Name must be at least 2 characters.',
  messageMinLength: 'Message must be at least 10 characters.',
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
  const emailInput = form.querySelector('#footer-email');
  const nameInput = form.querySelector('#footer-name');
  const messageInput = form.querySelector('#footer-message');

  let firstInvalid = null;

  const email = (emailInput?.value || '').trim();
  const name = (nameInput?.value || '').trim();
  const message = (messageInput?.value || '').trim();

  if (!email) {
    setInvalid(emailInput, messages.required);
    if (!firstInvalid) firstInvalid = emailInput;
  } else if (!validateEmail(email)) {
    setInvalid(emailInput, messages.email);
    if (!firstInvalid) firstInvalid = emailInput;
  } else {
    setValid(emailInput);
  }

  if (!name) {
    setInvalid(nameInput, messages.required);
    if (!firstInvalid) firstInvalid = nameInput;
  } else if (name.length < 2) {
    setInvalid(nameInput, messages.nameMinLength);
    if (!firstInvalid) firstInvalid = nameInput;
  } else {
    setValid(nameInput);
  }

  if (message.length > 0 && message.length < 10) {
    setInvalid(messageInput, messages.messageMinLength);
    if (!firstInvalid) firstInvalid = messageInput;
  } else {
    setValid(messageInput);
  }

  return firstInvalid;
}

function clearFieldError(input) {
  setValid(input);
}

export function initFooterForm() {
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

    console.log('Footer contact form data:', data);

    form.reset();
    form.querySelectorAll('[id$="-error"]').forEach((el) => {
      el.textContent = '';
    });
  });

  form.addEventListener('input', (event) => {
    const target = event.target;
    if (target.matches('input, textarea')) {
      clearFieldError(target);
    }
  });

  form.addEventListener('change', (event) => {
    const target = event.target;
    if (target.matches('input, textarea')) {
      clearFieldError(target);
    }
  });
}
