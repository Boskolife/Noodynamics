import fs from 'node:fs';
import path from 'node:path';
import { formatReaderPageText } from '../src/js/reader/reader-text-format.js';

const htmlPath =
  'c:/Users/bosko/Downloads/Telegram Desktop/PHENOMENOLOGY-OF-CULTURE-SYSTEMS-Digital Copy.html';
const bookPath = path.resolve('src/data/reader/phenomenology-culture-systems-v1.json');

const CHAPTER_DEFS = [
  { id: 'ch1', title: 'Proem: First Epistle to the Highbrows', start: 8, end: 58 },
  { id: 'ch2', title: '1. Introduction', start: 58, end: 92 },
  { id: 'ch3-1', title: '2.1 Prelusion', start: 92, end: 100 },
  { id: 'ch3-2', title: '2.2 A New Philosophy of Culture', start: 100, end: 120 },
  { id: 'ch3-3', title: '2.3 A New Science of Culture-systems', start: 120, end: 150 },
  { id: 'ch3-4', title: '2.4 The Expressive Modality of Culture-systems', start: 150, end: 164 },
  { id: 'ch3-5', title: '2.5 Science as a Mode of Expression', start: 164, end: 173 },
  { id: 'ch3-6', title: '2.6 Secondary Modes of Expression', start: 173, end: 176 },
  { id: 'ch3-7', title: '2.7 Unitary Cultural Modality', start: 176, end: 185 },
  { id: 'ch3-8', title: '2.8 Enculturation', start: 185, end: 198 },
  { id: 'ch4-1', title: '3.1 Prelusion', start: 198, end: 221 },
  {
    id: 'ch4-2',
    title: '3.2 The Scientific/Spiritual Arms Race: Mutually-Assured Deconstruction',
    start: 221,
    end: 245,
  },
  { id: 'ch4-3', title: '3.3 Piercing the Academic Iron Curtain', start: 245, end: 266 },
  {
    id: 'ch4-4',
    title: '3.4 The Culture-soul: Unbearable Lightness of Being-in-the-World',
    start: 266,
    end: 284,
  },
  {
    id: 'ch4-5',
    title: '3.5 Western World-feeling, Christianity, and Postmodern Metaphysics',
    start: 284,
    end: 313,
  },
  { id: 'ch4-6', title: '3.6 The Noödynamic Worldview', start: 313, end: 332 },
  { id: 'ch4-7', title: '3.7 The Culture-systemic Theory of Art', start: 332, end: 362 },
  { id: 'ch4-8', title: '3.8 From Pop-culture to Post-modern Aesthetics', start: 362, end: 394 },
  { id: 'ch5-1', title: '4.1 Prelusion', start: 394, end: 413 },
  { id: 'ch5-2', title: '4.2 Postmodern Paradigmatics', start: 413, end: 435 },
  { id: 'ch5-3', title: '4.3 The Nascent Science-based Nature-religion', start: 435, end: 456 },
  { id: 'ch5-4', title: '4.4 Empirical Spirituality', start: 456, end: 486 },
  { id: 'ch5-5', title: '4.5 Logical Faith', start: 486, end: 518 },
  { id: 'ch6-1', title: '5.1 Prelusion', start: 518, end: 552 },
  { id: 'ch6-2', title: '5.2 The Psychographical Paradigm', start: 552, end: 575 },
  { id: 'ch6-3', title: '5.3 The Faustian Mythologem', start: 575, end: 626 },
  { id: 'ch6-4', title: '5.4 Music and Mountains, Painting and Ruins', start: 626, end: 643 },
  { id: 'ch6-5', title: '5.5 Mathematics: Faustian Catechism', start: 643, end: 696 },
  { id: 'ch6-6', title: '5.6 Technology: Faustian Ritual', start: 696, end: 758 },
  { id: 'ch6-7', title: '5.7 Psychography in the New Millennium', start: 758, end: 784 },
  {
    id: 'ch7',
    title: '6. Remembrance of Things Past: The Second Religiosity',
    start: 784,
    end: 853,
  },
  { id: 'ch8', title: 'Bibliography', start: 853, end: null },
];

