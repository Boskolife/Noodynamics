# JS structure

- **`main.js`** — Entry point. Inits desktop check, sliders, forms, UI, events, footer year.

- **`forms/`** — All form logic
  - `validation.js` — Shared: `ERROR_CLASS`, `MESSAGES`, `validateEmail`, `setInvalid`, `setValid`, `getInputValue`, `clearAllFormErrors`
  - `custom-select.js` — Custom select synced with hidden `<select>`
  - `footer-form.js` — Footer contact form
  - `journal-form.js` — Journal subscribe form
  - `make-donation-form.js` — Donation form (amount, billing, agree)
  - `application-membership.js` — Membership application form (steps, radio, select)
  - `index.js` — Re-exports all form inits

- **`ui/`** — UI components
  - `desktop-only-message.js` — Desktop-only full-page message
  - `auth-popup.js` — Login popup (open/close, Escape)
  - `header-nav.js` — Active nav link by current page
  - `tabs.js` — Tab panels
  - `index.js` — Re-exports

- **`events/`** — Events page
  - `events-filter.js` — Event type selector + calendar filter
  - `index.js` — Re-exports

- **`slider/`** — Sliders
  - `main-slider.js` — Main vertical Swiper slider

- **`utils/`** — Utilities
  - `device.js` — `isDesktopDevice()`
