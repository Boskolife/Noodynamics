/**
 * Forms: re-export all form initializers.
 * - custom-select: native select replacement
 * - footer-form, journal-form, make-donation-form: short forms with validation
 * - application-membership: membership application form
 */

export { initFormSelects } from './custom-select.js';
export { initFooterForm } from './footer-form.js';
export { initJournalForm } from './journal-form.js';
export { initMakeDonationForm } from './make-donation-form.js';
export { initApplicationFormValidation } from './application-membership.js';
