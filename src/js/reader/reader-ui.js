/**
 * Reader UI: action bar, side panels, pagination, TOC, search, bookmarks, highlights, settings.
 */

import { initModalManager, openModalById, closeModal } from '../ui/modal-manager.js';
import { CHAPTERS, BOOK_TITLE } from './reader-content.js';
import { readerState, getReaderLoggedIn, setReaderLoggedIn } from './reader-state.js';

const FOCUS_CLASS = 'reader--focus';
const NIGHT_CLASS = 'reader--night';
const HIGHLIGHT_CLASS = 'reader__highlight';

let currentPage = 1;
let selectedRange = null;
let activeReaderPanel = null;
let activeReaderTrigger = null;

function getChapterInfoForPage(page) {
  const idx = Math.max(0, page - 1);
  const entry = readerState.pageMap[idx];
  if (!entry) return { chapter: null, pageText: '', chapterTitle: '' };
  const ch = CHAPTERS[entry.chapterIndex];
  const pageText = ch.pages[entry.pageIndex] ?? '';
  return {
    chapter: ch,
    pageText,
    chapterTitle: ch.title,
    chapterIndex: entry.chapterIndex,
    pageIndex: entry.pageIndex,
  };
}

function updateContent() {
  currentPage = readerState.currentPage;
  const { pageText, chapterTitle } = getChapterInfoForPage(currentPage);

  const bookTitleEl = document.getElementById('reader-book-title');
  const chapterTitleEl = document.getElementById('reader-chapter-title');
  const textEl = document.getElementById('reader-text');

  if (bookTitleEl) bookTitleEl.textContent = BOOK_TITLE;
  if (chapterTitleEl) chapterTitleEl.textContent = chapterTitle;
  if (textEl) {
    const highlights = readerState.getHighlights();
    const pageId = getCurrentPageId();
    const pageHighlights = highlights.filter((h) => h.pageId === pageId);
    textEl.innerHTML = applyHighlightsToText(pageText, pageHighlights);
  }

  const pageCurrentEl = document.getElementById('reader-page-current');
  const pageLabelEl = document.getElementById('reader-page-label');
  const pageTotalEl = document.getElementById('reader-page-total');
  const percentEl = document.getElementById('reader-percent-read');
  const progressFill = document.getElementById('reader-progress-fill');
  const progressBar = document.querySelector('.reader__progress-bar');

  if (pageCurrentEl) pageCurrentEl.textContent = currentPage;
  if (pageLabelEl) pageLabelEl.textContent = currentPage;
  if (pageTotalEl) pageTotalEl.textContent = readerState.totalPages;
  const pct = Math.round(((currentPage - 1) / (readerState.totalPages - 1)) * 100) || 0;
  if (percentEl) percentEl.textContent = pct;
  if (progressFill) progressFill.style.width = `${pct}%`;
  if (progressBar) progressBar.setAttribute('aria-valuenow', pct);
}

function getCurrentPageId() {
  const entry = readerState.pageMap[currentPage - 1];
  if (!entry) return '';
  return `ch${entry.chapterIndex}_p${entry.pageIndex}`;
}

