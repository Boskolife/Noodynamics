/**
 * Journal subscribe form: validation and submit handler.
 * Logs form data to console on valid submit.
 */

import {
  MESSAGES,
  validateEmail,
  setInvalid,
  setValid,
  getInputValue,
  clearAllFormErrors,
} from './validation.js';

const FORM_SELECTOR = '.journal__top-form';
const { required, email: emailMsg, nameMinLength } = MESSAGES;

function validateForm(form) {
  const nameInput = form.querySelector('#journal-name');
  const emailInput = form.querySelector('#journal-email');

  let firstInvalid = null;
  const name = getInputValue(nameInput);
  const email = getInputValue(emailInput);

  if (!name) {
    setInvalid(nameInput, required, 'journal-name-error');
    if (!firstInvalid) firstInvalid = nameInput;
  } else if (name.length < 2) {
    setInvalid(nameInput, nameMinLength, 'journal-name-error');
    if (!firstInvalid) firstInvalid = nameInput;
  } else {
    setValid(nameInput, 'journal-name-error');
  }

  if (!email) {
    setInvalid(emailInput, required, 'journal-email-error');
    if (!firstInvalid) firstInvalid = emailInput;
  } else if (!validateEmail(email)) {
    setInvalid(emailInput, emailMsg, 'journal-email-error');
    if (!firstInvalid) firstInvalid = emailInput;
  } else {
    setValid(emailInput, 'journal-email-error');
  }

  return firstInvalid;
}

export function initJournalForm() {
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
    console.log('Journal subscribe form data:', data);
    form.reset();
    clearAllFormErrors(form);
  });

  const clearOnChange = ({ target }) => {
    if (target.matches('input')) setValid(target, target.id ? `${target.id}-error` : null);
  };
  form.addEventListener('input', clearOnChange);
  form.addEventListener('change', clearOnChange);
}
