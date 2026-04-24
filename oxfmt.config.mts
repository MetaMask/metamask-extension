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
    '/app/images/animations/**/*.json',
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
    '/test/e2e/tests/metrics/marketing-cookieid-mock-page/index.html',
    '/test/e2e/tests/phishing-controller/mock-page-with-disallowed-iframe/index.html',
    '/test/e2e/tests/phishing-controller/mock-page-with-iframe-but-disable-early-detection/index.html',
    '/test/e2e/tests/phishing-controller/mock-page-with-iframe/index.html',
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
