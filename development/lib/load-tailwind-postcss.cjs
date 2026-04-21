const { join } = require('path');
const tailwindPostcss = require('@tailwindcss/postcss');

// Pin Tailwind's source-detection base to the repo root so explicit
// @source entries in `ui/css/tailwind.css` resolve consistently across
// different build environments (webpack, gulp, storybook).
const repoRoot = join(__dirname, '..', '..');

module.exports = function loadTailwindPostcss(options = {}) {
  return tailwindPostcss({ base: repoRoot, ...options });
};

