/**
 * Reader UI: action bar, side panels, page navigation, TOC, search, bookmarks, highlights, settings.
 */

import { initModalManager, openModalById, closeModal } from '../ui/modal-manager.js';
import { CHAPTERS, BOOK_TITLE } from './reader-content.js';
import { formatReaderPageText } from './reader-text-format.js';
import { readerState, getReaderLoggedIn, setReaderLoggedIn } from './reader-state.js';

const FOCUS_CLASS = 'reader--focus';
const NIGHT_CLASS = 'reader--night';
const HIGHLIGHT_CLASS = 'reader__highlight';
/** Base paragraph font size in CSS (`calc(BASE * --reader-font-scale)`). */
const BASE_FONT_SIZE_PX = 18;
const MIN_FONT_SIZE_PX = 14;
const MAX_FONT_SIZE_PX = 32;
const GROUP_HEADERS = {
  'ch3-1': '2. The Rhizomodality of High Culture',
  'ch4-1':
    '3. Millennium Metalogue: A New Basis for Dialogue Between Science, Spirituality, and Art',
  'ch5-1': '4. Ecology of Mind: Emergence of the Noödynamic Paradigm',
  'ch6-1': '5. Psychography: The Character of Western Culture',
};

let currentPage = 1;
let selectedRange = null;
let activeReaderPanel = null;
let activeReaderTrigger = null;

function getChapterAnchorId(chapter) {
  return `reader-section-${chapter.id}`;
}

function getGroupAnchorId(chapterId) {
  return `reader-group-${chapterId}`;
}

function isSubsectionTitle(title) {
  return /^\d+\.\d+/.test(title);
}

function getChapterStartPage(chapterIndex) {
  let startPage = 1;
  for (let i = 0; i < chapterIndex; i += 1) {
    startPage += CHAPTERS[i].pages.length;
  }
  return startPage;
}

function getChapterInfoForPage(page) {
  const idx = Math.max(0, page - 1);
  const entry = readerState.pageMap[idx];
  if (!entry) return { chapter: null, chapterTitle: '', chapterIndex: 0 };
  const ch = CHAPTERS[entry.chapterIndex];
  return {
    chapter: ch,
    chapterTitle: ch.title,
    chapterIndex: entry.chapterIndex,
    pageIndex: entry.pageIndex,
  };
}

function getChapterBodyText(chapter) {
  return chapter.pages
    .map((raw) => formatReaderPageText(raw, chapter.title))
    .filter(Boolean)
    .join('\n\n');
}

/** Paragraphs with the same normalization used when rendering chapter HTML. */
function getChapterParagraphs(chapter) {
  return String(getChapterBodyText(chapter))
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);
}

function getPageParagraphs(chapter, pageIndex) {
  const raw = chapter.pages[pageIndex];
  if (!raw) return [];
  const text = formatReaderPageText(raw, chapter.title);
  return String(text)
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);
}

function getPageOffsetRangeInChapter(chapter, pageIndex) {
  let start = 0;
  for (let i = 0; i < pageIndex; i += 1) {
    const paragraphs = getPageParagraphs(chapter, i);
    if (!paragraphs.length) continue;
    start += paragraphs.join('\n\n').length + 2;
  }
  const currentParagraphs = getPageParagraphs(chapter, pageIndex);
  return {
    start,
    end: start + currentParagraphs.join('\n\n').length,
  };
}

function getNormalizedChapterBody(chapter) {
  return getChapterParagraphs(chapter).join('\n\n');
}

function getPointOffsetInPage(container, offset, textEl) {
  const paragraphs = [...textEl.querySelectorAll('p')];
  let bodyOffset = 0;
  let isFirstParagraph = true;

  for (const paragraph of paragraphs) {
    if (!isFirstParagraph) bodyOffset += 2;
    isFirstParagraph = false;

    if (paragraph === container || paragraph.contains(container)) {
      const preRange = document.createRange();
      preRange.selectNodeContents(paragraph);
      preRange.setEnd(container, offset);
      return bodyOffset + preRange.toString().length;
    }

    bodyOffset += paragraph.textContent.length;
  }

  return -1;
}

