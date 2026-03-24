'use strict';

/**
 * @file Compatibility loader for `@tailwindcss/postcss` under LavaMoat.
 *
 * `@tailwindcss/postcss` is published with only `package.json#exports` (no legacy
 * `main`). LavaMoat’s dependency scanner uses `resolve@1`, which does not resolve
 * that layout, so `require('@tailwindcss/postcss')` fails during
 * `yarn webpack:lavamoat:*` / policy generation.
 *
 * Node’s normal resolver handles `exports` correctly; this module is the single
 * place we bridge that gap. Prefer removing this file once LavaMoat resolves
 * modern package metadata or Tailwind publishes a `main` field.
 *
 * `@tailwindcss/postcss` defaults `base` to `process.cwd()`. Webpack and LavaMoat
 * can run with a cwd that is not the repo root, which breaks `@source` scanning
 * and yields missing preflight/utilities (broken extension UI). Pin `base` to the
 * repository root; callers may still override via options.
 *
 * @param {{ base?: string, optimize?: boolean | { minify?: boolean }, transformAssetUrls?: boolean }} [options]
 */
const { createRequire } = require('node:module');
const { join } = require('node:path');

const requireFromHere = createRequire(__filename);

const tailwindPostcss = requireFromHere(
  join(__dirname, '../../node_modules/@tailwindcss/postcss/dist/index.js'),
);

const repoRoot = join(__dirname, '../..');

module.exports = function loadTailwindPostcss(options = {}) {
  return tailwindPostcss({ base: repoRoot, ...options });
};
