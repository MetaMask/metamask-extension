/*
 * ============================================================================
 * ⚠️  TESTING / SPIKE ONLY — NOT FOR PRODUCTION  ⚠️
 * ============================================================================
 *
 * This script vendors the proprietary TradingView `charting_library` into
 * `app/advanced-chart/lib/` so the local-hosting spike can serve it from the
 * extension's OWN origin (`chrome-extension://…`, i.e. `'self'`). That is the
 * only way an MV3 extension page can execute the library — a remote
 * `<script src="https://…cdn…">` is blocked by the `script-src 'self'` CSP.
 *
 * It exists ONLY to reproduce / investigate the extension-local hosting
 * approach, which this spike found to be INFEASIBLE: once the library is
 * vendored and loaded from `'self'`, TradingView still throws an opaque-origin
 * `SecurityError` inside the MV3 manifest-`sandbox` (opaque origin) — see
 * https://github.com/MetaMask/metamask-extension/pull/45233 for the reproduced
 * error and verdict.
 *
 * Production would NOT use this. The recommended remote-origin design serves the
 * library from a MetaMask-owned web origin and loads it at RUNTIME (exactly like
 * mobile's `MM_CHARTING_LIBRARY_URL` WebView model), so nothing is vendored into
 * the extension and no fetch script is needed at all.
 *
 * Opt-in only: it is NOT wired into the default build, so CI / offline builds
 * never hit the network. Run it manually with `yarn advanced-chart:fetch-lib`.
 * ============================================================================
 */

// @ts-check
/**
 * Vendor the proprietary TradingView `charting_library` (Advanced Charts) static
 * bundle into `app/advanced-chart/lib/` so the extension can self-host it and
 * load it from its own origin (`chrome-extension://…/advanced-chart/lib/…`).
 *
 * WHY self-host: the MV3 sandbox CSP is `script-src 'self'`, so a remote
 * `<script src="https://…cdn…">` is blocked. The library therefore has to live
 * inside the extension package. This script is the BUILD-TIME step that pulls it
 * in from `ADVANCED_CHART_LIBRARY_URL` (mirrors mobile's `MM_CHARTING_LIBRARY_URL`).
 *
 * It is intentionally OPT-IN — it is NOT wired into the default build, so CI and
 * offline builds never hit the network. Run it manually:
 *
 *   yarn advanced-chart:fetch-lib
 *
 * REALITY CHECK: the CDN base almost certainly does NOT allow directory listing,
 * and the library is a tree of files (`charting_library.js` + hashed chunk
 * bundles + static assets) whose names are referenced from inside the built JS.
 * A blind recursive download is impossible, so this script does a best-effort
 * closure crawl: fetch the entry file(s), parse them for referenced same-origin
 * asset paths, fetch those, and iterate. If the CDN blocks enumeration the crawl
 * simply reports what it could and could not retrieve — it never fabricates a
 * "complete" vendor.
 *
 * Source of the base URL (first match wins):
 *   1. process.env.ADVANCED_CHART_LIBRARY_URL
 *   2. ADVANCED_CHART_LIBRARY_URL in .metamaskrc
 *   3. DEFAULT_LIBRARY_URL below (kept in sync with builds.yml)
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseEnv } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../..');
const TARGET_DIR = join(REPO_ROOT, 'app/advanced-chart/lib');

/**
 * Default base URL — MUST stay in sync with `ADVANCED_CHART_LIBRARY_URL` in
 * builds.yml. Same v30.1.0 the mobile app pins.
 */
const DEFAULT_LIBRARY_URL =
  'https://charting-assets.static.metamask.io/tradingview/advanced-charts/v30.1.0/';

/** Entry files to seed the crawl with, relative to the base URL. */
const ENTRY_FILES = ['charting_library.js', 'charting_library.standalone.js'];

/**
 * TradingView localizes its lazy chunks via a `__LANG__` placeholder in the
 * built chunk names (e.g. `__LANG__.938.<hash>.js`). The literal `__LANG__` URL
 * does NOT exist on the CDN — the library substitutes the active locale at
 * runtime. We can only vendor the locales we enumerate here. Keep it minimal:
 * English by default (the widget's default locale). Override with a
 * comma-separated `ADVANCED_CHART_LOCALES` (e.g. `en,de,fr`).
 */
const LOCALES = (process.env.ADVANCED_CHART_LOCALES || 'en')
  .split(',')
  .map((locale) => locale.trim())
  .filter(Boolean);

