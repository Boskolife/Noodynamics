/**
 * Application for membership form: validation, numeric inputs, step flow.
 * Shows per-field errors, sets aria-invalid, focuses first invalid.
 */

import { ERROR_CLASS, MESSAGES, validateEmail } from './validation.js';

const FORM_SELECTOR = '.application-membership__form';
const ERROR_MESSAGE_CLASS = 'application-membership__form-error form-card__error';
const { required, email: emailMsg, agreeTerms } = MESSAGES;

function initNumericInputs(form) {
  if (!form) return;
  form.querySelectorAll('input[data-numeric]').forEach((input) => {
    const mode = input.getAttribute('data-numeric') || 'integer';
    input.addEventListener('input', () => {
      let value = input.value;
      if (mode === 'integer') value = value.replace(/\D/g, '');
      else if (mode === 'phone') {
        const hasPlus = value.startsWith('+');
        value = value.replace(/\D/g, '');
        value = hasPlus && value.length > 0 ? '+' + value : hasPlus && !value.length ? '+' : value;
      } else if (mode === 'ages') value = value.replace(/[^\d\s,]/g, '');
      if (value !== input.value) input.value = value;
    });
  });
}

function getErrorElement(input) {
  const id = input.id || input.name;
  if (!id) return null;
  const existing = document.getElementById(`${id}-error`);
  if (existing) return existing;
  const label = input.closest('label') || document.querySelector(`label[for="${id}"]`);
  if (!label) return null;
  const span = document.createElement('span');
  span.id = `${id}-error`;
  span.className = ERROR_MESSAGE_CLASS;
  span.setAttribute('role', 'alert');
  label.appendChild(span);
  return span;
}

function setInvalid(input, message) {
  input.classList.add(ERROR_CLASS);
  input.setAttribute('aria-invalid', 'true');
  const errorEl = getErrorElement(input);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = '';
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
    errorEl.style.display = 'none';
  }
  if (id === 'marital-status') {
    const wrapper = input.closest('form')?.querySelector('[data-select-native-id="marital-status"]');
    if (wrapper) wrapper.classList.remove(ERROR_CLASS);
  }
}

function validateForm(form) {
  let firstInvalid = null;
  const requiredInputs = form.querySelectorAll('[required], [aria-required="true"]');

  requiredInputs.forEach((input) => {
    if (input.disabled) return;

    const tagName = input.tagName.toLowerCase();
    const type = (input.getAttribute('type') || '').toLowerCase();
    const name = input.getAttribute('name');

    if (tagName === 'select') {
      const value = input.value?.trim();
      if (!value) {
        setInvalid(input, required);
        if (!firstInvalid) firstInvalid = input;
      } else setValid(input);
      return;
    }

    if (type === 'checkbox') {
      if (!input.checked) {
        setInvalid(input, agreeTerms);
        if (!firstInvalid) firstInvalid = input;
      } else setValid(input);
      return;
    }

    if (type === 'radio') {
      const group = form.querySelectorAll(`input[name="${name}"]`);
      const checked = form.querySelector(`input[name="${name}"]:checked`);
      if (!checked) {
        group.forEach((r) => {
          setInvalid(r, required);
          if (!firstInvalid) firstInvalid = r;
        });
      } else group.forEach(setValid);
      return;
    }

    const value = (input.value || '').trim();
    if (!value) {
      setInvalid(input, required);
      if (!firstInvalid) firstInvalid = input;
      return;
    }
    if (type === 'email' && !validateEmail(value)) {
      setInvalid(input, emailMsg);
      if (!firstInvalid) firstInvalid = input;
      return;
    }
    setValid(input);
  });

  const maritalSelect = form.querySelector('#marital-status');
  if (maritalSelect && (maritalSelect.hasAttribute('required') || maritalSelect.getAttribute('aria-required') === 'true')) {
    const value = (maritalSelect.value || '').trim();
    if (!value) {
      setInvalid(maritalSelect, required);
      const wrapper = form.querySelector('[data-select-native-id="marital-status"]');
      if (wrapper) wrapper.classList.add(ERROR_CLASS);
      const trigger = wrapper?.querySelector('.select__trigger');
      if (trigger && !firstInvalid) firstInvalid = trigger;
    } else {
      setValid(maritalSelect);
      form.querySelector('[data-select-native-id="marital-status"]')?.classList.remove(ERROR_CLASS);
    }
  }

  return firstInvalid;
}

