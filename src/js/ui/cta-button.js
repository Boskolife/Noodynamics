/**
 * Fixed CTA call button (bottom-right); hides near footer like site audio.
 */

import { initFooterFixedHide } from '../utils/footer-fixed-hide.js';

const CTA_SELECTOR = '.cta-button';
const FOOTER_HIDDEN_CLASS = 'cta-button--footer-hidden';

export function initCtaButton() {
  const root = document.querySelector(CTA_SELECTOR);
  if (!root) return;

  initFooterFixedHide(root, FOOTER_HIDDEN_CLASS);
}