function cleanLine(raw) {
  return raw
    .replace(/<[^>]+>/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/\u200b/g, '')
    .replace(/\uE021/g, ' ')
    .replace(//g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeText(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractPageLines(pageHtml) {
  const lines = [];
  const re = /<div class="t[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
  let match;
  while ((match = re.exec(pageHtml)) !== null) {
    const line = cleanLine(match[1]);
    if (!line) continue;
    if (/^\d{1,3}$/.test(line)) continue;
    lines.push(line);
  }
  return lines;
}

function endsSentence(text) {
  return /[.!?…]["’”)\]]*$/.test(text.trim());
}

function isContinuation(prev, next) {
  const a = prev.trim();
  const b = next.trim();
  if (!a || !b) return true;
  if (/-$/.test(a)) return true;
  if (/^[a-zà-öø-ÿ(]/.test(b)) return true;
  if (/[,:;]$/.test(a)) return true;
  if (!endsSentence(a)) return true;
  return false;
}

function joinFragments(prev, next) {
  const a = prev.trimEnd();
  const b = next.trimStart();
  if (/-$/.test(a)) return `${a.slice(0, -1)}${b}`.replace(/\s+/g, ' ').trim();
  return `${a} ${b}`.replace(/\s+/g, ' ').trim();
}

function linesToParagraphs(lines, chapterTitle = '') {
  if (!lines.length) return [];
  let start = 0;
  const paras = [];
  const normTitle = chapterTitle.replace(/\s+/g, ' ').trim().toLowerCase();
  while (start < lines.length) {
    const line = lines[start];
    const norm = line.replace(/\s+/g, ' ').trim().toLowerCase();
    if (
      normTitle &&
      (norm === normTitle ||
        normTitle.startsWith(norm) ||
        norm.startsWith(normTitle.slice(0, 24)))
    ) {
      start += 1;
      continue;
    }
    break;
  }
  if (lines[start] && /^Pray thee,/i.test(lines[start])) {
    paras.push(lines[start]);
    start += 1;
    if (lines[start] && /^To read it well/i.test(lines[start])) {
      paras.push(lines[start]);
      start += 1;
    }
  }
  const body = lines.slice(start);
  if (!body.length) return paras;
  let current = body[0];
  for (let i = 1; i < body.length; i += 1) {
    const next = body[i];
    if (isContinuation(current, next)) current = joinFragments(current, next);
    else {
      paras.push(current);
      current = next;
    }
  }
  paras.push(current);
  return paras
    .map((p) =>
      p
        .replace(/\s+/g, ' ')
        .replace(/(\d+)\s+(st|nd|rd|th)\b/gi, '$1$2')
        .replace(/\b(\d+)(st|nd|rd|th)\s+\./gi, '$1$2.')
        .trim(),
    )
    .filter(Boolean);
}

function buildPageIndex(sourceHtml) {
  const pages = [];
  const marker = '<div id="pf';
  let searchFrom = 0;
  while (true) {
    const start = sourceHtml.indexOf(marker, searchFrom);
    if (start === -1) break;
    const idMatch = sourceHtml.slice(start).match(/^<div id="(pf[0-9a-f]+)"[^>]*>/);
    if (!idMatch) break;
    const id = idMatch[1];
    const pageNoMatch = sourceHtml
      .slice(start, start + 160)
      .match(/data-page-no="([^"]+)"/);
    const next = sourceHtml.indexOf(marker, start + marker.length);
    const end = next === -1 ? sourceHtml.length : next;
    pages.push({
      id,
      pageNo: pageNoMatch?.[1] ?? null,
      start,
      end,
      html: sourceHtml.slice(start, end),
    });
    searchFrom = end;
  }
  return pages;
}

function findPageIndexByDest(pages, destPage) {
  const hex = Number(destPage).toString(16);
  const byHexNo = pages.findIndex((p) => String(p.pageNo) === hex);
  if (byHexNo !== -1) return byHexNo;
  const byId = pages.findIndex((p) => p.id === `pf${hex}`);
  if (byId !== -1) return byId;
  return -1;
}

function healPageBoundaries(pages) {
  const healed = pages.map((page) => ({ id: page.id, paragraphs: [...page.paragraphs] }));
  for (let i = 1; i < healed.length; i += 1) {
    const prev = healed[i - 1];
    const curr = healed[i];
    if (!prev.paragraphs.length || !curr.paragraphs.length) continue;
    const prevTail = prev.paragraphs[prev.paragraphs.length - 1];
    const currHead = curr.paragraphs[0];
    if (!isContinuation(prevTail, currHead)) continue;
    prev.paragraphs[prev.paragraphs.length - 1] = joinFragments(prevTail, currHead);
    curr.paragraphs.shift();
  }
  return healed
    .map((page) => page.paragraphs.join('\n\n').trim())
    .filter(Boolean)
    .map((text) =>
      text
        .replace(/\s*Turn, Please by Sandro Del-Prete\s*/gi, ' ')
        .split(/\n\n/)
        .map((p) => p.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join('\n\n')
        .trim(),
    )
    .filter((text) => text.length >= 40);
}

function extractChapterText(allPages, startDest, endDestExclusive, chapterTitle) {
  const startIdx = findPageIndexByDest(allPages, startDest);
  const endIdx =
    endDestExclusive == null
      ? allPages.length
      : findPageIndexByDest(allPages, endDestExclusive);
  const slice = allPages.slice(startIdx, endIdx === -1 ? undefined : endIdx);
  const prepared = slice
    .map((page) => ({
      id: page.id,
      paragraphs: linesToParagraphs(extractPageLines(page.html), chapterTitle),
    }))
    .filter((page) => page.paragraphs.length > 0);
  return healPageBoundaries(prepared);
}

function parseOutline(html) {
  const outlineMatch = html.match(/<div id="outline">([\s\S]*?)<\/div>\s*<div id="page-container"/);
  if (!outlineMatch) return [];
  const block = outlineMatch[1];
  const entries = [];
  const re = /<a[^>]*href="#pf([0-9a-f]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = re.exec(block)) !== null) {
    const pageHex = match[1];
    const title = cleanLine(match[2]);
    if (!title) continue;
    entries.push({ title, dest: parseInt(pageHex, 16) });
  }
  return entries;
}

function formatPages(pages, chapter) {
  return pages.map((page) => formatReaderPageText(page, chapter.title, chapter.id));
}

function compareChapterPages(expectedPages, actualPages, chapterId) {
  const issues = [];
  const max = Math.max(expectedPages.length, actualPages.length);
  for (let i = 0; i < max; i += 1) {
    const expected = expectedPages[i] ?? '';
    const actual = actualPages[i] ?? '';
    const ne = normalizeText(expected);
    const na = normalizeText(actual);
    if (!expected && actual) {
      issues.push({ chapterId, page: i + 1, type: 'extra-page-in-json' });
      continue;
    }
    if (expected && !actual) {
      issues.push({ chapterId, page: i + 1, type: 'missing-page-in-json' });
      continue;
    }
    if (ne === na) continue;
    const prefixMatch =
      ne.length > 80 &&
      na.length > 80 &&
      (ne.startsWith(na.slice(0, 120)) || na.startsWith(ne.slice(0, 120)));
    if (prefixMatch) {
      issues.push({ chapterId, page: i + 1, type: 'minor-diff', expectedStart: expected.slice(0, 100), actualStart: actual.slice(0, 100) });
      continue;
    }
    issues.push({
      chapterId,
      page: i + 1,
      type: 'content-mismatch',
      expectedStart: expected.slice(0, 120),
      actualStart: actual.slice(0, 120),
      expectedLen: expected.length,
      actualLen: actual.length,
    });
  }
  return issues;
}

const html = fs.readFileSync(htmlPath, 'utf8');
const book = JSON.parse(fs.readFileSync(bookPath, 'utf8'));
const allPages = buildPageIndex(html);
const outline = parseOutline(html);

const report = {
  indexedPages: allPages.length,
  outlineEntries: outline.length,
  boundaryMismatches: [],
  chapterOrderMismatches: [],
  pageCountMismatches: [],
  contentIssues: [],
  headingDuplicates: [],
  samples: [],
};

// Compare CHAPTER_DEFS starts with outline leaf entries (subsections)
const outlineLeaf = outline.filter((e) => /^\d+\.\d+/.test(e.title) || /^Proem|^Bibliography|^1\. |^6\. /.test(e.title));
const defsByTitle = new Map(CHAPTER_DEFS.map((d) => [d.title.toLowerCase(), d]));

for (const entry of outlineLeaf) {
  const def = defsByTitle.get(entry.title.toLowerCase());
  if (!def) {
    report.boundaryMismatches.push({ type: 'outline-entry-without-def', title: entry.title, dest: entry.dest });
    continue;
  }
  if (def.start !== entry.dest) {
    report.boundaryMismatches.push({
      type: 'start-page-mismatch',
      id: def.id,
      title: def.title,
      defStart: def.start,
      outlineDest: entry.dest,
    });
  }
}

for (const def of CHAPTER_DEFS) {
  const jsonChapter = book.chapters.find((c) => c.id === def.id);
  if (!jsonChapter) {
    report.chapterOrderMismatches.push({ type: 'missing-chapter', id: def.id, title: def.title });
    continue;
  }
  if (jsonChapter.title !== def.title) {
    report.chapterOrderMismatches.push({
      type: 'title-mismatch',
      id: def.id,
      defTitle: def.title,
      jsonTitle: jsonChapter.title,
    });
  }

  const extracted = extractChapterText(allPages, def.start, def.end, def.title);
  const extractedFormatted = formatPages(extracted, jsonChapter);
  const jsonFormatted = formatPages(jsonChapter.pages, jsonChapter);

  if (extractedFormatted.length !== jsonFormatted.length) {
    report.pageCountMismatches.push({
      id: def.id,
      title: def.title,
      extractedPages: extractedFormatted.length,
      jsonPages: jsonFormatted.length,
    });
  }

  const issues = compareChapterPages(extractedFormatted, jsonFormatted, def.id);
  report.contentIssues.push(...issues);

  report.samples.push({
    id: def.id,
    title: def.title,
    start: def.start,
    end: def.end,
    extractedPages: extractedFormatted.length,
    jsonPages: jsonFormatted.length,
    firstExtracted: extractedFormatted[0]?.slice(0, 140) ?? '',
    firstJson: jsonFormatted[0]?.slice(0, 140) ?? '',
  });
}

// Check chapter order in JSON
const expectedOrder = CHAPTER_DEFS.map((d) => d.id);
const jsonOrder = book.chapters.map((c) => c.id);
if (JSON.stringify(expectedOrder) !== JSON.stringify(jsonOrder)) {
  report.chapterOrderMismatches.push({ type: 'order-mismatch', expectedOrder, jsonOrder });
}

const outPath = path.resolve('scripts/verify-reader-report.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

const summary = [
  `Indexed HTML pages: ${report.indexedPages}`,
  `Outline entries: ${report.outlineEntries}`,
  `Boundary mismatches: ${report.boundaryMismatches.length}`,
  `Chapter metadata mismatches: ${report.chapterOrderMismatches.length}`,
  `Page count mismatches: ${report.pageCountMismatches.length}`,
  `Content issues: ${report.contentIssues.length}`,
  '',
  ...report.boundaryMismatches.map((m) => `BOUNDARY ${m.type} ${m.id || ''} ${m.title || ''} def=${m.defStart} outline=${m.outlineDest}`),
  ...report.pageCountMismatches.map((m) => `PAGES ${m.id}: extracted=${m.extractedPages} json=${m.jsonPages}`),
  ...report.contentIssues.slice(0, 30).map((m) => `CONTENT ${m.chapterId} p${m.page} ${m.type}`),
];

fs.writeFileSync(path.resolve('scripts/verify-reader-summary.txt'), summary.join('\n'), 'utf8');
console.log(summary.join('\n'));