function applyHighlightsToText(text, highlights) {
  if (!highlights.length) return escapeHtml(text);
  const parts = [];
  let last = 0;
  highlights
    .slice()
    .sort((a, b) => a.start - b.start)
    .forEach((h) => {
      if (h.start > last) parts.push(escapeHtml(text.slice(last, h.start)));
      parts.push(`<mark class="${HIGHLIGHT_CLASS}" data-highlight-id="${escapeHtml(String(h.id))}">${escapeHtml(text.slice(h.start, h.end))}</mark>`);
      last = h.end;
    });
  if (last < text.length) parts.push(escapeHtml(text.slice(last)));
  return parts.join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function highlightSearchExcerpt(text, query) {
  const q = query.trim();
  if (!q) return escapeHtml(text);

  const lowerText = text.toLowerCase();
  const lowerQ = q.toLowerCase();
  let index = 0;
  let matchIndex = lowerText.indexOf(lowerQ);
  if (matchIndex === -1) return escapeHtml(text);

  const parts = [];

  while (matchIndex !== -1) {
    if (matchIndex > index) {
      parts.push(escapeHtml(text.slice(index, matchIndex)));
    }
    const matchText = text.slice(matchIndex, matchIndex + q.length);
    parts.push(`<strong>${escapeHtml(matchText)}</strong>`);
    index = matchIndex + q.length;
    matchIndex = lowerText.indexOf(lowerQ, index);
  }

  if (index < text.length) {
    parts.push(escapeHtml(text.slice(index)));
  }

  return parts.join('');
}

function renderTOC() {
  const list = document.getElementById('reader-toc-list');
  if (!list) return;
  list.innerHTML = '';
  CHAPTERS.forEach((ch, chIdx) => {
    let startPage = 1;
    for (let i = 0; i < chIdx; i++) startPage += CHAPTERS[i].pages.length;
    const li = document.createElement('li');
    li.className = 'reader__toc-item';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'reader__toc-link';
    btn.textContent = ch.title;
    btn.dataset.chapterIndex = String(chIdx);
    btn.dataset.page = String(startPage);
    btn.addEventListener('click', () => {
      readerState.currentPage = startPage;
      updateContent();
      closeSidebars();
    });
    li.appendChild(btn);
    list.appendChild(li);
  });
}

function renderBookmarksPanel() {
  const list = document.getElementById('reader-bookmarks-list');
  const empty = document.getElementById('reader-bookmarks-empty');
  const bookmarks = readerState.getBookmarks();
  if (!list || !empty) return;

  list.innerHTML = '';
  empty.hidden = bookmarks.length > 0;
  bookmarks.forEach((b, idx) => {
    const li = document.createElement('li');
    li.className = 'reader__list-item reader__bookmark-item';
    li.innerHTML = `
      <div class="reader__bookmark-content">
        <span class="reader__bookmark-title">${escapeHtml(b.chapterTitle)}</span>
        <p class="reader__bookmark-excerpt">${escapeHtml(b.excerpt || '')}</p>
        <button type="button" class="reader__bookmark-link js-goto-bookmark" data-page="${b.page}">PAGE ${b.page} (${escapeHtml(b.chapterTitle)})</button>
        <button type="button" class="reader__bookmark-delete js-delete-bookmark" data-index="${idx}" aria-label="Remove bookmark">×</button>
      </div>
    `;
    list.appendChild(li);
  });

  list.querySelectorAll('.js-goto-bookmark').forEach((btn) => {
    btn.addEventListener('click', () => {
      readerState.currentPage = parseInt(btn.dataset.page, 10);
      updateContent();
      closeReaderPanel();
    });
  });
  list.querySelectorAll('.js-delete-bookmark').forEach((btn) => {
    btn.addEventListener('click', () => {
      readerState.removeBookmark(parseInt(btn.dataset.index, 10));
      renderBookmarksPanel();
    });
  });
}

function renderHighlightsPanel() {
  const list = document.getElementById('reader-highlights-list');
  const emptyElements = document.querySelectorAll('.js-highlights-empty');
  const highlights = readerState.getHighlights();
  if (!list) return;

  list.innerHTML = '';
  emptyElements.forEach((el) => {
    const shouldHide = highlights.length > 0;
    if (el instanceof HTMLElement) {
      el.hidden = shouldHide;
    } else if (el instanceof SVGElement) {
      el.style.display = shouldHide ? 'none' : '';
      el.setAttribute('aria-hidden', shouldHide ? 'true' : 'false');
    }
  });
  highlights.forEach((h, idx) => {
    const li = document.createElement('li');
    li.className = 'reader__list-item reader__highlight-item';
    li.innerHTML = `
      <div class="reader__highlight-content">
        <p class="reader__highlight-text">${escapeHtml(h.text)}</p>
        ${h.note ? `<p class="reader__highlight-note">${escapeHtml(h.note)}</p>` : ''}
        <span class="reader__highlight-meta">PAGE ${h.page} (${escapeHtml(h.chapterTitle)})</span>
        <button type="button" class="reader__highlight-delete js-delete-highlight" data-index="${idx}" aria-label="Remove highlight">×</button>
      </div>
    `;
    list.appendChild(li);
  });

  list.querySelectorAll('.js-delete-highlight').forEach((btn) => {
    btn.addEventListener('click', () => {
      readerState.removeHighlight(parseInt(btn.dataset.index, 10));
      renderHighlightsPanel();
      updateContent();
    });
  });

  list.querySelectorAll('.reader__highlight-text').forEach((el, idx) => {
    el.addEventListener('click', () => {
      const h = highlights[idx];
      if (h) {
        readerState.currentPage = h.page;
        updateContent();
        closeReaderPanel();
      }
    });
  });
}

function applySettings() {
  const s = readerState.getSettings();
  const root = document.getElementById('reader-root');
  const header = document.getElementById('header');
  if (!root) return;
  root.classList.toggle(NIGHT_CLASS, s.nightMode);
  root.style.setProperty('--reader-text-opacity', String(s.brightness / 100));
  root.style.setProperty('--reader-letter-spacing', `${s.letterSpacing}px`);
  root.style.setProperty('--reader-line-height', String(s.lineSpacing));
  root.style.setProperty('--reader-font-scale', String(s.fontScale ?? 1));
  const bg =
    s.background === 'yellow'
      ? '#f4e6cf'
      : '#ffffff';
  root.style.setProperty('--reader-bg-color', bg);
  root.style.setProperty('--reader-text-align', s.align === 'center' ? 'center' : 'left');

  const useAccent = !s.nightMode && s.background === 'yellow';
  root.classList.toggle('reader--accent', useAccent);

  if (header) {
    header.classList.toggle('header--ebook-night', s.nightMode);
    header.classList.toggle('header--ebook-accent', useAccent);
  }
}

function closeSidebars() {
  document.querySelectorAll('.reader__sidebar').forEach((sb) => sb.classList.remove('reader__sidebar--open'));
  document.getElementById('reader-root')?.classList.remove(FOCUS_CLASS);
}

function closeReaderPanel() {
  if (!activeReaderPanel) return;
  activeReaderPanel.classList.remove('reader-panel--open');
  activeReaderPanel.setAttribute('aria-hidden', 'true');
  activeReaderPanel.hidden = true;
  if (activeReaderTrigger) {
    activeReaderTrigger.setAttribute('aria-pressed', 'false');
    activeReaderTrigger = null;
  }
  activeReaderPanel = null;
}

function openReaderPanel(panelId, trigger) {
  const panel = document.getElementById(panelId);
  if (!panel || !trigger) return;

  const windowEl = panel.querySelector('.reader-panel__window');
  if (!windowEl) return;

  const rect = trigger.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const bottomY = rect.bottom + 8;

  windowEl.style.left = `${centerX}px`;
  windowEl.style.top = `${bottomY}px`;

  closeReaderPanel();

  panel.hidden = false;
  panel.setAttribute('aria-hidden', 'false');
  panel.classList.add('reader-panel--open');
  activeReaderPanel = panel;
  activeReaderTrigger = trigger;

  trigger.setAttribute('aria-pressed', 'true');

  const focusTarget =
    panel.querySelector('[data-reader-panel-focus]') ||
    panel.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusTarget instanceof HTMLElement) focusTarget.focus();
}

