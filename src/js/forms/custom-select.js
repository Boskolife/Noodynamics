/**
 * Custom select controls that sync with hidden native <select> elements in forms.
 * Uses a single document-level click listener to close any open dropdown (avoids N listeners for N selects).
 */

const SELECTOR = '.select[data-select-native-id]';
const SELECTORS = {
  trigger: '.select__trigger',
  dropdown: '.select__dropdown',
  value: '.select__value',
  option: '.select__option',
};

function initSelect(container) {
  const nativeId = container.getAttribute('data-select-native-id');
  if (!nativeId) return;

  const nativeSelect = document.getElementById(nativeId);
  const trigger = container.querySelector(SELECTORS.trigger);
  const dropdown = container.querySelector(SELECTORS.dropdown);
  const valueEl = container.querySelector(SELECTORS.value);
  const options = container.querySelectorAll(SELECTORS.option);

  if (!nativeSelect || !trigger || !dropdown || !valueEl || !options.length) return;

  const closeDropdown = () => {
    trigger.setAttribute('aria-expanded', 'false');
    dropdown.hidden = true;
  };

  const openDropdown = () => {
    trigger.setAttribute('aria-expanded', 'true');
    dropdown.hidden = false;
  };

  const setValue = (value, label) => {
    nativeSelect.value = value;
    valueEl.textContent = label;
    options.forEach((opt) => {
      opt.setAttribute('aria-selected', opt.getAttribute('data-value') === value);
    });
    nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    container.classList.remove('is-invalid');
  };

  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropdown.hidden ? openDropdown() : closeDropdown();
  });

  options.forEach((option) => {
    option.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const value = option.getAttribute('data-value') ?? '';
      const label = option.textContent.trim();
      if (!value) return;
      setValue(value, label);
      closeDropdown();
    });
  });
}

function handleDocumentClick(e) {
  document.querySelectorAll(SELECTOR).forEach((container) => {
    const dropdown = container.querySelector(SELECTORS.dropdown);
    const trigger = container.querySelector(SELECTORS.trigger);
    if (!dropdown?.hidden && !container.contains(e.target)) {
      dropdown.hidden = true;
      trigger?.setAttribute('aria-expanded', 'false');
    }
  });
}

export function initFormSelects() {
  if (typeof document === 'undefined') return;

  const containers = document.querySelectorAll(SELECTOR);
  containers.forEach(initSelect);

  document.removeEventListener('click', handleDocumentClick);
  document.addEventListener('click', handleDocumentClick);
}
