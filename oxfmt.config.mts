import { defineConfig } from 'oxfmt';
import os from 'os';

export default defineConfig({
  ignorePatterns: [
    '**/*.json',
    '*.scss',
    '/.github/',
    '/.nyc_output/',
    '/.storybook/',
    '/.yarn/',
    '/app/html/partials/partial-head.html',
    '/app/scripts/**/*-method-action-types.ts',
    '/app/scripts/lib/ppom/ppom.js',
    '/app/vendor/',
    '/builds/',
    '/CHANGELOG*.md',
    '/changed-files/',
    '/coverage/',
    '/development/chromereload.js',
    '/development/circular-deps.jsonc',
    '/development/ts-migration-dashboard/build/**',
    '/dist/',
    '/node_modules/',
    '/storybook-build/',
    '/test-artifacts/',
    '/test/e2e/send-eth-with-private-key-test/',
    '/test/test-results/',
  ],
  printWidth: 80,
  singleQuote: true,
  sortPackageJson: false,
  endOfLine: os.platform() === 'win32' ? 'crlf' : 'lf',
  overrides: [
    {
      files: ['*.jsonc'],
      options: {
        trailingComma: 'none',
      },
    },
  ],
});
