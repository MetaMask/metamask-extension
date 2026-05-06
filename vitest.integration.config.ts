import { defineConfig } from 'vitest/config';
// eslint-disable-next-line import-x/no-extraneous-dependencies
import { transformWithEsbuild } from 'vite';
import {
  createHoistJestMockPlugin,
  createAsyncRelativeRequireActualPlugin,
  createTopLevelRequireToImportPlugin,
} from './test/vitest/plugins';

export default defineConfig({
  plugins: [
    createHoistJestMockPlugin(),
    createAsyncRelativeRequireActualPlugin(),
    createTopLevelRequireToImportPlugin(),
    {
      name: 'jsx-in-js',
      enforce: 'pre',
      async transform(code, id) {
        if (!id.endsWith('.js') || id.includes('node_modules')) {
          return;
        }
        const normalizedCode = code.startsWith('#!')
          ? `//${code.slice(2)}`
          : code;
        return transformWithEsbuild(normalizedCode, id, {
          loader: 'jsx',
          jsx: 'automatic',
        });
      },
    },
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    restoreMocks: true,
    maxWorkers: 1,
    testTimeout: 15000,

    include: ['test/integration/**/*.test.{js,ts,tsx}'],

    setupFiles: [
      'test/vitest-compat.ts',
      'test/vitest/integration-setup-before.ts',
      'test/integration/config/setup.js',
      'test/integration/config/env.js',
      'test/vitest/integration-setup-after.ts',
    ],

    coverage: {
      include: ['shared/**/*.{js,ts,tsx}', 'ui/**/*.{js,ts,tsx}'],
    },

    alias: {
      '@jest/globals': new URL(
        './test/vitest/jest-globals.ts',
        import.meta.url,
      ).pathname,
    },

    server: {
      deps: {
        inline: [
          '@metamask/design-system-react',
          '@metamask/smart-transactions-controller',
          '@lavamoat/lavadome-react',
          '@lavamoat/lavadome-core',
        ],
      },
    },

    environmentOptions: {
      jsdom: {
        url: 'http://localhost/',
      },
      customExportConditions: ['node', 'node-addons'],
    },
  },
});
