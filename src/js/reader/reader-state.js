/**
 * Reader state: current page, bookmarks, highlights, settings, login.
 * Reads/writes from localStorage. Keyed by book ID.
 */

import { BOOK_ID } from './reader-content.js';

const STORAGE_PREFIX = 'reader_';
const KEY_PAGE = `${STORAGE_PREFIX}${BOOK_ID}_page`;
const KEY_BOOKMARKS = `${STORAGE_PREFIX}${BOOK_ID}_bookmarks`;
const KEY_HIGHLIGHTS = `${STORAGE_PREFIX}${BOOK_ID}_highlights`;
const KEY_SETTINGS = `${STORAGE_PREFIX}settings`;
const KEY_READER_LOGIN = `${STORAGE_PREFIX}logged_in`;

/** @type {Array<{ chapterIndex: number, start: number, end: number, text: string }>} */
let virtualPageMap = [{ chapterIndex: 0, start: 0, end: 0, text: '' }];
let totalPages = 1;

function clampPage(page) {
  const maxPage = Math.max(1, totalPages);
  return Math.min(Math.max(1, page), maxPage);
}

function getPageFromStorage() {
  const stored = localStorage.getItem(KEY_PAGE);
  const page = stored ? parseInt(stored, 10) : 1;
  return clampPage(page);
}

function savePage(page) {
  localStorage.setItem(KEY_PAGE, String(clampPage(page)));
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

/**
 * @param {Array<{ chapterIndex: number, start: number, end: number, text: string }>} pages
 */
export function setVirtualPages(pages) {
  virtualPageMap = pages.length
    ? pages
    : [{ chapterIndex: 0, start: 0, end: 0, text: '' }];
  totalPages = virtualPageMap.length;
}

/**
 * @param {number} chapterIndex
 * @param {number} offset
 * @returns {number}
 */
export function findPageByOffset(chapterIndex, offset) {
  const idx = virtualPageMap.findIndex(
    (page) => page.chapterIndex === chapterIndex && page.start <= offset && offset < page.end
  );
  if (idx >= 0) return idx + 1;

  const firstChapterPage = virtualPageMap.findIndex((page) => page.chapterIndex === chapterIndex);
  return firstChapterPage >= 0 ? firstChapterPage + 1 : 1;
}

/**
 * @param {number} chapterIndex
 * @returns {number}
 */
export function getChapterStartPage(chapterIndex) {
  const idx = virtualPageMap.findIndex((page) => page.chapterIndex === chapterIndex);
  return idx >= 0 ? idx + 1 : 1;
}

export const readerState = {
  get currentPage() {
    return getPageFromStorage();
  },
  set currentPage(v) {
    savePage(v);
  },
  get totalPages() {
    return totalPages;
  },
  get pageMap() {
    return virtualPageMap;
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