function initReaderPanels() {
  document.querySelectorAll('.reader-panel').forEach((panel) => {
    const closeBtn = panel.querySelector('.js-reader-panel-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (panel === activeReaderPanel) closeReaderPanel();
      });
    }
  });

  document.addEventListener('mousedown', (e) => {
    if (!activeReaderPanel) return;
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const withinPanel = !!target.closest('.reader-panel__window');
    const isTrigger = !!target.closest('.reader__action');
    if (!withinPanel && !isTrigger) {
      closeReaderPanel();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeReaderPanel();
    }
  });
}

function initActionBar() {
  const root = document.getElementById('reader-root');
  const bookmarksBtn = document.querySelector('.js-toggle-bookmarks');
  const highlightsBtn = document.querySelector('.js-toggle-highlights');
  const settingsBtn = document.querySelector('.js-toggle-settings');
  const searchBtn = document.querySelector('.js-toggle-search');

  document.querySelector('.js-toggle-focus')?.addEventListener('click', () => {
    root?.classList.toggle(FOCUS_CLASS);
  });

  document.querySelectorAll('.js-close-sidebar').forEach((btn) => {
    btn.addEventListener('click', closeSidebars);
  });

  bookmarksBtn?.addEventListener('click', () => {
    if (activeReaderPanel && activeReaderPanel.id === 'reader-bookmarks-panel-root') {
      closeReaderPanel();
      return;
    }
    renderBookmarksPanel();
    openReaderPanel('reader-bookmarks-panel-root', bookmarksBtn);
  });

  highlightsBtn?.addEventListener('click', () => {
    if (activeReaderPanel && activeReaderPanel.id === 'reader-highlights-panel-root') {
      closeReaderPanel();
      return;
    }
    renderHighlightsPanel();
    openReaderPanel('reader-highlights-panel-root', highlightsBtn);
  });

  settingsBtn?.addEventListener('click', () => {
    if (activeReaderPanel && activeReaderPanel.id === 'reader-settings-panel-root') {
      closeReaderPanel();
      return;
    }
    openReaderPanel('reader-settings-panel-root', settingsBtn);
  });

  searchBtn?.addEventListener('click', () => {
    if (activeReaderPanel && activeReaderPanel.id === 'reader-search-panel-root') {
      closeReaderPanel();
      return;
    }
    openReaderPanel('reader-search-panel-root', searchBtn);
  });
}

