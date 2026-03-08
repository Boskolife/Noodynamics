/**
 * Make donation form: custom validation and submit handler.
 * Validates required fields (type, amount, amountDue, billing fields, agree).
 * Shows per-field errors, sets aria-invalid, focuses first invalid.
 * Logs form data to console on valid submit.
 */

const FORM_SELECTOR = '.make-donation__form';
const ERROR_CLASS = 'is-invalid';

const messages = {
  required: 'This field is required.',
  email: 'Please enter a valid email address.',
  nameMinLength: 'Must be at least 2 characters.',
  amountInvalid: 'Please enter a valid amount.',
  agree: 'You must agree to create an account to continue.',
};

function getErrorElement(id) {
  const el = document.getElementById(id);
  return el || null;
}

function setError(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message;
}

function clearError(id) {
  const el = document.getElementById(id);
  if (el) el.textContent = '';
}

function setInvalid(input, message, errorId) {
  if (input) {
    input.classList.add(ERROR_CLASS);
    input.setAttribute('aria-invalid', 'true');
  }
  if (errorId) setError(errorId, message);
}

function setValid(input, errorId) {
  if (input) {
    input.classList.remove(ERROR_CLASS);
    input.removeAttribute('aria-invalid');
  }
  if (errorId) clearError(errorId);
}

function setRadioGroupInvalid(form, name, errorId, message) {
  const group = form.querySelectorAll(`input[name="${name}"]`);
  group.forEach((r) => {
    r.classList.add(ERROR_CLASS);
    r.setAttribute('aria-invalid', 'true');
  });
  setError(errorId, message);
}

function setRadioGroupValid(form, name, errorId) {
  const group = form.querySelectorAll(`input[name="${name}"]`);
  group.forEach((r) => {
    r.classList.remove(ERROR_CLASS);
    r.removeAttribute('aria-invalid');
  });
  clearError(errorId);
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '');
}

