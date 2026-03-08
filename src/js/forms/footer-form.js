/**
 * Footer contact form: validation and submit handler.
 * Logs form data to console on valid submit.
 */

import {
  ERROR_CLASS,
  MESSAGES,
  validateEmail,
  setInvalid,
  setValid,
  getInputValue,
  clearAllFormErrors,
} from './validation.js';

const FORM_SELECTOR = '.footer__col-form';
const { required, email: emailMsg, nameMinLength, messageMinLength } = MESSAGES;

function validateForm(form) {
  const emailInput = form.querySelector('#footer-email');
  const nameInput = form.querySelector('#footer-name');
  const messageInput = form.querySelector('#footer-message');

  let firstInvalid = null;
  const email = getInputValue(emailInput);
  const name = getInputValue(nameInput);
  const message = getInputValue(messageInput);

  if (!email) {
    setInvalid(emailInput, required, 'footer-email-error');
    if (!firstInvalid) firstInvalid = emailInput;
  } else if (!validateEmail(email)) {
    setInvalid(emailInput, emailMsg, 'footer-email-error');
    if (!firstInvalid) firstInvalid = emailInput;
  } else {
    setValid(emailInput, 'footer-email-error');
  }

  if (!name) {
    setInvalid(nameInput, required, 'footer-name-error');
    if (!firstInvalid) firstInvalid = nameInput;
  } else if (name.length < 2) {
    setInvalid(nameInput, nameMinLength, 'footer-name-error');
    if (!firstInvalid) firstInvalid = nameInput;
  } else {
    setValid(nameInput, 'footer-name-error');
  }

  if (message.length > 0 && message.length < 10) {
    setInvalid(messageInput, messageMinLength, 'footer-message-error');
    if (!firstInvalid) firstInvalid = messageInput;
  } else {
    setValid(messageInput, 'footer-message-error');
  }

  return firstInvalid;
}

export function initFooterForm() {
  if (typeof document === 'undefined') return;

  const form = document.querySelector(FORM_SELECTOR);
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const firstInvalid = validateForm(form);
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries());
    console.log('Footer contact form data:', data);
    form.reset();
    clearAllFormErrors(form);
  });

  const clearOnChange = ({ target }) => {
    if (target.matches('input, textarea')) setValid(target, target.id ? `${target.id}-error` : null);
  };
  form.addEventListener('input', clearOnChange);
  form.addEventListener('change', clearOnChange);
}
