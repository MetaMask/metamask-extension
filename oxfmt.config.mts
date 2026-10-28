import { defineConfig } from 'oxfmt';
import os from 'os';

export default defineConfig({
  ignorePatterns: [
    '**/*.json',
    '*.scss',
    '/.yarn/',
    '/app/html/partials/partial-head.html',
    '/app/scripts/lib/ppom/ppom.js',
    '/app/vendor/',
    '/CHANGELOG*.md',
    '/development/chromereload.js',
    '/development/circular-deps.jsonc',
    '/test/e2e/send-eth-with-private-key-test/',
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