function initSettings() {
  let draft = { ...readerState.getSettings() };
  const nightBtn = document.querySelector('.js-night-toggle');
  const bgButtons = document.querySelectorAll('.js-bg-color');
  const brightnessValue = document.getElementById('reader-brightness-value');
  const letterSpacingValue = document.getElementById('reader-letter-spacing-value');
  const lineSpacingValue = document.getElementById('reader-line-spacing-value');
  const alignCenterBtn = document.querySelector('.js-font-align-center');
  const alignLeftBtn = document.querySelector('.js-font-align-left');

  function updateValues() {
    if (brightnessValue) brightnessValue.textContent = String(draft.brightness);
    if (letterSpacingValue) letterSpacingValue.textContent = String(draft.letterSpacing);
    if (lineSpacingValue) lineSpacingValue.textContent = String(draft.lineSpacing);

    if (nightBtn) nightBtn.setAttribute('aria-pressed', String(draft.nightMode));
    bgButtons.forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.bg === draft.background);
    });
    alignCenterBtn?.classList.toggle('is-active', draft.align === 'center');
    alignLeftBtn?.classList.toggle('is-active', draft.align !== 'center');
  }

  updateValues();

  if (nightBtn) {
    nightBtn.addEventListener('click', () => {
      draft = { ...draft, nightMode: !draft.nightMode };
      updateValues();
    });
  }

  bgButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const bg = btn.dataset.bg === 'yellow' ? 'yellow' : 'white';
      draft = { ...draft, background: bg };
      updateValues();
    });
  });

  alignCenterBtn?.addEventListener('click', () => {
    draft = { ...draft, align: 'center' };
    updateValues();
  });

  alignLeftBtn?.addEventListener('click', () => {
    draft = { ...draft, align: 'left' };
    updateValues();
  });

  document.querySelector('.js-brightness-dec')?.addEventListener('click', () => {
    draft = { ...draft, brightness: Math.max(70, draft.brightness - 5) };
    updateValues();
  });
  document.querySelector('.js-brightness-inc')?.addEventListener('click', () => {
    draft = { ...draft, brightness: Math.min(100, draft.brightness + 5) };
    updateValues();
  });

  document.querySelector('.js-letter-spacing-dec')?.addEventListener('click', () => {
    draft = { ...draft, letterSpacing: Math.max(-1, draft.letterSpacing - 0.5) };
    updateValues();
  });
  document.querySelector('.js-letter-spacing-inc')?.addEventListener('click', () => {
    draft = { ...draft, letterSpacing: Math.min(3, draft.letterSpacing + 0.5) };
    updateValues();
  });

  document.querySelector('.js-line-spacing-dec')?.addEventListener('click', () => {
    draft = { ...draft, lineSpacing: Math.max(1, parseFloat((draft.lineSpacing - 0.1).toFixed(2))) };
    updateValues();
  });
  document.querySelector('.js-line-spacing-inc')?.addEventListener('click', () => {
    draft = { ...draft, lineSpacing: Math.min(2.5, parseFloat((draft.lineSpacing + 0.1).toFixed(2))) };
    updateValues();
  });

  document.querySelector('.js-font-size-dec')?.addEventListener('click', () => {
    draft = { ...draft, fontScale: Math.max(0.8, parseFloat((draft.fontScale - 0.1).toFixed(2))) };
  });
  document.querySelector('.js-font-size-inc')?.addEventListener('click', () => {
    draft = { ...draft, fontScale: Math.min(1.4, parseFloat((draft.fontScale + 0.1).toFixed(2))) };
  });

  document.querySelector('.js-settings-reset')?.addEventListener('click', () => {
    draft = {
      nightMode: false,
      brightness: 100,
      letterSpacing: 0,
      lineSpacing: 1.5,
      fontScale: 1,
      background: 'white',
      align: 'left',
    };
    updateValues();
  });

  document.querySelector('.js-settings-apply')?.addEventListener('click', () => {
    readerState.saveSettings(draft);
    applySettings();
  });
}

