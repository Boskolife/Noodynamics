/**
 * Make donation form: validation and submit handler.
 * Amount due is required only when "Other" is selected.
 */

import {
  ERROR_CLASS,
  MESSAGES,
  validateEmail,
  setInvalid,
  setValid,
  setErrorById,
  clearErrorById,
  getInputValue,
  clearAllFormErrors,
} from './validation.js';

const FORM_SELECTOR = '.make-donation__form';
const THANKS_POPUP_ID = 'thanks-support-popup-backdrop';

function openThanksSupportPopup() {
  const backdrop = document.getElementById(THANKS_POPUP_ID);
  if (!backdrop) return;
  backdrop.classList.add('is-open');
  backdrop.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  const focusTarget = backdrop.querySelector('button:not(.popup__close), [href], input');
  focusTarget?.focus();
}

const {
  required,
  email: emailMsg,
  nameMinLength,
  amountInvalid,
  agreeCreateAccount,
} = MESSAGES;

function setRadioGroupInvalid(form, name, errorId, message) {
  form.querySelectorAll(`input[name="${name}"]`).forEach((r) => {
    r.classList.add(ERROR_CLASS);
    r.setAttribute('aria-invalid', 'true');
  });
  setErrorById(errorId, message);
}

function setRadioGroupValid(form, name, errorId) {
  form.querySelectorAll(`input[name="${name}"]`).forEach((r) => {
    r.classList.remove(ERROR_CLASS);
    r.removeAttribute('aria-invalid');
  });
  clearErrorById(errorId);
}

function validateForm(form) {
  let firstInvalid = null;

  const typeChecked = form.querySelector('input[name="type"]:checked');
  if (!typeChecked) {
    setRadioGroupInvalid(form, 'type', 'donation-type-error', required);
    if (!firstInvalid) firstInvalid = form.querySelector('input[name="type"]');
  } else {
    setRadioGroupValid(form, 'type', 'donation-type-error');
  }

  const amountChecked = form.querySelector('input[name="donationAmount"]:checked');
  if (!amountChecked) {
    setRadioGroupInvalid(form, 'donationAmount', 'donation-amount-error', required);
    if (!firstInvalid) firstInvalid = form.querySelector('input[name="donationAmount"]');
  } else {
    setRadioGroupValid(form, 'donationAmount', 'donation-amount-error');
  }

  const amountDueInput = form.querySelector('#donation-amount-due');
  const isOtherAmount = amountChecked?.value === 'other';

  if (isOtherAmount) {
    const amountDue = getInputValue(amountDueInput);
    if (!amountDue) {
      setInvalid(amountDueInput, required, 'donation-amount-due-error');
      if (!firstInvalid) firstInvalid = amountDueInput;
    } else {
      const num = parseFloat(amountDue.replace(/,/g, '.'));
      if (Number.isNaN(num) || num <= 0) {
        setInvalid(amountDueInput, amountInvalid, 'donation-amount-due-error');
        if (!firstInvalid) firstInvalid = amountDueInput;
      } else {
        setValid(amountDueInput, 'donation-amount-due-error');
      }
    }
  } else {
    setValid(amountDueInput, 'donation-amount-due-error');
  }

  const textFields = [
    { id: 'donation-first-name', errorId: 'donation-first-name-error', minLength: 2 },
    { id: 'donation-last-name', errorId: 'donation-last-name-error', minLength: 2 },
    { id: 'donation-email', errorId: 'donation-email-error', email: true },
    { id: 'donation-city', errorId: 'donation-city-error' },
    { id: 'donation-address', errorId: 'donation-address-error' },
    { id: 'donation-postcode', errorId: 'donation-postcode-error' },
  ];

  for (const { id, errorId, minLength, email } of textFields) {
    const input = form.querySelector(`#${id}`);
    const value = getInputValue(input);
    if (!value) {
      setInvalid(input, required, errorId);
      if (!firstInvalid) firstInvalid = input;
    } else if (minLength && value.length < minLength) {
      setInvalid(input, nameMinLength, errorId);
      if (!firstInvalid) firstInvalid = input;
    } else if (email && !validateEmail(value)) {
      setInvalid(input, emailMsg, errorId);
      if (!firstInvalid) firstInvalid = input;
    } else {
      setValid(input, errorId);
    }
  }

  const countrySelect = form.querySelector('#donation-country');
  const countryWrapper = form.querySelector('[data-select-native-id="donation-country"]');
  const country = getInputValue(countrySelect);
  if (!country) {
    if (countrySelect) {
      countrySelect.classList.add(ERROR_CLASS);
      countrySelect.setAttribute('aria-invalid', 'true');
    }
    if (countryWrapper) countryWrapper.classList.add(ERROR_CLASS);
    setErrorById('donation-country-error', required);
    if (!firstInvalid) firstInvalid = countryWrapper?.querySelector('.select__trigger') ?? countrySelect;
  } else {
    if (countrySelect) setValid(countrySelect, null);
    if (countryWrapper) countryWrapper.classList.remove(ERROR_CLASS);
    clearErrorById('donation-country-error');
  }

  const agreeInput = form.querySelector('#donation-agree');
  if (!agreeInput?.checked) {
    setInvalid(agreeInput, agreeCreateAccount, 'donation-agree-error');
    if (!firstInvalid) firstInvalid = agreeInput;
  } else {
    setValid(agreeInput, 'donation-agree-error');
  }

  return firstInvalid;
}

function clearFieldError(form, target) {
  const { name, id } = target;

  if (name === 'type') {
    setRadioGroupValid(form, 'type', 'donation-type-error');
    return;
  }
  if (name === 'donationAmount') {
    setRadioGroupValid(form, 'donationAmount', 'donation-amount-error');
    return;
  }
  if (id === 'donation-country') {
    target.classList.remove(ERROR_CLASS);
    target.removeAttribute('aria-invalid');
    form.querySelector('[data-select-native-id="donation-country"]')?.classList.remove(ERROR_CLASS);
    clearErrorById('donation-country-error');
    return;
  }
  setValid(target, id ? `${id}-error` : null);
}

function updateAmountDueState(form) {
  const amountDueInput = form.querySelector('#donation-amount-due');
  const isOther = form.querySelector('input[name="donationAmount"][value="other"]')?.checked ?? false;

  if (isOther) {
    amountDueInput.removeAttribute('disabled');
    amountDueInput.setAttribute('required', '');
    amountDueInput.setAttribute('aria-required', 'true');
  } else {
    amountDueInput.setAttribute('disabled', '');
    amountDueInput.removeAttribute('required');
    amountDueInput.removeAttribute('aria-required');
    amountDueInput.value = '';
    setValid(amountDueInput, 'donation-amount-due-error');
  }
}

export function initMakeDonationForm() {
  if (typeof document === 'undefined') return;

  const form = document.querySelector(FORM_SELECTOR);
  if (!form) return;

  updateAmountDueState(form);

  form.addEventListener('change', (e) => {
    if (e.target.matches('input[name="donationAmount"]')) updateAmountDueState(form);
    else if (e.target.matches('input, select, textarea')) clearFieldError(form, e.target);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const firstInvalid = validateForm(form);
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries());
    console.log('Make donation form data:', data);
    form.reset();
    updateAmountDueState(form);
    clearAllFormErrors(form);
    openThanksSupportPopup();
  });

  form.addEventListener('input', (e) => {
    if (e.target.matches('input, select, textarea')) clearFieldError(form, e.target);
  });
}
