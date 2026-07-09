import fs from 'node:fs';
import path from 'node:path';

const bookPath = path.resolve('src/data/reader/phenomenology-culture-systems-v1.json');
const book = JSON.parse(fs.readFileSync(bookPath, 'utf8'));

const GROUP_HEADERS = {
  'ch3-1': '2. The Rhizomodality of High Culture',
  'ch4-1':
    '3. Millennium Metalogue: A New Basis for Dialogue Between Science, Spirituality, and Art',
  'ch5-1': '4. Ecology of Mind: Emergence of the Noödynamic Paradigm',
  'ch6-1': '5. Psychography: The Character of Western Culture',
};

function normalizeHeading(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/^#+\s*/, '')
    .replace(/\s+/g, ' ');
}

function findHeadingPrefixLength(text, heading) {
  const normHeading = normalizeHeading(heading);
  for (let len = 1; len <= text.length; len += 1) {
    if (normalizeHeading(text.slice(0, len)) === normHeading) {
      return len;
    }
  }
  return 0;
}

function stripLeadingHeading(text, heading) {
  if (!heading) return { text, stripped: false };
  let remaining = String(text).trimStart();
  if (!remaining) return { text: remaining, stripped: false };

  const normHeading = normalizeHeading(heading);
  const markdownMatch = remaining.match(/^#{1,6}\s+(.+?)(?:\n|$)/);
  if (markdownMatch && normalizeHeading(markdownMatch[1]) === normHeading) {
    remaining = remaining.slice(markdownMatch[0].length).trimStart();
    return { text: remaining, stripped: true };
  }

  if (normalizeHeading(remaining).startsWith(normHeading)) {
    const prefixLength = findHeadingPrefixLength(remaining, heading);
    if (prefixLength > 0) {
      return { text: remaining.slice(prefixLength).trimStart(), stripped: true };
    }
  }

  return { text: remaining, stripped: false };
}

function stripHeadingParagraphs(text, heading) {
  if (!heading) return { text, stripped: false };

  const parts = String(text).split(/\n\s*\n/);
  let stripped = false;
  const kept = parts
    .map((part) => {
      const trimmed = part.trim();
      if (!trimmed) return '';
      const result = stripLeadingHeading(trimmed, heading);
      if (result.stripped) {
        stripped = true;
        return result.text;
      }
      return trimmed;
    })
    .filter(Boolean);

  return { text: kept.join('\n\n'), stripped };
}

function cleanPageText(text, headings) {
  let cleaned = String(text);
  let changed = false;

  for (const heading of headings) {
    let passChanged = true;
    while (passChanged) {
      passChanged = false;
      const leading = stripLeadingHeading(cleaned, heading);
      if (leading.stripped) {
        cleaned = leading.text;
        changed = true;
        passChanged = true;
        continue;
      }
      const paragraphs = stripHeadingParagraphs(cleaned, heading);
      if (paragraphs.stripped) {
        cleaned = paragraphs.text;
        changed = true;
        passChanged = true;
      }
    }
  }

  return { text: cleaned.trim(), changed };
}

function pageHasDuplicateHeading(text, heading) {
  if (!heading) return false;
  const normHeading = normalizeHeading(heading);
  const raw = String(text).trim();
  if (!raw) return false;
  if (normalizeHeading(raw).startsWith(normHeading)) return true;
  return raw
    .split(/\n\s*\n/)
    .some((part) => normalizeHeading(part.trim()).startsWith(normHeading));
}

const issues = [];
for (const chapter of book.chapters) {
  const headings = [GROUP_HEADERS[chapter.id], chapter.title].filter(Boolean);
  chapter.pages.forEach((page, pageIndex) => {
    for (const heading of headings) {
      if (pageHasDuplicateHeading(page, heading)) {
        issues.push({
          id: chapter.id,
          chapterTitle: chapter.title,
          pageIndex,
          heading,
        });
      }
    }
  });
}

const reportPath = path.resolve('scripts/audit-reader-headings-report.json');
fs.writeFileSync(reportPath, JSON.stringify(issues, null, 2));

let changedPages = 0;
for (const chapter of book.chapters) {
  const headings = [GROUP_HEADERS[chapter.id], chapter.title].filter(Boolean);
  chapter.pages = chapter.pages.map((page) => {
    const result = cleanPageText(page, headings);
    if (result.changed) changedPages += 1;
    return result.text;
  });
}

if (process.argv.includes('--fix')) {
  fs.writeFileSync(bookPath, `${JSON.stringify(book, null, 2)}\n`, 'utf8');
}

const remaining = [];
for (const chapter of book.chapters) {
  const headings = [GROUP_HEADERS[chapter.id], chapter.title].filter(Boolean);
  chapter.pages.forEach((page, pageIndex) => {
    for (const heading of headings) {
      if (pageHasDuplicateHeading(page, heading)) {
        remaining.push({
          id: chapter.id,
          pageIndex,
          heading,
        });
      }
    }
  });
}

fs.writeFileSync(
  path.resolve('scripts/audit-reader-headings-summary.txt'),
  [
    `Before fix issues: ${issues.length}`,
    ...issues.map(
      (issue) =>
        `- ${issue.id} p${issue.pageIndex + 1}: ${issue.heading.slice(0, 80)}`,
    ),
    `Changed pages: ${changedPages}`,
    `Remaining issues: ${remaining.length}`,
    ...remaining.map(
      (issue) =>
        `- ${issue.id} p${issue.pageIndex + 1}: ${issue.heading.slice(0, 80)}`,
    ),
  ].join('\n'),
  'utf8',
);