const LANG_PLACEHOLDER = '__LANG__';

/** Safety caps so a runaway crawl can't hammer the CDN or fill the disk. */
const MAX_FILES = 2000;

/** Extensions we treat as "text we should parse for further references". */
const PARSEABLE_EXT = new Set(['.js', '.mjs', '.css', '.html', '.json']);

/**
 * Resolve the configured base URL from env / .metamaskrc / default.
 *
 * @returns {string} The base URL, guaranteed to end with a trailing slash.
 */
function resolveBaseUrl() {
  let value = process.env.ADVANCED_CHART_LIBRARY_URL;
  if (!value) {
    const rcPath = join(REPO_ROOT, '.metamaskrc');
    if (existsSync(rcPath)) {
      try {
        const rc = parseEnv(readFileSync(rcPath, 'utf8'));
        value = rc.ADVANCED_CHART_LIBRARY_URL;
      } catch {
        // ignore malformed .metamaskrc — fall through to default
      }
    }
  }
  value = value || DEFAULT_LIBRARY_URL;
  return value.endsWith('/') ? value : `${value}/`;
}

/** Asset extensions we recognise as fetchable references. */
const ASSET_EXT_RE =
  /\.(?:js|mjs|css|html|json|wasm|woff2?|ttf|otf|eot|png|svg|gif|jpe?g|ico|cur|bin)$/iu;

/**
 * Normalise a base-relative path (collapse `./`, resolve `../`, drop leading `/`).
 *
 * @param {string} path - A path to normalise.
 * @returns {string} The normalised base-relative path.
 */
function normalizePath(path) {
  const parts = [];
  for (const segment of path.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') parts.pop();
    else parts.push(segment);
  }
  return parts.join('/');
}

/**
 * Extract candidate same-origin asset paths referenced from a text file,
 * resolved to base-relative paths.
 *
 * Two reference styles are handled with DIFFERENT resolution roots:
 *   - JS quoted string literals (chunk names) are resolved against the library
 *     `publicPath` (the base URL) — that's how the webpack runtime loads them.
 *   - CSS `url(...)` references are resolved against the CSS file's own
 *     directory — that's how the browser resolves them.
 *
 * Only statically-written paths can be seen; anything the library builds at
 * runtime from variables is invisible (the fundamental limitation).
 *
 * @param {string} text - File contents.
 * @param {string} fromRelPath - Base-relative path of the file being parsed.
 * @returns {string[]} Base-relative asset paths referenced by the file.
 */