function createHighlightFromSelection(range, textEl) {
  const selectedText = range.toString();
  if (!selectedText.trim()) return null;

  const { chapter, pageIndex } = getChapterInfoForPage(readerState.currentPage);
  if (!chapter) return null;

  const startInPage = getPointOffsetInPage(
    range.startContainer,
    range.startOffset,
    textEl,
  );
  const endInPage = getPointOffsetInPage(
    range.endContainer,
    range.endOffset,
    textEl,
  );
  if (startInPage < 0 || endInPage < 0 || endInPage <= startInPage) return null;

  const { start: pageStart } = getPageOffsetRangeInChapter(chapter, pageIndex);
  const start = pageStart + startInPage;
  const end = pageStart + endInPage;

  const bodyText = getNormalizedChapterBody(chapter);
  const text = bodyText.slice(start, end);
  if (!text.trim()) return null;

  return {
    id: `h${Date.now()}`,
    pageId: chapter.id,
    page: readerState.currentPage,
    chapterTitle: chapter.title,
    start,
    end,
    text,
  };
}

function renderParagraphsHtml(paragraphs, highlights = []) {
  if (!paragraphs.length) return '';

  let offset = 0;
  return paragraphs
    .map((paragraph) => {
      const start = offset;
      const end = start + paragraph.length;
      offset = end + 2;
      const localHighlights = highlights
        .filter((h) => h.start < end && h.end > start)
        .map((h) => ({
          ...h,
          start: Math.max(0, h.start - start),
          end: Math.min(paragraph.length, h.end - start),
        }));
      return `<p>${applyHighlightsToText(paragraph, localHighlights)}</p>`;
    })
    .join('');
}

function renderPageHtml(globalPage) {
  const entry = readerState.pageMap[globalPage - 1];
  if (!entry) return '';

  const chapter = CHAPTERS[entry.chapterIndex];
  const pageIndex = entry.pageIndex;
  const highlights = readerState.getHighlights();
  const parts = [];

  if (pageIndex === 0 && GROUP_HEADERS[chapter.id]) {
    parts.push(
      `<h2 class="reader__section-title reader__section-title--group" id="${getGroupAnchorId(chapter.id)}">${escapeHtml(GROUP_HEADERS[chapter.id])}</h2>`,
    );
  }

  if (pageIndex === 0) {
    const isSub = isSubsectionTitle(chapter.title);
    const headingTag = isSub ? 'h3' : 'h2';
    const headingClass = isSub
      ? 'reader__section-title reader__section-title--sub'
      : 'reader__section-title';

    parts.push(
      `<${headingTag} class="${headingClass}" id="${getChapterAnchorId(chapter)}">${escapeHtml(chapter.title)}</${headingTag}>`,
    );
  }

  const { start: pageStart, end: pageEnd } = getPageOffsetRangeInChapter(
    chapter,
    pageIndex,
  );
  const pageHighlights = highlights
    .filter((h) => {
      const pageId = String(h.pageId || '');
      if (pageId !== chapter.id && !pageId.startsWith(`${chapter.id}_`)) {
        return false;
      }
      return h.start < pageEnd && h.end > pageStart;
    })
    .map((h) => ({
      ...h,
      start: Math.max(0, h.start - pageStart),
      end: h.end - pageStart,
    }));

  parts.push(renderParagraphsHtml(getPageParagraphs(chapter, pageIndex), pageHighlights));
  return parts.join('');
}

function updatePageUI(page) {
  const pageCurrentEl = document.getElementById('reader-page-current');
  const pageLabelEl = document.getElementById('reader-page-label');
  const pageTotalEl = document.getElementById('reader-page-total');
  const percentEl = document.getElementById('reader-percent-read');
  const progressFill = document.getElementById('reader-progress-fill');
  const progressBar = document.querySelector('.reader__progress-bar');
  const prevBtn = document.querySelector('.js-prev-page');
  const nextBtn = document.querySelector('.js-next-page');

  if (pageCurrentEl) pageCurrentEl.textContent = page;
  if (pageLabelEl) pageLabelEl.textContent = page;
  if (pageTotalEl) pageTotalEl.textContent = readerState.totalPages;

  const pct =
    readerState.totalPages <= 1
      ? 100
      : Math.round(((page - 1) / (readerState.totalPages - 1)) * 100) || 0;
  if (percentEl) percentEl.textContent = pct;
  if (progressFill) progressFill.style.width = `${pct}%`;
  if (progressBar) progressBar.setAttribute('aria-valuenow', pct);

  if (prevBtn) prevBtn.disabled = page <= 1;
  if (nextBtn) nextBtn.disabled = page >= readerState.totalPages;
}

