/* eslint-disable no-undef */
import { resolve } from 'path';
import { defineConfig } from 'vite';
import handlebars from 'vite-plugin-handlebars';
import { htmlFiles } from './getHTMLFileNames';
import {
  run as runWebpConversion,
  startWatch as startWebpWatch,
} from './scripts/convertToWebp.js';

/**
 * Renders <picture> with WebP source and PNG/JPEG fallback.
 * Usage: {{{picture "/images/photo.png" alt="Description"}}} (triple braces for raw HTML)
 * Optional hash: alt, class, loading (default "lazy"), width, height, sources (array of objects with media and srcset)
 *
 * Example with media queries:
 * {{{picture "/images/hero.png" alt="Hero" sources=(array (object media="(max-width: 768px)" srcset="/images/hero-mobile.png") (object media="(min-width: 769px)" srcset="/images/hero-desktop.png"))}}}
 */
function pictureHelper(pathOrSrc, options = {}) {
  const src = typeof pathOrSrc === 'string' ? pathOrSrc : '';
  const hash = options.hash || {};
  const alt = hash.alt != null ? String(hash.alt) : '';
  const className = hash.class != null ? ` class="${String(hash.class)}"` : '';
  const loading = hash.loading != null ? String(hash.loading) : 'lazy';
  const width = hash.width != null ? ` width="${Number(hash.width)}"` : '';
  const height = hash.height != null ? ` height="${Number(hash.height)}"` : '';
  const sources = hash.sources || [];

  // Use relative path so browser resolves once with document <base href="/WacthCash/"> (avoids /WacthCash/WacthCash/...)
  const normalized = src.replace(/^\//, '');
  const imgPath = normalized;
  const webpPath = normalized.replace(/\.(png|jpe?g)$/i, '.webp');

  let sourcesHtml = '';

  // Add custom sources with media queries
  if (Array.isArray(sources) && sources.length > 0) {
    sources.forEach((source) => {
      if (source && typeof source === 'object') {
        const media = source.media
          ? ` media="${String(source.media).replace(/"/g, '&quot;')}"`
          : '';
        const srcset = source.srcset || source.src || '';
        const type = source.type
          ? ` type="${String(source.type).replace(/"/g, '&quot;')}"`
          : '';

        if (srcset) {
          const normalizedSrcset = srcset.replace(/^\//, '');
          sourcesHtml += `<source${media} srcset="${normalizedSrcset}"${type}>`;
        }
      }
    });
  }

  return (
    `<picture${className}>` +
    sourcesHtml +
    `<source srcset="${webpPath}" type="image/webp">` +
    `<img src="${imgPath}" alt="${alt.replace(
      /"/g,
      '&quot;',
    )}" loading="${loading}"${width}${height}>` +
    `</picture>`
  );
}

const input = { main: resolve(__dirname, 'src/index.html') };
htmlFiles.forEach((file) => {
  input[file.replace('.html', '')] = resolve(__dirname, 'src', file);
});

const webpPlugin = () => {
  return {
    name: 'webp-convert',
    async buildStart() {
      await runWebpConversion();
    },
    configureServer() {
      startWebpWatch();
    },
  };
};

const handlebarsReloadPlugin = () => {
  return {
    name: 'handlebars-reload',
    handleHotUpdate({ file, server }) {
      const normalizedPath = file.replace(/\\/g, '/');

      // Check if changed file is a partial (template or section)
      if (
        normalizedPath.includes('/templates/') ||
        normalizedPath.includes('/sections/')
      ) {
        // Force full page reload when partials change
        server.ws.send({
          type: 'full-reload',
          path: '*',
        });
        return [];
      }
    },
    configureServer(server) {
      const templatesDir = resolve(__dirname, 'src/templates');
      const sectionsDir = resolve(__dirname, 'src/sections');

      // Explicitly watch templates and sections directories
      server.watcher.add([templatesDir, sectionsDir]);
    },
  };
};

export default defineConfig({
  base: '/Noodynamics',
  root: 'src',
  publicDir: '../public',
  plugins: [
    handlebars({
      partialDirectory: [
        resolve(__dirname, 'src/templates'),
        resolve(__dirname, 'src/sections'),
      ],
      reloadOnPartialChange: true,
      helpers: {
        picture: pictureHelper,
        array: function (...args) {
          // Remove the last argument which is Handlebars options object
          const items = args.slice(0, -1);
          return items;
        },
        object: function (...args) {
          // Remove the last argument which is Handlebars options object
          const options = args[args.length - 1];
          return options.hash || {};
        },
      },
    }),
    handlebarsReloadPlugin(),
    webpPlugin(),
  ],
  build: {
    rollupOptions: {
      input,
    },
    outDir: '../dist/',
    emptyOutDir: true,
  },
  server: {
    host: true,
    open: true,
  },
});
