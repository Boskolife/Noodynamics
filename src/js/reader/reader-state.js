/**
 * Reader state: current page, bookmarks, highlights, settings, login.
 * Reads/writes from localStorage. Keyed by book ID.
 */

import { BOOK_ID, CHAPTERS } from './reader-content.js';

const STORAGE_PREFIX = 'reader_';
const KEY_PAGE = `${STORAGE_PREFIX}${BOOK_ID}_page`;
const KEY_BOOKMARKS = `${STORAGE_PREFIX}${BOOK_ID}_bookmarks`;
const KEY_HIGHLIGHTS = `${STORAGE_PREFIX}${BOOK_ID}_highlights`;
const KEY_SETTINGS = `${STORAGE_PREFIX}settings`;
const KEY_READER_LOGIN = `${STORAGE_PREFIX}logged_in`;

// Flatten pages for page index: [{ chapterIndex, pageIndex }, ...]
function buildPageMap() {
  const pages = [];
  CHAPTERS.forEach((ch, chIdx) => {
    ch.pages.forEach((_, pageIdx) => {
      pages.push({ chapterIndex: chIdx, pageIndex: pageIdx });
    });
  });
  return pages;
}

const PAGE_MAP = buildPageMap();
const TOTAL_PAGES = PAGE_MAP.length;

function getPageFromStorage() {
  const stored = localStorage.getItem(KEY_PAGE);
  const page = stored ? parseInt(stored, 10) : 1;
  return Math.min(Math.max(1, page), TOTAL_PAGES);
}

function savePage(page) {
  localStorage.setItem(KEY_PAGE, String(page));
}

function getBookmarksFromStorage() {
  try {
    const raw = localStorage.getItem(KEY_BOOKMARKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBookmarks(bookmarks) {
  localStorage.setItem(KEY_BOOKMARKS, JSON.stringify(bookmarks));
}

function getHighlightsFromStorage() {
  try {
    const raw = localStorage.getItem(KEY_HIGHLIGHTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHighlights(highlights) {
  localStorage.setItem(KEY_HIGHLIGHTS, JSON.stringify(highlights));
}

function getSettingsFromStorage() {
  try {
    const raw = localStorage.getItem(KEY_SETTINGS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSettings(settings) {
  localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings));
}

export function getReaderLoggedIn() {
  return sessionStorage.getItem(KEY_READER_LOGIN) === 'true';
}

export function setReaderLoggedIn(loggedIn) {
  if (loggedIn) {
    sessionStorage.setItem(KEY_READER_LOGIN, 'true');
  } else {
    sessionStorage.removeItem(KEY_READER_LOGIN);
  }
}

export const readerState = {
  get currentPage() {
    return getPageFromStorage();
  },
  set currentPage(v) {
    savePage(v);
  },
  get totalPages() {
    return TOTAL_PAGES;
  },
  get pageMap() {
    return PAGE_MAP;
  },
  getBookmarks() {
    return getBookmarksFromStorage();
  },
  setBookmarks(bookmarks) {
    saveBookmarks(bookmarks);
  },
  addBookmark(bookmark) {
    const list = getBookmarksFromStorage();
    list.push(bookmark);
    saveBookmarks(list);
    return list;
  },
  removeBookmark(index) {
    const list = getBookmarksFromStorage();
    list.splice(index, 1);
    saveBookmarks(list);
    return list;
  },
  getHighlights() {
    return getHighlightsFromStorage();
  },
  setHighlights(highlights) {
    saveHighlights(highlights);
  },
  addHighlight(highlight) {
    const list = getHighlightsFromStorage();
    list.push(highlight);
    saveHighlights(list);
    return list;
  },
  removeHighlight(index) {
    const list = getHighlightsFromStorage();
    list.splice(index, 1);
    saveHighlights(list);
    return list;
  },
  updateHighlight(index, updates) {
    const list = getHighlightsFromStorage();
    if (list[index]) Object.assign(list[index], updates);
    saveHighlights(list);
    return list;
  },
  getSettings() {
    const fromStorage = getSettingsFromStorage() || {};
    const defaults = {
      nightMode: false,
      brightness: 100,
      letterSpacing: 0,
      lineSpacing: 1.5,
      fontScale: 1,
      background: 'white',
      align: 'left',
    };
    return { ...defaults, ...fromStorage };
  },
  saveSettings(settings) {
    saveSettings(settings);
  },
};
