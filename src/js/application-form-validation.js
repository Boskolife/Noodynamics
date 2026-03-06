/**
 * Client-side validation for the application for membership form.
 * Shows per-field errors, sets aria-invalid and focuses first invalid field.
 */

const FORM_SELECTOR = '.application-membership__form';
const ERROR_CLASS = 'is-invalid';
const ERROR_MESSAGE_CLASS = 'application-membership__form-error';

const messages = {
  required: 'This field is required.',
  email: 'Please enter a valid email address.',
  agree: 'You must agree to the membership terms to continue.',
};

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

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '');
}

function validateForm(form) {
  let firstInvalid = null;
  const requiredInputs = form.querySelectorAll(
    '[required], [aria-required="true"]',
  );

  requiredInputs.forEach((input) => {
    if (input.disabled) return;

    const tagName = input.tagName.toLowerCase();
    const type = (input.getAttribute('type') || '').toLowerCase();
    const name = input.getAttribute('name');

    if (tagName === 'select') {
      const value = input.value?.trim();
      if (!value) {
        setInvalid(input, messages.required);
        if (!firstInvalid) firstInvalid = input;
      } else {
        setValid(input);
      }
      return;
    }

    if (type === 'checkbox') {
      if (!input.checked) {
        setInvalid(input, messages.agree);
        if (!firstInvalid) firstInvalid = input;
      } else {
        setValid(input);
      }
      return;
    }

    if (type === 'radio') {
      const group = form.querySelectorAll(`input[name="${name}"]`);
      const checked = form.querySelector(`input[name="${name}"]:checked`);
      if (!checked) {
        group.forEach((r) => {
          setInvalid(r, messages.required);
          if (!firstInvalid) firstInvalid = r;
        });
      } else {
        group.forEach(setValid);
      }
      return;
    }

    const value = (input.value || '').trim();
    if (!value) {
      setInvalid(input, messages.required);
      if (!firstInvalid) firstInvalid = input;
      return;
    }

    if (type === 'email' && !validateEmail(value)) {
      setInvalid(input, messages.email);
      if (!firstInvalid) firstInvalid = input;
      return;
    }

    setValid(input);
  });

  // Custom select (marital status): validate hidden native select and show error on wrapper
  const maritalSelect = form.querySelector('#marital-status');
  if (maritalSelect && (maritalSelect.hasAttribute('required') || maritalSelect.getAttribute('aria-required') === 'true')) {
    const value = (maritalSelect.value || '').trim();
    if (!value) {
      setInvalid(maritalSelect, messages.required);
      const wrapper = form.querySelector('[data-select-native-id="marital-status"]');
      if (wrapper) wrapper.classList.add(ERROR_CLASS);
      const trigger = wrapper?.querySelector('.select__trigger');
      if (trigger && !firstInvalid) firstInvalid = trigger;
    } else {
      setValid(maritalSelect);
      const wrapper = form.querySelector('[data-select-native-id="marital-status"]');
      if (wrapper) wrapper.classList.remove(ERROR_CLASS);
    }
  }

  return firstInvalid;
}

function clearFieldError(input) {
  const tagName = input.tagName.toLowerCase();
  const type = (input.getAttribute('type') || '').toLowerCase();
  const name = input.getAttribute('name');

  if (type === 'radio') {
    const form = input.closest('form');
    const group = form?.querySelectorAll(`input[name="${name}"]`);
    group?.forEach(setValid);
  } else {
    setValid(input);
  }
}

function initChildrenAgesToggle(form) {
  const childrenRadios = form.querySelectorAll('input[name="children"]');
  const childrenAgesInput = form.querySelector('#children-ages');
  if (!childrenAgesInput || !childrenRadios.length) return;

  function updateChildrenAgesState() {
    const selected = form.querySelector('input[name="children"]:checked');
    const isYes = selected && selected.value === 'yes';

    if (isYes) {
      childrenAgesInput.disabled = false;
      childrenAgesInput.setAttribute('required', '');
      childrenAgesInput.setAttribute('aria-required', 'true');
    } else {
      childrenAgesInput.disabled = true;
      childrenAgesInput.removeAttribute('required');
      childrenAgesInput.removeAttribute('aria-required');
      childrenAgesInput.value = '';
      setValid(childrenAgesInput);
    }
  }

  updateChildrenAgesState();
  childrenRadios.forEach((radio) => {
    radio.addEventListener('change', updateChildrenAgesState);
  });
}

export function initApplicationFormValidation() {
  if (typeof document === 'undefined') return;

  const form = document.querySelector(FORM_SELECTOR);
  if (!form) return;

  initChildrenAgesToggle(form);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const firstInvalid = validateForm(form);
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    console.log('Application form data:', data);

    const section = form.closest('.application-membership');
    const step2 = section?.querySelector('[data-step="2"]');
    const counterCurrent = section?.querySelector('.application-membership__steps-counter-current');
    const stepLabels = section?.querySelectorAll('.application-membership__step');

    if (step2) {
      form.hidden = true;
      step2.hidden = false;
    }
    if (counterCurrent) {
      counterCurrent.textContent = '2';
    }
    if (stepLabels && stepLabels.length >= 2) {
      stepLabels[0]?.classList.remove('application-membership__step--active');
      stepLabels[1]?.classList.add('application-membership__step--active');
    }
  });

  form.addEventListener('input', (event) => {
    const target = event.target;
    if (target.matches('input, select, textarea')) {
      clearFieldError(target);
    }
  });

  form.addEventListener('change', (event) => {
    const target = event.target;
    if (target.matches('input, select, textarea')) {
      clearFieldError(target);
    }
  });
}
