/**
 * App entry: init sliders, forms, UI, events. Desktop-only.
 */

import 'swiper/css';
import 'swiper/css/scrollbar';

import { isDesktopDevice } from './utils/device.js';
import {
  showDesktopOnlyMessage,
  initAuthPopup,
  initPopupFlows,
  initProfilePopups,
  initHeaderNavActive,
  initTabs,
} from './ui/index.js';
import { initMainSlider } from './slider/main-slider.js';
import {
  initFormSelects,
  initApplicationFormValidation,
  initFooterForm,
  initJournalForm,
  initMakeDonationForm,
} from './forms/index.js';
import { initAmountDueNumericMask } from './forms/validation.js';
import { initEventsFilter } from './events/index.js';
import WOW from 'wow.js/src/WOW.js';

new WOW().init();

const FOOTER_YEAR_SELECTOR = '.footer__bottom-year';

function initFooterYear() {
  const yearEl = document.querySelector(FOOTER_YEAR_SELECTOR);
  if (!yearEl) return;
  const year = String(new Date().getFullYear());
  yearEl.textContent = year;
  yearEl.setAttribute('datetime', year);
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
  initFooterForm();
  initJournalForm();
  initMakeDonationForm();
  initAmountDueNumericMask();
  initAuthPopup();
  initPopupFlows();
  initProfilePopups();
  initHeaderNavActive();
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const { readyState } = document;
  if (readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}
