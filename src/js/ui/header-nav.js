/**
 * Sets active class on the header nav link that matches the current page.
 */

const NAV_LINK_SELECTOR = '.header__nav-link';
const ACTIVE_CLASS = 'header__nav-link--active';

function getCurrentPageKey() {
  const { pathname } = window.location;
  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1];
  return last || 'index.html';
}

export function initHeaderNavActive() {
  const currentPage = getCurrentPageKey();
  const links = document.querySelectorAll(NAV_LINK_SELECTOR);

  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;
    const linkPage = href.split('/').pop() || 'index.html';
    const isActive = linkPage === currentPage;
    link.classList.toggle(ACTIVE_CLASS, isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}
