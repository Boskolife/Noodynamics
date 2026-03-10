import Swiper from 'swiper';
import { Pagination, Mousewheel, EffectCreative } from 'swiper/modules';

export function initMainSlider() {
  const container = document.querySelector('.main-slider__swiper');
  if (!container) return;

  const counterCurrent = document.querySelector(
    '.main-slider__counter-current',
  );
  const counterTotal = document.querySelector('.main-slider__counter-total');

  const swiper = new Swiper(container, {
    modules: [Pagination, Mousewheel, EffectCreative],
    slidesPerView: 1,
    direction: 'vertical',
    // Base animation duration between slides: 1 second.
    speed: 500,
    mousewheel: {
      // Enable programmatically only when slider is in focus area.
      enabled: false,
      forceToAxis: true,
      releaseOnEdges: true,
      thresholdDelta: 10,
      thresholdTime: 0,
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    effect: 'creative',
    creativeEffect: {
      prev: {
        translate: [0, 0, -100],
        opacity: 0,
      },
      next: {
        translate: [0, 0, 100],
        opacity: 0,
      },
    },
  });

  if (counterCurrent && counterTotal) {
    const { length: total } = swiper.slides;
    counterTotal.textContent = String(total);
    counterCurrent.textContent = String(swiper.realIndex + 1);

    swiper.on('slideChange', ({ realIndex }) => {
      counterCurrent.textContent = String(realIndex + 1);
    });
  }

  const mainSliderSection = document.getElementById('main-slider');
  if (!mainSliderSection || typeof window === 'undefined') return;
  if (!swiper.mousewheel) return;

  let isSnappingToTop = false;
  let canSnapToTop = true;

  // Enable Swiper's own mousewheel handling only when the slider
  // is prominently in view (its center is in the middle band of the viewport).
  const updateMousewheelState = () => {
    const rect = mainSliderSection.getBoundingClientRect();
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight || 0;

    const partiallyVisible = rect.top < viewportHeight && rect.bottom > 0;
    const center = rect.top + rect.height / 2;
    const centered =
      center >= viewportHeight * 0.25 && center <= viewportHeight * 0.75;

    if (partiallyVisible && centered && !isSnappingToTop) {
      swiper.mousewheel.enable();
    } else {
      swiper.mousewheel.disable();
    }

    // When section leaves the viewport, allow snap behavior next time user reaches it.
    if (!partiallyVisible) {
      canSnapToTop = true;
    }
  };

  window.addEventListener('scroll', updateMousewheelState, { passive: true });
  window.addEventListener('resize', updateMousewheelState);
  updateMousewheelState();

  // When user starts scrolling with mouse wheel / touchpad while the section is visible
  // but not yet aligned with the top of the viewport, scroll the page to align it
  // (anchor-like behavior), then let Swiper's mousewheel take over.
  mainSliderSection.addEventListener(
    'wheel',
    (event) => {
      if (isSnappingToTop || !canSnapToTop) return;

      const rect = mainSliderSection.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight || 0;

      const partiallyVisible = rect.top < viewportHeight && rect.bottom > 0;
      const topAligned = Math.abs(rect.top) <= 1;
      if (!partiallyVisible || topAligned) return;

      event.preventDefault();
      isSnappingToTop = true;
      canSnapToTop = false;
      const targetTop = window.scrollY + rect.top;
      window.scrollTo({ top: targetTop, behavior: 'smooth' });

      window.setTimeout(() => {
        isSnappingToTop = false;
        updateMousewheelState();
      }, 500);
    },
    { passive: false },
  );
}
