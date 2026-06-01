/**
 * Normalize reader page text: remove duplicate markdown headings and stray ## artifacts.
 */

function normalizeHeading(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/^#+\s*/, '')
    .replace(/\s+/g, ' ');
}

/**
 * @param {string} text
 * @param {string} [chapterTitle]
 * @returns {string}
 */
export function formatReaderPageText(text, chapterTitle = '') {
  const normTitle = normalizeHeading(chapterTitle);
  const lines = String(text).split('\n');

  while (lines.length > 0) {
    const line = lines[0].trim();
    if (!line) {
      lines.shift();
      continue;
    }

    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      const heading = normalizeHeading(headingMatch[1]);
      if (!normTitle || heading === normTitle) {
        lines.shift();
        continue;
      }
    }

    if (/^#{1,6}\s*$/.test(line)) {
      lines.shift();
      continue;
    }

    break;
  }

  return lines
    .filter((line) => !/^\s*##\s*$/.test(line))
    .join('\n')
    .trim();
}
