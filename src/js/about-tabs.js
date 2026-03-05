/**
 * About page tab switching with smooth transitions
 */
export function initAboutTabs() {
  const buttons = document.querySelectorAll('.about__button[data-tab]');
  const panels = document.querySelectorAll('.about__tab-panel');

  if (!buttons.length || !panels.length) return;

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-tab');
      if (!targetId) return;

      const targetPanel = document.getElementById(targetId);
      if (!targetPanel) return;

      const activeButton = document.querySelector('.about__button.active');
      const activePanel = document.querySelector('.about__tab-panel.active');

      if (activeButton === button && activePanel === targetPanel) return;

      // Fade out current panel
      if (activePanel) {
        activePanel.classList.remove('active');
      }

      // Update button states
      buttons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');

      // Fade in target panel
      targetPanel.classList.add('active');
    });
  });
}
