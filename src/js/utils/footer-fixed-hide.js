/**
 * Hide fixed corner UI when the footer overlaps it (scroll/resize).
 */

const FOOTER_SELECTOR = '#footer';
const FOOTER_EDGE_OFFSET = 8;

export function initFooterFixedHide(root, hiddenClass) {
  const footer = document.querySelector(FOOTER_SELECTOR);
  if (!footer || !root || !hiddenClass) return;

  const update = () => {
    const footerTop = footer.getBoundingClientRect().top;
    const elementTop = root.getBoundingClientRect().top;
    const shouldHide = footerTop <= elementTop + FOOTER_EDGE_OFFSET;
    root.classList.toggle(hiddenClass, shouldHide);
  };

  let ticking = false;
  const scheduleUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  };

  update();
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
}
