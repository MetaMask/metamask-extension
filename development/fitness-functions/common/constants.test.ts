import { E2E_TESTS_REGEX, JS_REGEX } from './constants';

describe('Regular Expressions used in Fitness Functions', (): void => {
  describe(`E2E_TESTS_REGEX "${E2E_TESTS_REGEX}"`, (): void => {
    const PATHS_IT_SHOULD_MATCH = [
      // JS, TS, JSX, and TSX files inside the
      // test/e2e directory
      'test/e2e/file.js',
      'test/e2e/path/file.ts',
      'test/e2e/much/longer/path/file.jsx',
      'test/e2e/much/longer/path/file.tsx',
      // development/fitness-functions directory
      'development/fitness-functions/file.js',
      'development/fitness-functions/path/file.ts',
      'development/fitness-functions/much/longer/path/file.jsx',
      'development/fitness-functions/much/longer/path/file.tsx',
      // development/webpack directory
      'development/webpack/file.js',
      'development/webpack/path/file.ts',
      'development/webpack/much/longer/path/file.jsx',
      'development/webpack/much/longer/path/file.tsx',
    ];

    const PATHS_IT_SHOULD_NOT_MATCH = [
      // any files without JS, TS, JSX or TSX extension
      'file',
      'file.extension',
      'path/file.extension',
      'much/longer/path/file.extension',
      // JS, TS, JSX, and TSX files outside
      // the test/e2e, development/fitness-functions, development/webpack directories
      'file.js',
      'path/file.js',
      'much/longer/path/file.js',
      'file.ts',
      'path/file.ts',
      'much/longer/path/file.ts',
      'file.jsx',
      'path/file.jsx',
      'much/longer/path/file.jsx',
      'file.tsx',
      'path/file.tsx',
      'much/longer/path/file.tsx',
    ];

    describe('included paths', (): void => {
      PATHS_IT_SHOULD_MATCH.forEach((path: string): void => {
        it(`should match "${path}"`, (): void => {
          const result = E2E_TESTS_REGEX.test(path);
          expect(result).toStrictEqual(true);
        });
      });
    });

    describe('excluded paths', (): void => {
      PATHS_IT_SHOULD_NOT_MATCH.forEach((path: string): void => {
        it(`should not match "${path}"`, (): void => {
          const result = E2E_TESTS_REGEX.test(path);
          expect(result).toStrictEqual(false);
        });
      });
    });
  });

  describe(`JS_REGEX "${JS_REGEX}"`, (): void => {
    const PATHS_IT_SHOULD_MATCH = [
      'app/much/longer/path/file.js',
      'app/much/longer/path/file.jsx',
      'offscreen/path/file.js',
      'offscreen/path/file.jsx',
      'shared/file.js',
      'shared/file.jsx',
      'ui/much/longer/path/file.js',
      'ui/much/longer/path/file.jsx',
    ];

    const PATHS_IT_SHOULD_NOT_MATCH = [
      // any without JS or JSX extension
      'file',
      'file.extension',
      'path/file.extension',
      'much/longer/path/file.extension',
      'file.ts',
      'path/file.ts',
      'much/longer/path/file.tsx',
      // any JS or JSX files outside the app, offscreen, shared, and ui directories
      'test/longer/path/file.js',
      'random/longer/path/file.jsx',
    ];

    describe('included paths', (): void => {
      PATHS_IT_SHOULD_MATCH.forEach((path: string): void => {
        it(`should match "${path}"`, (): void => {
          const result = JS_REGEX.test(path);
          expect(result).toStrictEqual(true);
        });
      });
    });

    describe('excluded paths', (): void => {
      PATHS_IT_SHOULD_NOT_MATCH.forEach((path: string): void => {
        it(`should not match "${path}"`, (): void => {
          const result = JS_REGEX.test(path);
          expect(result).toStrictEqual(false);
        });
      });
    });
  });
});
