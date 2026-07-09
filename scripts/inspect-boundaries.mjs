import fs from 'node:fs';

const htmlPath =
  'c:/Users/bosko/Downloads/Telegram Desktop/PHENOMENOLOGY-OF-CULTURE-SYSTEMS-Digital Copy.html';
const bookPath = 'src/data/reader/phenomenology-culture-systems-v1.json';

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
      pageNo: pageNoMatch?.[1] ?? null,
      dest: parseInt(pageNoMatch?.[1] ?? id.slice(2), 16),
      html: sourceHtml.slice(start, end),
    });
    searchFrom = end;
  }
  return pages;
}

const html = fs.readFileSync(htmlPath, 'utf8');
const book = JSON.parse(fs.readFileSync(bookPath, 'utf8'));
const pages = buildPageIndex(html);

function dumpPage(dest) {
  const p = pages.find((x) => x.dest === dest);
  if (!p) return console.log(`dest ${dest}: NOT FOUND`);
  const lines = extractPageLines(p.html);
  console.log(`\n=== PDF dest ${dest} (${p.id}) first 8 lines ===`);
  lines.slice(0, 8).forEach((l, i) => console.log(`${i + 1}. ${l.slice(0, 120)}`));
  console.log(`... last 3 lines ===`);
  lines.slice(-3).forEach((l, i) => console.log(`${lines.length - 2 + i}. ${l.slice(0, 120)}`));
}

[56, 57, 58, 59, 99, 100, 101].forEach(dumpPage);

const ch1 = book.chapters.find((c) => c.id === 'ch1');
const ch31 = book.chapters.find((c) => c.id === 'ch3-1');
const ch32 = book.chapters.find((c) => c.id === 'ch3-2');

console.log('\n=== JSON ch1 last 2 pages ===');
ch1.pages.slice(-2).forEach((p, i) => {
  console.log(`page ${ch1.pages.length - 1 + i}: ${p.slice(0, 150)}...`);
});

console.log('\n=== JSON ch3-1 last page tail ===');
console.log(ch31.pages.at(-1).slice(-400));

console.log('\n=== JSON ch3-2 first page head ===');
console.log(ch32.pages[0].slice(0, 400));
