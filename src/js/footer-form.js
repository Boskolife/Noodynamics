/**
 * Footer contact form: validation and submit handler.
 * Logs form data to console on valid submit (for debugging).
 */

const FORM_SELECTOR = '.footer__col-form';

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '');
}

function validateForm(form) {
  const emailInput = form.querySelector('#footer-email');
  const nameInput = form.querySelector('#footer-name');
  const messageInput = form.querySelector('#footer-message');

  let isValid = true;

  const email = (emailInput?.value || '').trim();
  const name = (nameInput?.value || '').trim();
  const message = (messageInput?.value || '').trim();

  if (!email) {
    emailInput?.setCustomValidity('Email is required.');
    isValid = false;
  } else if (!validateEmail(email)) {
    emailInput?.setCustomValidity('Please enter a valid email address.');
    isValid = false;
  } else {
    emailInput?.setCustomValidity('');
  }

  if (!name) {
    nameInput?.setCustomValidity('Name is required.');
    isValid = false;
  } else if (name.length < 2) {
    nameInput?.setCustomValidity('Name must be at least 2 characters.');
    isValid = false;
  } else {
    nameInput?.setCustomValidity('');
  }

  if (!message) {
    messageInput?.setCustomValidity('Message is required.');
    isValid = false;
  } else if (message.length < 10) {
    messageInput?.setCustomValidity('Message must be at least 10 characters.');
    isValid = false;
  } else {
    messageInput?.setCustomValidity('');
  }

  return isValid;
}

export function initFooterForm() {
  if (typeof document === 'undefined') return;

  const form = document.querySelector(FORM_SELECTOR);
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!validateForm(form)) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    console.log('Footer contact form data:', data);

    form.reset();
  });
}