function initPagination() {
  document.querySelector('.js-prev-page')?.addEventListener('click', () => {
    if (currentPage > 1) {
      readerState.currentPage = currentPage - 1;
      updateContent();
    }
  });
  document.querySelector('.js-next-page')?.addEventListener('click', () => {
    if (currentPage < readerState.totalPages) {
      readerState.currentPage = currentPage + 1;
      updateContent();
    }
  });
}

function searchBook(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results = [];
  CHAPTERS.forEach((ch, chIdx) => {
    let pageNum = 1;
    for (let i = 0; i < chIdx; i++) pageNum += CHAPTERS[i].pages.length;
    ch.pages.forEach((text, pIdx) => {
      const idx = text.toLowerCase().indexOf(q);
      if (idx >= 0) {
        const excerpt = text.slice(Math.max(0, idx - 40), idx + q.length + 60);
        results.push({
          page: pageNum + pIdx,
          chapterTitle: ch.title,
          excerpt: '...' + excerpt + '...',
          matchIndex: idx,
        });
      }
      pageNum++;
    });
  });
  return results;
}

function initSearch() {
  const input = document.getElementById('reader-search-input');
  const btn = document.getElementById('reader-search-btn');
  const resultsEl = document.getElementById('reader-search-results');

  const runSearch = () => {
    const query = input?.value ?? '';
    if (!resultsEl) return;
    resultsEl.innerHTML = '';

    const trimmed = query.trim();
    if (!trimmed) {
      resultsEl.style.display = 'none';
      return;
    }

    const results = searchBook(query);
    if (!results.length) {
      const li = document.createElement('li');
      li.className = 'reader__search-result-item';
      li.textContent = 'No results found.';
      resultsEl.appendChild(li);
      resultsEl.style.display = 'flex';
      return;
    }

    results.slice(0, 20).forEach((r) => {
      const li = document.createElement('li');
      li.className = 'reader__search-result-item';
      li.innerHTML = `
        <p class="reader__search-excerpt">${highlightSearchExcerpt(r.excerpt, query)}</p>
        <button type="button" class="reader__search-result-link" data-page="${r.page}">PAGE ${r.page} (${escapeHtml(r.chapterTitle)})</button>
      `;
      li.querySelector('button').addEventListener('click', () => {
        readerState.currentPage = r.page;
        updateContent();
        closeReaderPanel();
      });
      resultsEl.appendChild(li);
    });
    resultsEl.style.display = 'flex';
  };

  btn?.addEventListener('click', runSearch);
  input?.addEventListener('input', runSearch);
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runSearch();
  });
}

