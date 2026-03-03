export function showDesktopOnlyMessage() {
  const { body, head, createElement } = document;

  // Remove all existing content
  while (body.firstChild) {
    body.removeChild(body.firstChild);
  }

  // Inject basic styles for the message
  const styleEl = createElement('style');
  styleEl.textContent = `
    .desktop-only-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      box-sizing: border-box;
      background: #020202;
      color: #FFFFFF;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      text-align: center;
    }

    .desktop-only-message {
      max-width: 520px;
      font-size: 18px;
      line-height: 1.5;
    }

    .desktop-only-message strong {
      display: block;
      margin-bottom: 12px;
      font-size: 20px;
    }
  `;
  head.appendChild(styleEl);

  const wrapper = createElement('div');
  wrapper.className = 'desktop-only-wrapper';

  const message = createElement('div');
  message.className = 'desktop-only-message';
  message.innerHTML =
    '<strong>Desktop access only</strong>' +
    '<span>This website contains important information. Please view it from a desktop or laptop computer.</span>';

  wrapper.appendChild(message);
  body.appendChild(wrapper);
}

