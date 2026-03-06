// Swiper global styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';


import { isDesktopDevice } from './utils/device.js';
import { showDesktopOnlyMessage } from './ui/desktop-only-message.js';
import { initMainSlider } from './slider/main-slider.js';
import { initTabs } from './tabs.js';
import { initEventsFilter } from './events-filter.js';
import { initFormSelects } from './custom-select-form.js';
import { initApplicationFormValidation } from './application-form-validation.js';

function initFooterYear() {
  const yearEl = document.querySelector('.footer__bottom-year');
  if (yearEl) {
    const year = String(new Date().getFullYear());
    yearEl.textContent = year;
    yearEl.setAttribute('datetime', year);
  }
}

function initApp() {
  if (!isDesktopDevice()) {
    showDesktopOnlyMessage();
    return;
  }

  initMainSlider();
  initFooterYear();
  initTabs();
  initEventsFilter();
  initFormSelects();
  initApplicationFormValidation();
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const { readyState } = document;

  if (readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}