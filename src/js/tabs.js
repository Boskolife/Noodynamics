/**
 * Generic tabs controller that can be reused on any page.
 */
class Tabs {
  constructor(options = {}) {
    const {
      root = document,
      buttonSelector = '.tabs__button[data-tab]',
      panelSelector = '.tab-panel',
      activeClass = 'active',
    } = options;

    this.root = root;
    this.buttonSelector = buttonSelector;
    this.panelSelector = panelSelector;
    this.activeClass = activeClass;

    this.buttons = Array.from(root.querySelectorAll(this.buttonSelector));
    this.panels = Array.from(root.querySelectorAll(this.panelSelector));

    if (!this.buttons.length || !this.panels.length) {
      return;
    }

    this.handleButtonClick = this.handleButtonClick.bind(this);
    this.bindEvents();
  }

  bindEvents() {
    this.buttons.forEach((button) => {
      button.addEventListener('click', this.handleButtonClick);
    });
  }

  handleButtonClick(event) {
    const button = event.currentTarget;
    const targetId = button.getAttribute('data-tab');
    if (!targetId) return;

    const targetPanel = this.root.getElementById
      ? this.root.getElementById(targetId)
      : this.root.querySelector(`#${targetId}`);
    if (!targetPanel) return;

    const activeButton = this.root.querySelector(
      `${this.buttonSelector}.${this.activeClass}`,
    );
    const activePanel = this.root.querySelector(
      `${this.panelSelector}.${this.activeClass}`,
    );

    if (activeButton === button && activePanel === targetPanel) {
      return;
    }

    if (activeButton) {
      activeButton.classList.remove(this.activeClass);
    }

    if (activePanel) {
      activePanel.classList.remove(this.activeClass);
    }

    button.classList.add(this.activeClass);
    targetPanel.classList.add(this.activeClass);
  }
}

/**
 * Initialize tabs on the page.
 */
export function initTabs() {
  if (typeof document === 'undefined') return;

  return new Tabs();
}
