import { defineConfig, type Plugin } from 'vitest/config';
import path from 'path';
import { jestCompatPlugin } from './test/vitest-jest-compat-plugin';

/**
 * Many legacy .js files in this repo contain JSX but use .js extension.
 * Vite 8's oxc transform only enables JSX parsing for .jsx/.tsx extensions.
 * This plugin intercepts non-node_modules .js files containing '<' and
 * re-parses them as .jsx via oxc.
 */
function jsxInJsFiles(): Plugin {
  return {
    name: 'jsx-in-js-files',
    enforce: 'pre',
    async transform(code, id) {
      if (
        !id.endsWith('.js') ||
        id.includes('node_modules') ||
        !code.includes('<')
      ) {
        return null;
      }
      const { transformWithOxc } = await import('vite');
      const result = await transformWithOxc(code, id + 'x', {
        jsx: 'automatic',
      });
      return { code: result.code, map: result.map };
    },
  };
}

/**
 * Some @metamask packages use the deprecated `import ... assert { type: "json" }`
 * syntax which Node 24 no longer supports. This rewrites it to `import ... with`.
 */
function fixImportAssert(): Plugin {
  return {
    name: 'fix-import-assert',
    enforce: 'pre',
    transform(code, _id) {
      if (!code.includes(' assert {') && !code.includes(' assert{'))
        return null;
      return {
        code: code.replace(
          /\bimport\b(.+?)\bassert\s*\{/g,
          'import$1with {',
        ),
        map: null,
      };
    },
  };
}

export default defineConfig({
  plugins: [jestCompatPlugin(), jsxInJsFiles(), fixImportAssert()],
  resolve: {
    alias: {
      // uuid's ESM wrapper is broken when loaded natively by Node
      uuid: path.resolve(__dirname, 'node_modules/uuid/dist/esm-node/index.js'),
      // @radix-ui .mjs files import react/jsx-runtime without .js extension
      'react/jsx-runtime': path.resolve(
        __dirname,
        'node_modules/react/jsx-runtime.js',
      ),
      'react/jsx-dev-runtime': path.resolve(
        __dirname,
        'node_modules/react/jsx-dev-runtime.js',
      ),
      'lightweight-charts': path.resolve(
        __dirname,
        'test/mocks/lightweight-charts.js',
      ),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    restoreMocks: true,
    testTimeout: 5500,
    include: [
      'app/scripts/**/*.test.{js,ts,tsx}',
      'app/offscreen/**/*.test.{js,ts,tsx}',
      'shared/**/*.test.{js,ts,tsx}',
      'ui/**/*.test.{js,ts,tsx}',
      'development/**/*.test.{js,ts,tsx}',
      'test/unit-global/**/*.test.{js,ts,tsx}',
    ],
    exclude: ['development/webpack/**', 'node_modules/**'],
    setupFiles: ['./test/setup-vitest.ts', './test/env.js'],
    coverage: {
      provider: 'v8',
      include: [
        'app/scripts/**/*.{js,ts,tsx}',
        'shared/**/*.{js,ts,tsx}',
        'ui/**/*.{js,ts,tsx}',
      ],
      exclude: ['**/*.stories.*', '**/*.snap'],
      reportsDirectory: './coverage/unit-vitest',
      reporter: ['html', 'json'],
    },
    server: {
      deps: {
        inline: [
          '@metamask/smart-transactions-controller',
          /@radix-ui/,
          /@metamask\/design-system-react/,
        ],
      },
    },
  },
});