function clearFieldError(input) {
  const type = (input.getAttribute('type') || '').toLowerCase();
  const name = input.getAttribute('name');

  if (type === 'radio') {
    const form = input.closest('form');
    form?.querySelectorAll(`input[name="${name}"]`)?.forEach(setValid);
  } else setValid(input);
}

function initChildrenAgesToggle(form) {
  const childrenRadios = form.querySelectorAll('input[name="children"]');
  const childrenAgesInput = form.querySelector('#children-ages');
  if (!childrenAgesInput || !childrenRadios.length) return;

  const updateChildrenAgesState = () => {
    const selected = form.querySelector('input[name="children"]:checked');
    const isYes = selected?.value === 'yes';
    childrenAgesInput.disabled = !isYes;
    if (isYes) {
      childrenAgesInput.setAttribute('required', '');
      childrenAgesInput.setAttribute('aria-required', 'true');
    } else {
      childrenAgesInput.removeAttribute('required');
      childrenAgesInput.removeAttribute('aria-required');
      childrenAgesInput.value = '';
      setValid(childrenAgesInput);
    }
  };

  updateChildrenAgesState();
  childrenRadios.forEach((radio) => radio.addEventListener('change', updateChildrenAgesState));
}

function initMembershipLevelSelection(section) {
  const levelContainer = section?.querySelector('.application-membership__form-level');
  if (!levelContainer) return;

  const levelItems = Array.from(levelContainer.querySelectorAll('.application-membership__form-level-item[data-level]'));
  const levelButtons = levelContainer.querySelectorAll('.application-membership__form-level-item-button');
  const continueBtn = levelContainer.querySelector('.application-membership__form-level-btn');
  if (!levelItems.length || !levelButtons.length || !continueBtn) return;

  let selectedLevel = '';
  continueBtn.disabled = true;

  const selectLevel = (item) => {
    const value = item.getAttribute('data-level');
    if (!value) return;
    selectedLevel = value;
    levelItems.forEach((it) => it.classList.toggle('application-membership__form-level-item--selected', it === item));
    continueBtn.disabled = false;
  };

  levelButtons.forEach((button) => {
    const item = button.closest('.application-membership__form-level-item');
    if (item) button.addEventListener('click', (e) => { e.preventDefault(); selectLevel(item); });
  });

  continueBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!selectedLevel) {
      console.log('Please select a membership level before continuing.');
      continueBtn.focus();
      return;
    }
    console.log('Selected membership level:', selectedLevel);
  });
}

export function initApplicationFormValidation() {
  if (typeof document === 'undefined') return;

  const form = document.querySelector(FORM_SELECTOR);
  if (!form) return;

  const section = form.closest('.application-membership');
  initChildrenAgesToggle(form);
  initNumericInputs(form);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const firstInvalid = validateForm(form);
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries());
    console.log('Application form data:', data);

    const step2 = section?.querySelector('[data-step="2"]');
    const counterCurrent = section?.querySelector('.application-membership__steps-counter-current');
    const stepLabels = section?.querySelectorAll('.application-membership__step');

    if (step2) { form.hidden = true; step2.hidden = false; }
    if (counterCurrent) counterCurrent.textContent = '2';
    if (stepLabels?.length >= 2) {
      stepLabels[0]?.classList.remove('application-membership__step--active');
      stepLabels[1]?.classList.add('application-membership__step--active');
    }
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  if (section) initMembershipLevelSelection(section);

  const clearOnChange = ({ target }) => {
    if (target.matches('input, select, textarea')) clearFieldError(target);
  };
  form.addEventListener('input', clearOnChange);
  form.addEventListener('change', clearOnChange);
}
