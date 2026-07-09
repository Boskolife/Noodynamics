import fs from 'node:fs';
import path from 'node:path';

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
    .replace(/\s+/g, ' ')
    .trim();
}

function extractPageLines(pageHtml) {
  const lines = [];
  const re = /<div class="t[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
  let match;
  while ((match = re.exec(pageHtml)) !== null) {
    const line = cleanLine(match[1]);
    if (!line || /^\d{1,3}$/.test(line)) continue;
    lines.push(line);
  }
  return lines;
}

function buildPageIndex(sourceHtml) {
  const pages = [];
  const marker = '<div id="pf';
  let searchFrom = 0;
  while (true) {
    const start = sourceHtml.indexOf(marker, searchFrom);
    if (start === -1) break;
    const idMatch = sourceHtml.slice(start).match(/^<div id="(pf[0-9a-f]+)"[^>]*>/);
    const id = idMatch[1];
    const pageNoMatch = sourceHtml
      .slice(start, start + 160)
      .match(/data-page-no="([^"]+)"/);
    const next = sourceHtml.indexOf(marker, start + marker.length);
    const end = next === -1 ? sourceHtml.length : next;
    pages.push({
      id,
      dest: parseInt(pageNoMatch?.[1] ?? id.slice(2), 16),
      html: sourceHtml.slice(start, end),
    });
    searchFrom = end;
  }
  return pages;
}

function parseOutline(html) {
  const outlineMatch = html.match(/<div id="outline">([\s\S]*?)<\/div>\s*<div id="page-container"/);
  if (!outlineMatch) return [];
  const entries = [];
  const re = /data-dest-detail="\[(\d+),/g;
  const titleRe = /<a[^>]*data-dest-detail="\[(\d+),[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = titleRe.exec(outlineMatch[1])) !== null) {
    entries.push({ dest: Number(match[1]), title: cleanLine(match[2]) });
  }
  return entries;
}

function normalize(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

const html = fs.readFileSync(htmlPath, 'utf8');
const book = JSON.parse(fs.readFileSync(bookPath, 'utf8'));
const pages = buildPageIndex(html);
const outline = parseOutline(html);

console.log(`Outline entries: ${outline.length}`);

// Verify CHAPTER_DEFS start pages against outline
const outlineMap = new Map(outline.map((e) => [e.title.toLowerCase(), e.dest]));
for (const def of CHAPTER_DEFS) {
  const dest = outlineMap.get(def.title.toLowerCase());
  if (dest == null) {
    console.log(`MISSING OUTLINE: ${def.id} ${def.title}`);
  } else if (dest !== def.start) {
    console.log(`BOUNDARY MISMATCH: ${def.id} def=${def.start} outline=${dest}`);
  }
}

// Check chapter transitions: prev tail should connect to HTML boundary page content
for (let i = 1; i < CHAPTER_DEFS.length; i += 1) {
  const prev = CHAPTER_DEFS[i - 1];
  const curr = CHAPTER_DEFS[i];
  const boundaryPage = pages.find((p) => p.dest === curr.start);
  if (!boundaryPage) continue;

  const lines = extractPageLines(boundaryPage.html);
  const prevChapter = book.chapters.find((c) => c.id === prev.id);
  const currChapter = book.chapters.find((c) => c.id === curr.id);
  if (!prevChapter?.pages?.length || !currChapter?.pages?.length) continue;

  const prevTail = normalize(prevChapter.pages.at(-1).slice(-200));
  const currHead = normalize(currChapter.pages[0].slice(0, 200));
  const pageText = normalize(lines.join(' '));

  const prevInPage = pageText.includes(prevTail.slice(-80));
  const currInPage = pageText.includes(currHead.slice(0, 80));

  if (!prevInPage && !currInPage) {
    console.log(`\nTRANSITION CHECK ${prev.id} -> ${curr.id} (page ${curr.start}):`);
    console.log(`  prev tail: ...${prevChapter.pages.at(-1).slice(-100)}`);
    console.log(`  curr head: ${currChapter.pages[0].slice(0, 100)}...`);
    console.log(`  page head: ${lines.slice(0, 3).join(' | ')}`);
  }
}

// Full text continuity: concatenate all chapter pages and compare char count to raw extract
function findPageIndexByDest(allPages, destPage) {
  const hex = Number(destPage).toString(16);
  return allPages.findIndex((p) => String(p.pageNo) === hex || p.id === `pf${hex}`);
}

let totalJson = 0;
let issues = 0;
for (const def of CHAPTER_DEFS) {
  const ch = book.chapters.find((c) => c.id === def.id);
  if (!ch) {
    console.log(`MISSING CHAPTER ${def.id}`);
    issues += 1;
    continue;
  }
  totalJson += ch.pages.join('').length;
}

console.log(`\nTotal JSON chars: ${totalJson}`);
console.log(`Chapters in JSON: ${book.chapters.length}, expected: ${CHAPTER_DEFS.length}`);
