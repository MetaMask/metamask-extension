/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck Vitest config imports ESM-only tooling from a CJS-typed project.
import { defineConfig } from 'vitest/config';
// eslint-disable-next-line import-x/no-extraneous-dependencies
import { transformWithEsbuild } from 'vite';
import {
  createHoistJestMockPlugin,
  createAsyncRelativeRequireActualPlugin,
  createTopLevelRequireToImportPlugin,
} from './test/vitest/plugins';

export default defineConfig({
  resolve: {
    alias: {
      '@ledgerhq/hw-transport/lib-es/Transport.js': new URL(
        './node_modules/@ledgerhq/hw-transport/lib/Transport.js',
        import.meta.url,
      ).pathname,
      '@ledgerhq/hw-transport': new URL(
        './node_modules/@ledgerhq/hw-transport/lib/Transport.js',
        import.meta.url,
      ).pathname,
      '@ledgerhq/hw-transport-webhid': new URL(
        './node_modules/@ledgerhq/hw-transport-webhid/lib/TransportWebHID.js',
        import.meta.url,
      ).pathname,
    },
  },
  plugins: [
    {
      name: 'ledger-transport-cjs',
      enforce: 'pre',
      resolveId(id) {
        if (id.includes('@ledgerhq/hw-transport/lib-es/Transport.js')) {
          return id.replace('/lib-es/', '/lib/');
        }
      },
    },
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
    maxWorkers: 2,
    vmMemoryLimit: '1GB',
    testTimeout: 5500,

    include: [
      'app/scripts/**/*.test.{js,ts,tsx}',
      'app/offscreen/**/*.test.{js,ts,tsx}',
      'shared/**/*.test.{js,ts,tsx}',
      'ui/**/*.test.{js,ts,tsx}',
      'development/**/*.test.{js,ts,tsx}',
      'test/unit-global/**/*.test.{js,ts,tsx}',
      'test/e2e/helpers.test.js',
      'test/e2e/helpers/**/*.test.{js,ts,tsx}',
      'test/e2e/benchmarks/**/*.test.{js,ts,tsx}',
      'test/e2e/feature-flags/**/*.test.{js,ts,tsx}',
      'test/e2e/playwright/llm-workflow/**/*.test.{js,ts,tsx}',
    ],
    exclude: [
      'development/webpack/**',
      'development/build/transforms/utils.test.js',
      'test/e2e/playwright/llm-workflow/capabilities/factory.test.ts',
    ],

    setupFiles: [
      'test/vitest-compat.ts',
      'jest-canvas-mock',
      'test/vitest/setup-before.ts',
      'test/env.js',
      'test/vitest/setup-after.ts',
    ],

    coverage: {
      include: [
        'app/scripts/**/*.{js,ts,tsx}',
        'app/offscreen/**/*.{js,ts,tsx}',
        'shared/**/*.{js,ts,tsx}',
        'ui/**/*.{js,ts,tsx}',
        'development/build/transforms/**/*.js',
        'development/metamaskbot-build-announce/**/*.{js,ts}',
      ],
      exclude: ['**/*.stories.*', '**/*.snap'],
      reportsDirectory: './coverage/unit',
      reporter: ['html', 'json'],
    },

    deps: {
      optimizer: {
        web: {
          enabled: true,
          include: ['@ledgerhq/hw-transport', '@ledgerhq/hw-transport-webhid'],
        },
      },
    },

    alias: {
      '@jest/globals': new URL('./test/vitest/jest-globals.ts', import.meta.url)
        .pathname,
      'lightweight-charts': new URL(
        './test/mocks/lightweight-charts.js',
        import.meta.url,
      ).pathname,
      '@ledgerhq/hw-transport': new URL(
        './node_modules/@ledgerhq/hw-transport/lib/Transport.js',
        import.meta.url,
      ).pathname,
      '@ledgerhq/hw-transport-webhid': new URL(
        './node_modules/@ledgerhq/hw-transport-webhid/lib/TransportWebHID.js',
        import.meta.url,
      ).pathname,
    },

    pool: 'vmForks',

    server: {
      deps: {
        fallbackCJS: true,
        external: ['@ledgerhq/hw-transport', '@ledgerhq/hw-transport-webhid'],
        inline: [
          '@metamask/design-system-react',
          '@metamask/smart-transactions-controller',
          '@ledgerhq/hw-transport',
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
