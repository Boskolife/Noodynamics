/**
 * Initialize tabs on the page.
 */
export function initTabs(options = {}) {
  if (typeof document === 'undefined') return;

  const {
    root = document,
    buttonSelector = '.tabs__button[data-tab]',
    panelSelector = '.tab-panel',
    activeClass = 'active',
    scrollOnChange = true,
    scrollOffset = 80,
  } = options;

  const container = root.querySelector('.tab-panels') || root.querySelector(panelSelector)?.parentElement || root;
  const buttons = Array.from(root.querySelectorAll(buttonSelector));
  const panels = Array.from(root.querySelectorAll(panelSelector));
  if (!buttons.length || !panels.length) return;

  const handleButtonClick = (e) => {
    const button = e.currentTarget;
    const targetId = button.getAttribute('data-tab');
    if (!targetId) return;

    const targetPanel = root.getElementById ? root.getElementById(targetId) : root.querySelector(`#${targetId}`);
    if (!targetPanel) return;

    const activeButton = root.querySelector(`${buttonSelector}.${activeClass}`);
    const activePanel = root.querySelector(`${panelSelector}.${activeClass}`);
    if (activeButton === button && activePanel === targetPanel) return;

    activeButton?.classList.remove(activeClass);
    activePanel?.classList.remove(activeClass);
    button.classList.add(activeClass);
    targetPanel.classList.add(activeClass);

    if (scrollOnChange && container && typeof window !== 'undefined') {
      const { top } = container.getBoundingClientRect();
      window.scrollTo({ top: window.pageYOffset + top - scrollOffset, behavior: 'smooth' });
    }
  };

  buttons.forEach((btn) => btn.addEventListener('click', handleButtonClick));

  return {
    destroy() {
      buttons.forEach((btn) => btn.removeEventListener('click', handleButtonClick));
    },
  };
}