function updateContent({ page = readerState.currentPage, updateHash = true } = {}) {
  currentPage = Math.min(Math.max(1, page), readerState.totalPages);
  readerState.currentPage = currentPage;

  const info = getChapterInfoForPage(currentPage);

  const bookTitleEl = document.getElementById('reader-book-title');
  const textEl = document.getElementById('reader-text');

  if (bookTitleEl) {
    bookTitleEl.textContent = BOOK_TITLE;
    bookTitleEl.hidden = currentPage > 1;
  }

  if (textEl) {
    textEl.classList.add('reader__text--turning');
    textEl.innerHTML = renderPageHtml(currentPage);
    textEl.scrollTop = 0;
    requestAnimationFrame(() => {
      textEl.classList.remove('reader__text--turning');
    });
  }

  hideHighlightPreviewTooltip();

  updatePageUI(currentPage);

  if (updateHash && info.chapter && info.pageIndex === 0) {
    history.replaceState(null, '', `#${getChapterAnchorId(info.chapter)}`);
  }
}

function goToChapter(chapterIndex) {
  if (chapterIndex < 0 || chapterIndex >= CHAPTERS.length) return;
  jumpToPage(getChapterStartPage(chapterIndex));
}

function goToGroupAnchor(chapterId) {
  const chapterIndex = CHAPTERS.findIndex((ch) => ch.id === chapterId);
  if (chapterIndex >= 0) goToChapter(chapterIndex);
}

