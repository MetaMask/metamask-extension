// Bridge module to load Tailwind's PostCSS plugin in environments where
// direct package resolution must remain under LavaMoat's control.
// Consumers should require this file via a filesystem path.
//
// Usage:
//   const loadTailwindPostcss = require('../development/lib/load-tailwind-postcss.cjs');
//   const plugin = loadTailwindPostcss({ base: repoRoot });
//
'use strict';

/**
 * Loads and configures the Tailwind v4 PostCSS integration.
 *
 * @param {object} [options]
 * @returns {import('postcss').Plugin}
 */
module.exports = function loadTailwindPostcss(options = {}) {
  // NOTE: Use normal require so LavaMoat can apply policy controls.
  // Avoid createRequire here.
  // eslint-disable-next-line global-require
  const tailwindPostcss = require('@tailwindcss/postcss');
  return tailwindPostcss(options);
};

