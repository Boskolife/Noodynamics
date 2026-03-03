/**
 * Converts PNG and JPEG images in the public directory to WebP format.
 * WebP files are placed next to originals (e.g. image.png -> image.webp).
 * Run before build so {{picture}} helper can reference both formats.
 * Usage: node scripts/convertToWebp.js [--watch]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '..', 'public', 'images');
const extensions = /\.(png|jpe?g)$/i;

function walkDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, fileList);
    } else if (extensions.test(entry.name)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

export async function convertFile(inputPath) {
  const parsed = path.parse(inputPath);
  const webpPath = path.join(parsed.dir, `${parsed.name}.webp`);
  await sharp(inputPath)
    .webp({ quality: 90 })
    .toFile(webpPath);
  console.log(`[convertToWebp] ${path.relative(publicDir, inputPath)} -> ${path.relative(publicDir, webpPath)}`);
}

export async function run() {
  const files = walkDir(publicDir);
  if (files.length === 0) {
    console.log('[convertToWebp] No PNG/JPEG files found in public/');
    return;
  }
  for (const file of files) {
    try {
      await convertFile(file);
    } catch (err) {
      console.error(`[convertToWebp] Error converting ${file}:`, err.message);
    }
  }
}

function debounce(fn, ms) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

export function startWatch() {
  if (!fs.existsSync(publicDir)) {
    console.log('[convertToWebp] public/ not found, skipping watch');
    return;
  }
  const convertDebounced = debounce(async (fullPath) => {
    if (!extensions.test(fullPath)) return;
    try {
      await convertFile(fullPath);
    } catch (err) {
      console.error(`[convertToWebp] Error converting ${fullPath}:`, err.message);
    }
  }, 300);

  fs.watch(publicDir, { recursive: true }, (event, filename) => {
    if (!filename) return;
    const fullPath = path.join(publicDir, filename);
    if (!extensions.test(filename)) return;
    convertDebounced(fullPath);
  });

  console.log('[convertToWebp] Watching public/ for new or changed images...');
}

function isMainModule() {
  try {
    const scriptPath = fileURLToPath(import.meta.url);
    return process.argv[1] && path.resolve(process.argv[1]) === path.resolve(scriptPath);
  } catch {
    return false;
  }
}

if (isMainModule()) {
  if (process.argv.includes('--watch')) {
    run().then(startWatch);
  } else {
    run();
  }
}
