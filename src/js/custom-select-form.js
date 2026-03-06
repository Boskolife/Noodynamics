/**
 * Custom select controls that synchronize with hidden native <select> elements in forms.
 */
export function initFormSelects() {
  if (typeof document === 'undefined') return;

  const containers = document.querySelectorAll('.select[data-select-native-id]');

  if (!containers.length) return;

  containers.forEach((container) => {
    const nativeId = container.getAttribute('data-select-native-id');
    if (!nativeId) return;

    const nativeSelect = document.getElementById(nativeId);
    const trigger = container.querySelector('.select__trigger');
    const dropdown = container.querySelector('.select__dropdown');
    const valueEl = container.querySelector('.select__value');
    const options = container.querySelectorAll('.select__option');

    if (!nativeSelect || !trigger || !dropdown || !valueEl || !options.length) {
      return;
    }

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

    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (dropdown.hidden) {
        openDropdown();
      } else {
        closeDropdown();
      }
    });

    options.forEach((option) => {
      option.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const value = option.getAttribute('data-value') || '';
        const label = option.textContent.trim();
        if (!value) return;
        setValue(value, label);
        closeDropdown();
      });
    });

    document.addEventListener('click', () => {
      closeDropdown();
    });
  });
}

