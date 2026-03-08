/**
 * Footer contact form: validation and submit handler.
 * Logs form data to console on valid submit.
 */

import { validateFormWithRules, clearAllFormErrors, clearFieldErrorByTarget } from './validation.js';

const FORM_SELECTOR = '.footer__col-form';

const FOOTER_RULES = [
  { id: 'footer-email', required: true, email: true },
  { id: 'footer-name', required: true, minLength: 2 },
  { id: 'footer-message', minLength: 10 },
];

export function initFooterForm() {
  if (typeof document === 'undefined') return;

  const form = document.querySelector(FORM_SELECTOR);
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const firstInvalid = validateFormWithRules(form, FOOTER_RULES);
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
    if (target.matches('input, textarea')) clearFieldErrorByTarget(form, target);
  };
  form.addEventListener('input', clearOnChange);
  form.addEventListener('change', clearOnChange);
}