function extractReferences(text, fromRelPath) {
  const found = new Set();

  const consider = (rawRef, root) => {
    let ref = rawRef.trim().replace(/^['"]|['"]$/gu, '');
    if (
      !ref ||
      ref.startsWith('http') ||
      ref.startsWith('//') ||
      ref.startsWith('data:') ||
      ref.startsWith('#') ||
      !ASSET_EXT_RE.test(ref)
    ) {
      return;
    }
    // Skip bare suffix fragments the library uses to *build* names in code
    // (e.g. ".rtl.css") rather than real standalone files.
    if (ref.startsWith('.') && !ref.startsWith('./')) {
      return;
    }
    const resolved = normalizePath(root ? `${root}/${ref}` : ref);
    if (resolved) {
      found.add(resolved);
    }
  };

  // JS-style quoted references → resolved against the base URL (publicPath).
  const quotedRe =
    /["'`]([\w./-]+\.(?:js|mjs|css|html|json|wasm|woff2?|ttf|otf|eot|png|svg|gif|jpe?g|ico|cur|bin))["'`]/giu;
  let match;
  while ((match = quotedRe.exec(text)) !== null) {
    consider(match[1], '');
  }

  // CSS `url(...)` references → resolved against the CSS file's directory.
  const dir = fromRelPath.includes('/')
    ? fromRelPath.slice(0, fromRelPath.lastIndexOf('/'))
    : '';
  const urlRe = /url\(\s*(['"]?)([^)'"]+)\1\s*\)/giu;
  while ((match = urlRe.exec(text)) !== null) {
    consider(match[2], dir);
  }

  return [...found];
}

/**
 * Turn a raw reference into 0+ concrete, fetchable relative paths.
 *
 * Handles two things the raw string can't express directly:
 *   - lazy chunks live under `bundles/` even when referenced bare by id;
 *   - `__LANG__` chunks must be expanded to each configured locale.
 *
 * @param {string} ref - A raw reference extracted from a file.
 * @returns {string[]} Concrete relative paths to attempt.
 */
function expandReference(ref) {
  if (!ref.includes(LANG_PLACEHOLDER)) {
    return [ref];
  }
  // Localized chunks are always served from the `bundles/` public path.
  const base = ref.startsWith('bundles/') ? ref : `bundles/${ref}`;
  return LOCALES.map((locale) => base.split(LANG_PLACEHOLDER).join(locale));
}

/**
 * Fetch a single URL and, if OK, write it under TARGET_DIR at `relPath`.
 *
 * @param {string} baseUrl - The configured base URL.
 * @param {string} relPath - Path relative to the base URL.
 * @returns {Promise<{ ok: boolean, status: number, bytes: number, text: string | null, relPath: string }>}
 */
async function fetchAndSave(baseUrl, relPath) {
  const url = new URL(relPath, baseUrl).toString();
  let status = 0;
  try {
    const res = await fetch(url);
    status = res.status;
    if (!res.ok) {
      return { ok: false, status, bytes: 0, text: null, relPath };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const dest = join(TARGET_DIR, relPath);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, buf);
    const ext = relPath.slice(relPath.lastIndexOf('.')).toLowerCase();
    const text = PARSEABLE_EXT.has(ext) ? buf.toString('utf8') : null;
    return { ok: true, status, bytes: buf.length, text, relPath };
  } catch (error) {
    console.error(`  ! network error for ${url}: ${String(error)}`);
    return { ok: false, status, bytes: 0, text: null, relPath };
  }
}

async function main() {
  const baseUrl = resolveBaseUrl();
  console.log('Advanced Chart library vendoring');
  console.log(`  source : ${baseUrl}`);
  console.log(`  target : ${TARGET_DIR}`);
  console.log(`  locales: ${LOCALES.join(', ')}`);
  console.log('');

  mkdirSync(TARGET_DIR, { recursive: true });

  /** @type {Set<string>} */
  const queued = new Set();
  /** @type {string[]} */
  const queue = [];
  const enqueue = (relPath) => {
    if (!queued.has(relPath) && queue.length + queued.size < MAX_FILES) {
      queued.add(relPath);
      queue.push(relPath);
    }
  };

  ENTRY_FILES.forEach(enqueue);

  const saved = [];
  const failed = [];
  let anyEntry = false;

  while (queue.length > 0) {
    const relPath = queue.shift();
    const result = await fetchAndSave(baseUrl, relPath);
    if (result.ok) {
      saved.push({ relPath, bytes: result.bytes });
      if (ENTRY_FILES.includes(relPath)) {
        anyEntry = true;
      }
      console.log(`  ✓ ${result.status} ${relPath} (${result.bytes} bytes)`);
      if (result.text) {
        extractReferences(result.text, relPath).forEach((ref) => {
          expandReference(ref).forEach(enqueue);
        });
      }
    } else {
      // Missing entry files are expected (only one of the entry variants may
      // exist); only record real "referenced but missing" failures loudly.
      failed.push({ relPath, status: result.status });
      const known = ENTRY_FILES.includes(relPath) ? ' (entry candidate)' : '';
      console.log(`  ✗ ${result.status || 'ERR'} ${relPath}${known}`);
    }
  }

  console.log('');
  console.log('Summary');
  console.log(`  files saved   : ${saved.length}`);
  console.log(`  bytes saved   : ${saved.reduce((n, f) => n + f.bytes, 0)}`);
  console.log(`  fetch failures: ${failed.length}`);

  if (!anyEntry) {
    console.error('');
    console.error(
      'FAILED: could not retrieve any entry file (charting_library.js / ' +
        'charting_library.standalone.js). The CDN likely does not serve the ' +
        'library at this base URL or blocks enumeration. The proprietary ' +
        'TradingView distribution must be obtained from the private package / a ' +
        'full directory mirror. Nothing complete was vendored.',
    );
    process.exitCode = 1;
    return;
  }

  if (failed.length > 0) {
    console.warn('');
    console.warn(
      `WARNING: ${failed.length} referenced asset(s) could not be fetched. The ` +
        'vendored set may be INCOMPLETE (the library also builds some asset ' +
        'URLs dynamically, which cannot be resolved statically). Verify a real ' +
        'render before relying on this vendor.',
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
