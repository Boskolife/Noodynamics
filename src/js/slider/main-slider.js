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
    speed: 2000,
    mousewheel: {
      enabled: false,
      forceToAxis: true,
      releaseOnEdges: true,
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

  // Enable mousewheel only when the top of the slider
  // reaches (or passes) the top edge of the viewport.
  const mainSliderSection = document.querySelector('.main-slider');

  if (mainSliderSection && swiper.mousewheel && typeof window !== 'undefined') {
    const updateMousewheelState = () => {
      const rect = mainSliderSection.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight || 0;

      // Enable only when the section fully covers the viewport:
      // its top is at or above the top edge, and its bottom is
      // at or below the bottom edge of the viewport.
      const center = rect.top + rect.height / 2;
      const shouldEnable =
        center >= viewportHeight * 0.25 && center <= viewportHeight * 0.8;

      if (shouldEnable) {
        swiper.mousewheel.enable();
      } else {
        swiper.mousewheel.disable();
      }
    };

    window.addEventListener('scroll', updateMousewheelState, { passive: true });
    window.addEventListener('resize', updateMousewheelState);

    // Initial check on load
    updateMousewheelState();
  }
}
