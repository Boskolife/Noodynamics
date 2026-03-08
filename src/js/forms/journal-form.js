/**
 * Journal subscribe form: validation and submit handler.
 * Logs form data to console on valid submit.
 */

import { validateFormWithRules, clearAllFormErrors, clearFieldErrorByTarget } from './validation.js';

const FORM_SELECTOR = '.journal__top-form';

const JOURNAL_RULES = [
  { id: 'journal-name', required: true, minLength: 2 },
  { id: 'journal-email', required: true, email: true },
];

export function initJournalForm() {
  if (typeof document === 'undefined') return;

  const form = document.querySelector(FORM_SELECTOR);
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const firstInvalid = validateFormWithRules(form, JOURNAL_RULES);
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
    if (target.matches('input')) clearFieldErrorByTarget(form, target);
  };
  form.addEventListener('input', clearOnChange);
  form.addEventListener('change', clearOnChange);
}