function jumpToPage(page) {
  const nextPage = Math.min(Math.max(1, page), readerState.totalPages);
  updateContent({ page: nextPage });
  document.getElementById('reader-text')?.focus({ preventScroll: true });
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
    const groupTitle = GROUP_HEADERS[ch.id];
    if (groupTitle) {
      const groupLi = document.createElement('li');
      groupLi.className = 'reader__toc-item reader__toc-item--group';
      const groupLink = document.createElement('a');
      groupLink.className = 'reader__toc-group';
      groupLink.href = `#${getGroupAnchorId(ch.id)}`;
      groupLink.textContent = groupTitle;
      groupLink.addEventListener('click', (e) => {
        e.preventDefault();
        goToGroupAnchor(ch.id);
        closeSidebars();
      });
      groupLi.appendChild(groupLink);
      list.appendChild(groupLi);
    }

    const isSubsection = isSubsectionTitle(ch.title);
    const li = document.createElement('li');
    li.className = isSubsection
      ? 'reader__toc-item reader__toc-item--sub'
      : 'reader__toc-item';
    const link = document.createElement('a');
    link.className = 'reader__toc-link';
    link.href = `#${getChapterAnchorId(ch)}`;
    link.textContent = ch.title;
    link.dataset.chapterIndex = String(chIdx);
    link.addEventListener('click', (e) => {
      e.preventDefault();
      goToChapter(chIdx);
      closeSidebars();
    });
    li.appendChild(link);
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
      jumpToPage(parseInt(btn.dataset.page, 10));
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
        <button type="button" class="reader__highlight-goto js-goto-highlight" data-index="${idx}">
          <p class="reader__highlight-text">${escapeHtml(h.text)}</p>
          ${h.note ? `<p class="reader__highlight-note">${escapeHtml(h.note)}</p>` : ''}
          <span class="reader__highlight-meta">PAGE ${h.page} (${escapeHtml(h.chapterTitle)})</span>
        </button>
        <button type="button" class="reader__highlight-delete js-delete-highlight" data-index="${idx}" aria-label="Remove highlight">×</button>
      </div>
    `;
    list.appendChild(li);
  });

  list.querySelectorAll('.js-delete-highlight').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      readerState.removeHighlight(parseInt(btn.dataset.index, 10));
      renderHighlightsPanel();
      updateContent();
    });
  });

  list.querySelectorAll('.js-goto-highlight').forEach((btn) => {
    btn.addEventListener('click', () => {
      const h = highlights[parseInt(btn.dataset.index, 10)];
      if (!h) return;
      closeReaderPanel();
      jumpToHighlight(h);
    });
  });
}

function jumpToHighlight(highlight) {
  if (!highlight) return;
  jumpToPage(highlight.page || 1);
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
  const fontSizeTitle = document.getElementById('reader-settings-title');
  const alignCenterBtn = document.querySelector('.js-font-align-center');
  const alignLeftBtn = document.querySelector('.js-font-align-left');

  function formatFontSizeLabel(fontScale) {
    const px = Math.round(BASE_FONT_SIZE_PX * (fontScale ?? 1));
    return `Aa ${px}px`;
  }

  function clampFontScale(fontScale) {
    const minScale = MIN_FONT_SIZE_PX / BASE_FONT_SIZE_PX;
    const maxScale = MAX_FONT_SIZE_PX / BASE_FONT_SIZE_PX;
    return Math.min(maxScale, Math.max(minScale, Number(fontScale) || 1));
  }

  function stepFontScale(deltaPx) {
    const currentPx = Math.round(BASE_FONT_SIZE_PX * (draft.fontScale ?? 1));
    const nextPx = Math.min(
      MAX_FONT_SIZE_PX,
      Math.max(MIN_FONT_SIZE_PX, currentPx + deltaPx),
    );
    return parseFloat((nextPx / BASE_FONT_SIZE_PX).toFixed(4));
  }

  function updateValues() {
    if (brightnessValue) brightnessValue.textContent = String(draft.brightness);
    if (letterSpacingValue) letterSpacingValue.textContent = String(draft.letterSpacing);
    if (lineSpacingValue) lineSpacingValue.textContent = String(draft.lineSpacing);
    if (fontSizeTitle) fontSizeTitle.textContent = formatFontSizeLabel(draft.fontScale);

    if (nightBtn) nightBtn.setAttribute('aria-pressed', String(draft.nightMode));
    bgButtons.forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.bg === draft.background);
    });
    alignCenterBtn?.classList.toggle('is-active', draft.align === 'center');
    alignLeftBtn?.classList.toggle('is-active', draft.align !== 'center');
  }

  draft = { ...draft, fontScale: clampFontScale(draft.fontScale) };
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
    draft = { ...draft, fontScale: stepFontScale(-2) };
    updateValues();
  });
  document.querySelector('.js-font-size-inc')?.addEventListener('click', () => {
    draft = { ...draft, fontScale: stepFontScale(2) };
    updateValues();
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
    updateContent();
  });
}

function initPagination() {
  document.querySelector('.js-prev-page')?.addEventListener('click', () => {
    if (currentPage > 1) jumpToPage(currentPage - 1);
  });
  document.querySelector('.js-next-page')?.addEventListener('click', () => {
    if (currentPage < readerState.totalPages) jumpToPage(currentPage + 1);
  });
}

function searchBook(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results = [];
  CHAPTERS.forEach((ch, chIdx) => {
    const startPage = getChapterStartPage(chIdx);
    ch.pages.forEach((rawText, pIdx) => {
      const text = formatReaderPageText(rawText, ch.title);
      const idx = text.toLowerCase().indexOf(q);
      if (idx >= 0) {
        const excerpt = text.slice(Math.max(0, idx - 40), idx + q.length + 60);
        results.push({
          page: startPage + pIdx,
          chapterTitle: ch.title,
          excerpt: `...${excerpt}...`,
          matchIndex: idx,
        });
      }
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
        jumpToPage(r.page);
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

function getVisibleTextExcerpt(maxLength = 100) {
  const { chapter, pageIndex } = getChapterInfoForPage(readerState.currentPage);
  if (!chapter) return '';

  const paragraphs = getPageParagraphs(chapter, pageIndex);
  const text = paragraphs.join(' ');
  return text.slice(0, maxLength);
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
    readerState.addBookmark({
      page: readerState.currentPage,
      chapterTitle,
      excerpt: getVisibleTextExcerpt(),
      id: Date.now(),
    });
    renderBookmarksPanel();
  });
  header.appendChild(addBtn);
}

function hideHighlightPreviewTooltip() {
  const tooltip = document.querySelector('.js-highlight-preview-tooltip');
  if (tooltip) tooltip.hidden = true;
}

function findHighlightById(highlightId) {
  const id = String(highlightId);
  return readerState.getHighlights().find((h) => String(h.id) === id) || null;
}

function positionHighlightPreviewTooltip(tooltip, mark) {
  const rect = mark.getBoundingClientRect();
  tooltip.style.left = `${rect.left + rect.width / 2}px`;
  tooltip.style.top = `${rect.top - 8}px`;
  tooltip.style.transform = 'translate(-50%, -100%)';
}

function initHighlightPreview() {
  const textEl = document.getElementById('reader-text');
  const tooltip = document.querySelector('.js-highlight-preview-tooltip');
  const previewText = tooltip?.querySelector('.js-highlight-preview-text');
  const previewNote = tooltip?.querySelector('.js-highlight-preview-note');

  if (!textEl || !tooltip || !previewText || !previewNote) return;

  let activeMark = null;

  const hidePreview = () => {
    hideHighlightPreviewTooltip();
    activeMark = null;
  };

  const showPreview = (mark) => {
    const highlight = findHighlightById(mark.dataset.highlightId);
    if (!highlight) return;

    previewText.textContent = highlight.text;
    if (highlight.note) {
      previewNote.textContent = highlight.note;
      previewNote.hidden = false;
    } else {
      previewNote.textContent = '';
      previewNote.hidden = true;
    }

    activeMark = mark;
    positionHighlightPreviewTooltip(tooltip, mark);
    tooltip.hidden = false;
  };

  textEl.addEventListener('mouseover', (e) => {
    const mark = e.target.closest(`mark.${HIGHLIGHT_CLASS}`);
    if (!mark || !textEl.contains(mark) || mark === activeMark) return;
    showPreview(mark);
  });

  textEl.addEventListener('mouseout', (e) => {
    const mark = e.target.closest(`mark.${HIGHLIGHT_CLASS}`);
    if (!mark || mark !== activeMark) return;

    const related = e.relatedTarget;
    if (related instanceof Node && mark.contains(related)) return;
    hidePreview();
  });

  textEl.addEventListener('scroll', hidePreview, true);
  window.addEventListener('blur', hidePreview);
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
    selectedRange = range.cloneRange();
    hideHighlightPreviewTooltip();
    const rect = range.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2 - 50}px`;
    tooltip.style.top = `${rect.top - 40}px`;
    tooltip.hidden = false;
    tooltip.querySelector('.reader__highlight-btn')?.focus();
  });

  tooltip.querySelector('.reader__highlight-btn')?.addEventListener('click', () => {
    if (!selectedRange) return;

    const draft = createHighlightFromSelection(selectedRange, textEl);
    if (!draft) return;

    const note = window.prompt('Add a note (optional):', '') || '';
    readerState.addHighlight({
      ...draft,
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
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.target.closest('input, textarea')) return;
      if (activeReaderPanel) return;

      const prevKeys = ['ArrowUp', 'ArrowLeft', 'PageUp'];
      const nextKeys = ['ArrowDown', 'ArrowRight', 'PageDown', ' '];

      if (prevKeys.includes(e.key)) {
        e.preventDefault();
        if (currentPage > 1) jumpToPage(currentPage - 1);
        return;
      }

      if (nextKeys.includes(e.key)) {
        e.preventDefault();
        if (currentPage < readerState.totalPages) jumpToPage(currentPage + 1);
        return;
      }

      if (e.key === 'Home') {
        e.preventDefault();
        jumpToPage(1);
        return;
      }

      if (e.key === 'End') {
        e.preventDefault();
        jumpToPage(readerState.totalPages);
      }
    },
    true,
  );
}

function initHashNavigation() {
  const openHash = () => {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;

    const chapterIdx = CHAPTERS.findIndex((ch) => getChapterAnchorId(ch) === hash);
    if (chapterIdx >= 0) {
      goToChapter(chapterIdx);
      return;
    }

    const groupEntry = Object.keys(GROUP_HEADERS).find(
      (id) => getGroupAnchorId(id) === hash,
    );
    if (groupEntry) {
      goToGroupAnchor(groupEntry);
    }
  };

  window.addEventListener('hashchange', openHash);
  requestAnimationFrame(openHash);
}

export function initReaderUI() {
  initModalManager();
  applySettings();
  initSettings();
  updateContent({ updateHash: false });
  renderTOC();
  initReaderPanels();
  initActionBar();
  initPagination();
  initSearch();
  initBookmarkAdd();
  initTextSelection();
  initHighlightPreview();
  initSaveReadingPopup();
  initKeyboard();
  initHashNavigation();
}
