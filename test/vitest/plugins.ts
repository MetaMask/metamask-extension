/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck Vitest transform plugins depend on Vite's ESM-only plugin types.
import type { PluginOption } from 'vite';

export function createHoistJestMockPlugin(): PluginOption {
  return {
    name: 'hoist-jest-mock',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('node_modules')) {
        return;
      }

      const codeWithoutLineComments = code.replace(/\/\/[^\n]*/gu, '');
      const hasMock = /\bjest\s*\.\s*(mock|unmock|hoisted)\s*\(/u.test(
        codeWithoutLineComments,
      );
      if (!hasMock) {
        return;
      }

      const replaced = code
        .replace(/\bjest\s*\.\s*mock\s*\(/gu, 'vi.mock(')
        .replace(/\bjest\s*\.\s*unmock\s*\(/gu, 'vi.unmock(')
        .replace(/\bjest\s*\.\s*hoisted\s*\(/gu, 'vi.hoisted(');

      const isTestFile = /\.(test|spec)\.[jt]sx?$/u.test(id);
      if (!isTestFile) {
        return replaced;
      }

      const caller = JSON.stringify(id.split('?')[0]);
      const preamble = `
const __vitest_jest_compat__ = vi.hoisted(() => {
  const _caller = ${caller};
  const _orig = vi.mock.bind(vi);
  vi.mock = function(path, factory, opts) {
    if (typeof factory !== 'function') return _orig(path, factory, opts);
    if (typeof path === 'string') {
      if (globalThis.__vitest_cjs_mock_register__) {
        globalThis.__vitest_cjs_mock_register__(_caller, path, factory);
      } else {
        (globalThis.__vitest_cjs_mock_pending__ ??= []).push([
          _caller,
          path,
          factory,
        ]);
      }
    }
    return _orig(path, function() {
      const _r = factory();
      const normalize = (val) => {
        if (typeof val === 'function') {
          return { __esModule: true, default: val };
        }
        if (val !== null && typeof val !== 'object') {
          return { __esModule: true, default: val };
        }
        if (val && typeof val === 'object' && !('default' in val)) {
          Object.defineProperty(val, 'default', {
            get() {
              return val;
            },
            enumerable: false,
            configurable: true,
          });
        }
        return val;
      };
      if (_r && typeof _r.then === 'function') {
        return _r.then(normalize);
      }
      return normalize(_r);
    }, opts);
  };
});
`;
      return preamble + replaced;
    },
  };
}

export function createAsyncRelativeRequireActualPlugin(): PluginOption {
  return {
    name: 'async-relative-require-actual',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('node_modules')) {
        return;
      }
      if (!/\.(test|spec)\.[jt]sx?$/u.test(id)) {
        return;
      }
      const codeWithoutLineComments = code.replace(/\/\/[^\n]*/gu, '');
      if (
        !/\bjest\s*\.\s*requireActual\s*\(\s*['"]\.\.?\//u.test(
          codeWithoutLineComments,
        )
      ) {
        return;
      }
      let out = code.replace(
        /\bjest\s*\.\s*requireActual\s*\(\s*(['"])((?:\.\.?\/)[^'"]*)\1/gu,
        'await jest.requireActual($1$2$1',
      );
      out = out.replace(
        /(\bjest\.mock\([^,]+),\s*\(\)\s*=>/gu,
        '$1, async () =>',
      );
      out = out.replace(
        /(\bvi\.mock\([^,]+),\s*\(\)\s*=>/gu,
        '$1, async () =>',
      );
      return out;
    },
  };
}

export function createTopLevelRequireToImportPlugin(): PluginOption {
  return {
    name: 'top-level-require-to-import',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('node_modules')) {
        return;
      }
      const shouldTransformCjsSource = [
        '/development/build/transforms/remove-fenced-code.js',
        '/test/e2e/helpers.js',
        '/test/e2e/seeder/anvil-seeder.js',
        '/test/e2e/seeder/smart-contracts.js',
        '/test/e2e/webdriver/chrome.js',
        '/test/e2e/webdriver/driver.js',
        '/test/e2e/webdriver/firefox.js',
        '/test/e2e/webdriver/index.js',
      ].some((sourcePath) => id.endsWith(sourcePath));
      const shouldTransformDestructuredCjsSource = [
        '/test/e2e/mock-e2e.js',
      ].some((sourcePath) => id.endsWith(sourcePath));
      const shouldTransformStaticServerRequire = code.includes(
        'development/create-static-server',
      );
      const shouldTransformDeepLinksTestRoute = id.endsWith(
        '/shared/lib/deep-links/routes/index.ts',
      );
      const shouldTransformMigrationsIndex = id.endsWith(
        '/app/scripts/migrations/index.js',
      );
      const shouldTransformOAuthConstantsRequire = id.endsWith(
        '/app/scripts/services/oauth/oauth-service.ts',
      );
      if (
        !/\.(test|spec)\.[jt]sx?$/u.test(id) &&
        !shouldTransformCjsSource &&
        !shouldTransformDestructuredCjsSource &&
        !shouldTransformStaticServerRequire &&
        !shouldTransformDeepLinksTestRoute &&
        !shouldTransformMigrationsIndex &&
        !shouldTransformOAuthConstantsRequire
      ) {
        return;
      }
      if (
        !shouldTransformCjsSource &&
        !shouldTransformDestructuredCjsSource &&
        !shouldTransformStaticServerRequire &&
        !shouldTransformDeepLinksTestRoute &&
        !shouldTransformMigrationsIndex &&
        !shouldTransformOAuthConstantsRequire &&
        !/^\s*(?:jest|vi)\s*\.\s*mock\s*\(/mu.test(code)
      ) {
        return;
      }
      if (shouldTransformDeepLinksTestRoute) {
        return code.replace(
          "addRoute(require('./test-route').test);",
          "addRoute((await import('./test-route')).test);",
        );
      }
      if (shouldTransformOAuthConstantsRequire) {
        return code.replace(
          "require('../../../../test/e2e/constants')",
          "await import('../../../../test/e2e/constants')",
        );
      }
      if (shouldTransformMigrationsIndex) {
        return code
          .replace(
            /require\((['"]\.\/\d+(?:\.\d+)?['"])\)\.default/gu,
            '(await import($1)).default',
          )
          .replace(
            /require\((['"]\.\/\d+(?:\.\d+)?['"])\)/gu,
            'await import($1)',
          );
      }
      const withDestructuredRequires = code.replace(
        /^(const|let|var)\s+(\{[\s\S]*?\})\s*=\s*require\(\s*(['"][^'"]+['"])\s*\);?/gmu,
        '$1 $2 = await import($3);',
      );

      if (shouldTransformStaticServerRequire && !shouldTransformCjsSource) {
        return withDestructuredRequires.replace(
          /^const createStaticServer = require\((['"][^'"]*development\/create-static-server['"])\);?/mu,
          'const { default: createStaticServer } = await import($1);',
        );
      }

      if (shouldTransformDestructuredCjsSource) {
        return withDestructuredRequires;
      }

      if (shouldTransformCjsSource) {
        return withDestructuredRequires
          .replace(
            /^(const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*require\(\s*(['"][^'"]+['"])\s*\)\.default;?/gmu,
            '$1 { default: $2 } = await import($3);',
          )
          .replace(
            /^(const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*require\(\s*(['"][^'"]+['"])\s*\);?/gmu,
            '$1 { default: $2 } = await import($3);',
          );
      }

      return withDestructuredRequires.replace(
        /^(const|let|var)\s+([^=\n]+?)\s*=\s*require\(\s*(['"][^'"]+['"])\s*\);?/gmu,
        '$1 $2 = await import($3);',
      );
    },
  };
}
