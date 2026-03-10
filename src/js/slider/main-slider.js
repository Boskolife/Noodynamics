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

  const mainSliderSection = document.getElementById('main-slider');
  if (!mainSliderSection || typeof window === 'undefined') return;

  let isLocked = false;
  let wheelLockHandler = null;

  const enableWheelLock = () => {
    if (wheelLockHandler) return;
    wheelLockHandler = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      // Block page scroll while slider is locked, but allow events inside slider.
      if (!target.closest('.main-slider')) {
        event.preventDefault();
      }
    };
    window.addEventListener('wheel', wheelLockHandler, { passive: false });
  };

  const disableWheelLock = () => {
    if (!wheelLockHandler) return;
    window.removeEventListener('wheel', wheelLockHandler);
    wheelLockHandler = null;
  };

  const lockSliderScroll = () => {
    if (isLocked) return;
    isLocked = true;
    enableWheelLock();
  };

  const unlockSliderScroll = () => {
    if (!isLocked) return;
    isLocked = false;
    disableWheelLock();
  };

  // Scrolling внутри слайдера: быстрый переход по слайдам.
  // Логику включаем, когда секция заметно в центре вьюпорта (центр секции в центральной «полосе» окна).
  container.addEventListener(
    'wheel',
    (event) => {
      const rect = mainSliderSection.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight || 0;

      const partiallyVisible = rect.top < viewportHeight && rect.bottom > 0;
      const center = rect.top + rect.height / 2;
      const centered =
        center >= viewportHeight * 0.25 && center <= viewportHeight * 0.75;

      if (!partiallyVisible || !centered) {
        // Если секция ушла из центральной зоны, разблокируем скролл.
        if (isLocked) unlockSliderScroll();
        return;
      }

      if (!isLocked) {
        lockSliderScroll();
      }

      const delta = event.deltaY;
      if (delta === 0) return;

      const direction = delta > 0 ? 1 : -1;
      const maxIndex = swiper.slides.length - 1;
      let nextIndex = swiper.activeIndex + direction;

      if (nextIndex < 0) {
        unlockSliderScroll();
        return;
      }
      if (nextIndex > maxIndex) {
        unlockSliderScroll();
        return;
      }

      event.preventDefault();
      swiper.slideTo(nextIndex, 0);
    },
    { passive: false },
  );
}
