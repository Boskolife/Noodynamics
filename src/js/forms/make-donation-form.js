/**
 * Make donation form: validation and submit handler.
 * Amount due is required only when "Other" is selected.
 */

import {
  ERROR_CLASS,
  MESSAGES,
  validateFormWithRules,
  setRadioGroupValid,
  setValid,
  clearErrorById,
  clearAllFormErrors,
} from './validation.js';
import { openModalById } from '../ui/modal-manager.js';

const FORM_SELECTOR = '.make-donation__form';
const THANKS_POPUP_ID = 'thanks-support-popup-backdrop';

function openThanksSupportPopup() {
  openModalById(THANKS_POPUP_ID);
}

const MAKE_DONATION_RULES = [
  { type: 'radio', name: 'type', errorId: 'donation-type-error' },
  { type: 'radio', name: 'donationAmount', errorId: 'donation-amount-error' },
  {
    id: 'donation-amount-due',
    errorId: 'donation-amount-due-error',
    required: true,
    amount: true,
    when: (form) => form.querySelector('input[name="donationAmount"]:checked')?.value === 'other',
  },
  { id: 'donation-first-name', required: true, minLength: 2 },
  { id: 'donation-last-name', required: true, minLength: 2 },
  { id: 'donation-email', required: true, email: true },
  { id: 'donation-city', required: true },
  { id: 'donation-address', required: true },
  { id: 'donation-postcode', required: true },
  {
    type: 'select',
    id: 'donation-country',
    errorId: 'donation-country-error',
    wrapperSelector: '[data-select-native-id="donation-country"]',
  },
  {
    type: 'checkbox',
    id: 'donation-agree',
    errorId: 'donation-agree-error',
    message: MESSAGES.agreeCreateAccount,
  },
];

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
    const firstInvalid = validateFormWithRules(form, MAKE_DONATION_RULES);
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
