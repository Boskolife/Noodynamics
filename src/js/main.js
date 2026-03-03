// Swiper global styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';


import { isDesktopDevice } from './utils/device.js';
import { showDesktopOnlyMessage } from './ui/desktop-only-message.js';
import { initMainSlider } from './slider/main-slider.js';

function initApp() {
  if (!isDesktopDevice()) {
    showDesktopOnlyMessage();
    return;
  }

  initMainSlider();
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const { readyState } = document;

  if (readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}