# Noodynamics

Multi-page website and e-book reader for Noodynamics. Built with Vite, Handlebars, and SCSS.

## Tech stack

- **Build:** [Vite](https://vitejs.dev/) 4.x
- **Templating:** [Handlebars](https://handlebarsjs.com/) via `vite-plugin-handlebars` (partials: `templates/`, `sections/`, `modals/`)
- **Styles:** [Sass](https://sass-lang.com/) (SCSS), design tokens in `src/styles/base/_variables.scss`
- **Scripts:** Vanilla ES modules; [Swiper](https://swiperjs.com/), [WOW.js](https://wowjs.uk/), [animate.css](https://animate.style/) for UI
- **Code quality:** ESLint, Prettier
- **Images:** WebP conversion script (`scripts/convertToWebp.js`), Handlebars `picture` helper for responsive images

## Requirements

- [Node.js](https://nodejs.org/) v16+

## Setup and run

```bash
npm install
npm run dev
```

Dev server runs with HMR; Handlebars partials trigger full reload.

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start dev server (opens browser) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint on `.js` files |
| `npm run webp` | Convert images to WebP once |
| `npm run webp:watch` | Watch and convert images to WebP |

## Project structure

```
src/
├── index.html          # Main landing
├── about.html          # About
├── books.html          # Books list
├── reader.html         # E-book reader (dedicated app)
├── membership.html     # Membership
├── donation.html       # Donation
├── make-donation.html
├── events.html         # Events
├── single-event.html
├── journal.html        # Journal / blog
├── single-article.html
├── application-membership.html
├── terms.html
├── privacy.html
├── extras.html
├── templates/          # Header, footer, header-ebook
├── sections/          # Page sections (hero, slider, culture-systems, etc.)
├── modals/            # Popups (auth, membership, reader panels, etc.)
├── js/
│   ├── main.js        # App entry (sliders, forms, UI, events)
│   ├── reader/        # E-book reader (state, UI, content, panels)
│   ├── ui/            # Modals, auth, profile, header nav, tabs
│   ├── forms/         # Selects, validation, donation/journal forms
│   ├── events/        # Events filter
│   ├── slider/        # Main slider
│   └── utils/         # Device detection, etc.
└── styles/
    ├── main.scss      # Global imports
    ├── base/          # Variables, reset, typography, mixins
    ├── layout/        # Header, footer, popup, reader, pages
    └── vendors/       # normalize, include-media
```

## E-book reader

- **Entry:** `reader.html` + `js/reader/index.js`
- **Features:** TOC, pagination, progress bar, search (in-book), bookmarks, highlights, reading settings (font size, alignment, background: white/sepia, night mode, brightness, letter/line spacing). Settings apply on “Apply changes”; close button returns to previous page or `index.html`.
- **State:** Current page, bookmarks, highlights, and settings stored in `localStorage` (keyed by book ID). Save-reading popup uses session for “logged in” state.
- **UI:** Floating panels (search, bookmarks, highlights, settings) open under the corresponding toolbar buttons; main modals (e.g. save progress) use shared popup styles.

## License

MIT
