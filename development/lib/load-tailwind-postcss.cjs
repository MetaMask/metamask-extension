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
 * @returns {import('@tailwindcss/postcss').default}
 */
const { createRequire } = require('node:module');
const { join } = require('node:path');

const requireFromHere = createRequire(__filename);

module.exports = requireFromHere(
  join(__dirname, '../../node_modules/@tailwindcss/postcss/dist/index.js'),
);
