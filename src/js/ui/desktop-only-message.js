export function showDesktopOnlyMessage() {
  const { body, head } = document;

  // Remove all existing content
  while (body.firstChild) {
    body.removeChild(body.firstChild);
  }

  // Inject basic styles for the message
  const styleEl = document.createElement('style');
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
  `;
  head.appendChild(styleEl);

  const wrapper = document.createElement('div');
  wrapper.className = 'desktop-only-wrapper';

  const message = document.createElement('div');
  message.className = 'desktop-only-message';
  message.innerHTML =
    '<span>This website was intentionally designed to not be accessible by phones. If this bothers you, that is probably a strong indication that you will find little or nothing of interest here anyway. <br/> You are advised to go elsewhere. <br/> Please. If it does not bother you, then we look forward to your visit from an appropriate device.</span>';

  wrapper.appendChild(message);
  body.appendChild(wrapper);
}

