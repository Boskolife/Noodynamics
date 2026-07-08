/**
 * Height-based text pagination using DOM measurement.
 */

/**
 * @param {string} text
 * @returns {string[]}
 */
function splitParagraphs(text) {
  if (!text) return [''];
  return text.split(/\n\n+/);
}

/**
 * @param {string} chunk
 * @returns {string}
 */
function trimToWordBoundary(chunk) {
  if (!chunk || chunk.length <= 1) return chunk;
  const lastSpace = chunk.lastIndexOf(' ');
  const lastNewline = chunk.lastIndexOf('\n');
  const breakAt = Math.max(lastSpace, lastNewline);
  if (breakAt <= 0) return chunk;
  return chunk.slice(0, breakAt + 1);
}

/**
 * @param {HTMLElement} measureEl
 * @param {string} text
 * @param {number} maxHeight
 * @returns {boolean}
 */
function textFits(measureEl, text, maxHeight) {
  measureEl.textContent = text;
  return measureEl.scrollHeight <= maxHeight;
}

/**
 * @param {HTMLElement} measureEl
 * @param {string} text
 * @param {number} maxHeight
 * @returns {string}
 */
function findLargestFittingPrefix(measureEl, text, maxHeight) {
  if (!text) return '';
  if (textFits(measureEl, text, maxHeight)) return text;

  let lo = 1;
  let hi = text.length;
  let best = '';

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    let candidate = trimToWordBoundary(text.slice(0, mid));
    if (!candidate) candidate = text.slice(0, mid);

    if (textFits(measureEl, candidate, maxHeight)) {
      best = candidate;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return best || text.slice(0, 1);
}

/**
 * @param {string} text
 * @param {HTMLElement} measureEl
 * @param {number} maxHeight
 * @returns {string[]}
 */
export function paginateTextByHeight(text, measureEl, maxHeight) {
  const pages = [];
  const paragraphs = splitParagraphs(text);
  let buffer = '';

  const flushBuffer = () => {
    if (!buffer) return;
    let remaining = buffer;
    while (remaining.length > 0) {
      const chunk = findLargestFittingPrefix(measureEl, remaining, maxHeight);
      pages.push(chunk.trimEnd());
      remaining = remaining.slice(chunk.length).trimStart();
    }
    buffer = '';
  };

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    const candidate = buffer ? `${buffer}\n\n${trimmedPara}` : trimmedPara;
    if (textFits(measureEl, candidate, maxHeight)) {
      buffer = candidate;
      continue;
    }

    flushBuffer();

    if (textFits(measureEl, trimmedPara, maxHeight)) {
      buffer = trimmedPara;
      continue;
    }

    buffer = trimmedPara;
    flushBuffer();
  }

  flushBuffer();
  return pages.length ? pages : [''];
}

/**
 * @param {string} fullText
 * @param {HTMLElement} measureEl
 * @param {number} maxHeight
 * @param {number} chapterIndex
 * @returns {Array<{ chapterIndex: number, start: number, end: number, text: string }>}
 */
function paginateChapter(fullText, measureEl, maxHeight, chapterIndex) {
  /** @type {Array<{ chapterIndex: number, start: number, end: number, text: string }>} */
  const map = [];
  let remaining = fullText;
  let offset = 0;

  while (remaining.length > 0) {
    const leadingWhitespace = remaining.match(/^\s*/)?.[0] ?? '';
    if (leadingWhitespace) {
      offset += leadingWhitespace.length;
      remaining = remaining.slice(leadingWhitespace.length);
    }
    if (!remaining) break;

    const pageText = findLargestFittingPrefix(measureEl, remaining, maxHeight);
    const start = offset;
    const end = offset + pageText.length;
    map.push({
      chapterIndex,
      start,
      end,
      text: pageText.trimEnd(),
    });
    offset = end;
    remaining = remaining.slice(pageText.length);
  }

  if (!map.length) {
    map.push({ chapterIndex, start: 0, end: 0, text: '' });
  }

  return map;
}

/**
 * @param {Array<{ text: string }>} chapters
 * @param {HTMLElement} measureEl
 * @param {number} maxHeight
 * @returns {Array<{ chapterIndex: number, start: number, end: number, text: string }>}
 */
export function paginateChapters(chapters, measureEl, maxHeight) {
  return chapters.flatMap((chapter, chapterIndex) =>
    paginateChapter(chapter.text ?? '', measureEl, maxHeight, chapterIndex)
  );
}