function initBookmarkAdd() {
  // Add bookmark button in bookmarks panel - append to panel content
  const panel = document.getElementById('reader-bookmarks-panel');
  if (!panel) return;
  const header = panel.insertBefore(document.createElement('div'), panel.firstChild);
  header.className = 'reader__panel-actions';
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'reader__add-bookmark-btn js-add-bookmark';
  addBtn.textContent = 'Add current page';
  addBtn.addEventListener('click', () => {
    const { chapterTitle } = getChapterInfoForPage(readerState.currentPage);
    const textEl = document.getElementById('reader-text');
    const excerpt = textEl ? textEl.textContent.slice(0, 100) : '';
    readerState.addBookmark({
      page: readerState.currentPage,
      chapterTitle,
      excerpt,
      id: Date.now(),
    });
    renderBookmarksPanel();
  });
  header.appendChild(addBtn);
}

function initTextSelection() {
  const textEl = document.getElementById('reader-text');
  const tooltip = document.querySelector('.js-highlight-tooltip');

  if (!textEl || !tooltip) return;

  textEl.addEventListener('mouseup', () => {
    const sel = window.getSelection();
    const range = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
    if (!range || range.collapsed) {
      tooltip.hidden = true;
      selectedRange = null;
      return;
    }
    if (!textEl.contains(range.commonAncestorContainer)) {
      tooltip.hidden = true;
      selectedRange = null;
      return;
    }
    selectedRange = range;
    const rect = range.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2 - 50}px`;
    tooltip.style.top = `${rect.top - 40}px`;
    tooltip.hidden = false;
    tooltip.querySelector('.reader__highlight-btn')?.focus();
  });

  tooltip.querySelector('.reader__highlight-btn')?.addEventListener('click', () => {
    if (!selectedRange) return;
    const text = selectedRange.toString();
    const fullText = textEl.textContent;
    const start = fullText.indexOf(text);
    if (start < 0) return;
    const pageId = getCurrentPageId();
    const { chapterTitle } = getChapterInfoForPage(currentPage);
    const note = window.prompt('Add a note (optional):', '') || '';
    readerState.addHighlight({
      id: `h${Date.now()}`,
      pageId,
      page: currentPage,
      chapterTitle,
      start,
      end: start + text.length,
      text,
      note,
    });
    tooltip.hidden = true;
    selectedRange = null;
    window.getSelection()?.removeAllRanges();
    updateContent();
    renderHighlightsPanel();
  });

  document.addEventListener('mousedown', (e) => {
    if (!tooltip.contains(e.target) && !e.target.closest('.reader__text')) {
      tooltip.hidden = true;
      selectedRange = null;
    }
  });
}

function initSaveReadingPopup() {
  const backdrop = document.getElementById('reader-save-popup-backdrop');
  const form = backdrop?.querySelector('.js-reader-save-form');
  const closeBtn = backdrop?.querySelector('.js-close-popup');
  const openBtn = document.querySelector('.js-open-save-reading-popup');
  const saveLabel = document.querySelector('.js-save-label');

  function updateSaveLabel() {
    if (saveLabel) saveLabel.textContent = getReaderLoggedIn() ? 'Profile' : 'Login';
  }

  closeBtn?.addEventListener('click', () => closeModal(backdrop));

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.querySelector('#reader-save-name')?.value?.trim();
    const password = form.querySelector('#reader-save-password')?.value;
    if (!name || !password) return;
    setReaderLoggedIn(true);
    closeModal(backdrop);
    updateSaveLabel();
    form.reset();
  });

  openBtn?.addEventListener('click', () => {
    openModalById('reader-save-popup-backdrop');
  });

  backdrop?.querySelector('.popup__overlay')?.addEventListener('click', () => closeModal(backdrop));
  updateSaveLabel();
}

function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea')) return;
    if (e.key === 'PageDown') {
      e.preventDefault();
      if (currentPage < readerState.totalPages) {
        readerState.currentPage = currentPage + 1;
        updateContent();
      }
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      if (currentPage > 1) {
        readerState.currentPage = currentPage - 1;
        updateContent();
      }
    }
  });
}

export function initReaderUI() {
  initModalManager();
  applySettings();
  initSettings();
  updateContent();
  renderTOC();
  initReaderPanels();
  initActionBar();
  initPagination();
  initSearch();
  initBookmarkAdd();
  initTextSelection();
  initSaveReadingPopup();
  initKeyboard();
}