function validateForm(form) {
  let firstInvalid = null;

  const typeChecked = form.querySelector('input[name="type"]:checked');
  if (!typeChecked) {
    setRadioGroupInvalid(form, 'type', 'donation-type-error', messages.required);
    if (!firstInvalid) firstInvalid = form.querySelector('input[name="type"]');
  } else {
    setRadioGroupValid(form, 'type', 'donation-type-error');
  }

  const amountChecked = form.querySelector('input[name="donationAmount"]:checked');
  if (!amountChecked) {
    setRadioGroupInvalid(form, 'donationAmount', 'donation-amount-error', messages.required);
    if (!firstInvalid) firstInvalid = form.querySelector('input[name="donationAmount"]');
  } else {
    setRadioGroupValid(form, 'donationAmount', 'donation-amount-error');
  }

  const amountDueInput = form.querySelector('#donation-amount-due');
  const isOtherAmount = amountChecked?.value === 'other';

  if (isOtherAmount) {
    const amountDue = (amountDueInput?.value || '').trim();
    if (!amountDue) {
      setInvalid(amountDueInput, messages.required, 'donation-amount-due-error');
      if (!firstInvalid) firstInvalid = amountDueInput;
    } else {
      const num = parseFloat(amountDue.replace(/,/g, '.'));
      if (Number.isNaN(num) || num <= 0) {
        setInvalid(amountDueInput, messages.amountInvalid, 'donation-amount-due-error');
        if (!firstInvalid) firstInvalid = amountDueInput;
      } else {
        setValid(amountDueInput, 'donation-amount-due-error');
      }
    }
  } else {
    setValid(amountDueInput, 'donation-amount-due-error');
  }

  const firstNameInput = form.querySelector('#donation-first-name');
  const firstName = (firstNameInput?.value || '').trim();
  if (!firstName) {
    setInvalid(firstNameInput, messages.required, 'donation-first-name-error');
    if (!firstInvalid) firstInvalid = firstNameInput;
  } else if (firstName.length < 2) {
    setInvalid(firstNameInput, messages.nameMinLength, 'donation-first-name-error');
    if (!firstInvalid) firstInvalid = firstNameInput;
  } else {
    setValid(firstNameInput, 'donation-first-name-error');
  }

  const lastNameInput = form.querySelector('#donation-last-name');
  const lastName = (lastNameInput?.value || '').trim();
  if (!lastName) {
    setInvalid(lastNameInput, messages.required, 'donation-last-name-error');
    if (!firstInvalid) firstInvalid = lastNameInput;
  } else if (lastName.length < 2) {
    setInvalid(lastNameInput, messages.nameMinLength, 'donation-last-name-error');
    if (!firstInvalid) firstInvalid = lastNameInput;
  } else {
    setValid(lastNameInput, 'donation-last-name-error');
  }

  const emailInput = form.querySelector('#donation-email');
  const email = (emailInput?.value || '').trim();
  if (!email) {
    setInvalid(emailInput, messages.required, 'donation-email-error');
    if (!firstInvalid) firstInvalid = emailInput;
  } else if (!validateEmail(email)) {
    setInvalid(emailInput, messages.email, 'donation-email-error');
    if (!firstInvalid) firstInvalid = emailInput;
  } else {
    setValid(emailInput, 'donation-email-error');
  }

  const countrySelect = form.querySelector('#donation-country');
  const countryWrapper = form.querySelector('[data-select-native-id="donation-country"]');
  const country = (countrySelect?.value || '').trim();
  if (!country) {
    if (countrySelect) {
      countrySelect.classList.add(ERROR_CLASS);
      countrySelect.setAttribute('aria-invalid', 'true');
    }
    if (countryWrapper) countryWrapper.classList.add(ERROR_CLASS);
    setError('donation-country-error', messages.required);
    if (!firstInvalid) firstInvalid = countryWrapper?.querySelector('.select__trigger') || countrySelect;
  } else {
    if (countrySelect) setValid(countrySelect, null);
    if (countryWrapper) countryWrapper.classList.remove(ERROR_CLASS);
    clearError('donation-country-error');
  }

  const cityInput = form.querySelector('#donation-city');
  const city = (cityInput?.value || '').trim();
  if (!city) {
    setInvalid(cityInput, messages.required, 'donation-city-error');
    if (!firstInvalid) firstInvalid = cityInput;
  } else {
    setValid(cityInput, 'donation-city-error');
  }

  const addressInput = form.querySelector('#donation-address');
  const address = (addressInput?.value || '').trim();
  if (!address) {
    setInvalid(addressInput, messages.required, 'donation-address-error');
    if (!firstInvalid) firstInvalid = addressInput;
  } else {
    setValid(addressInput, 'donation-address-error');
  }

  const postcodeInput = form.querySelector('#donation-postcode');
  const postcode = (postcodeInput?.value || '').trim();
  if (!postcode) {
    setInvalid(postcodeInput, messages.required, 'donation-postcode-error');
    if (!firstInvalid) firstInvalid = postcodeInput;
  } else {
    setValid(postcodeInput, 'donation-postcode-error');
  }

  const agreeInput = form.querySelector('#donation-agree');
  if (!agreeInput?.checked) {
    setInvalid(agreeInput, messages.agree, 'donation-agree-error');
    if (!firstInvalid) firstInvalid = agreeInput;
  } else {
    setValid(agreeInput, 'donation-agree-error');
  }

  return firstInvalid;
}

function clearFieldError(form, target) {
  const name = target.getAttribute('name');
  const id = target.id;

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
    const wrapper = form.querySelector('[data-select-native-id="donation-country"]');
    if (wrapper) wrapper.classList.remove(ERROR_CLASS);
    clearError('donation-country-error');
    return;
  }

  const errorId = id ? `${id}-error` : null;
  setValid(target, errorId);
}

function updateAmountDueState(form) {
  const amountDueInput = form.querySelector('#donation-amount-due');
  const otherRadio = form.querySelector('input[name="donationAmount"][value="other"]');
  const isOther = otherRadio?.checked ?? false;

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

  form.addEventListener('change', (event) => {
    if (event.target.matches('input[name="donationAmount"]')) {
      updateAmountDueState(form);
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const firstInvalid = validateForm(form);
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    console.log('Make donation form data:', data);

    form.reset();
    updateAmountDueState(form);
    form.querySelectorAll('[id$="-error"]').forEach((el) => {
      el.textContent = '';
    });
    form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove(ERROR_CLASS));
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  });

  form.addEventListener('input', (event) => {
    const target = event.target;
    if (target.matches('input, select, textarea')) {
      clearFieldError(form, target);
    }
  });

  form.addEventListener('change', (event) => {
    const target = event.target;
    if (target.matches('input, select, textarea')) {
      clearFieldError(form, target);
    }
  });
}
