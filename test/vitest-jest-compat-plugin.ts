/**
 * Vite plugin that transforms Jest API calls to Vitest equivalents at
 * compile time, BEFORE Vitest's static analysis hoists `vi.mock()` calls.
 *
 * Key challenge: `jest.requireActual()` is synchronous in Jest but maps
 * to the async `vi.importActual()` in Vitest. When used as
 * `...jest.requireActual('x')` inside a `jest.mock` factory, this plugin
 * transforms it to `...(await vi.importActual('x'))` and makes the factory
 * async.
 */
import type { Plugin } from 'vite';

const SIMPLE_REPLACEMENTS: [RegExp, string][] = [
  [/\bjest\.fn\b/g, 'vi.fn'],
  [/\bjest\.spyOn\b/g, 'vi.spyOn'],
  [/\bjest\.mocked\b/g, 'vi.mocked'],
  [/\bjest\.clearAllMocks\b/g, 'vi.clearAllMocks'],
  [/\bjest\.resetAllMocks\b/g, 'vi.resetAllMocks'],
  [/\bjest\.restoreAllMocks\b/g, 'vi.restoreAllMocks'],
  [/\bjest\.useFakeTimers\b/g, 'vi.useFakeTimers'],
  [/\bjest\.useRealTimers\b/g, 'vi.useRealTimers'],
  [/\bjest\.advanceTimersByTime\b/g, 'vi.advanceTimersByTime'],
  [/\bjest\.advanceTimersByTimeAsync\b/g, 'vi.advanceTimersByTimeAsync'],
  [/\bjest\.advanceTimersToNextTimer\b/g, 'vi.advanceTimersToNextTimer'],
  [/\bjest\.advanceTimersToNextTimerAsync\b/g, 'vi.advanceTimersToNextTimerAsync'],
  [/\bjest\.runAllTimers\b/g, 'vi.runAllTimers'],
  [/\bjest\.runAllTimersAsync\b/g, 'vi.runAllTimersAsync'],
  [/\bjest\.runOnlyPendingTimers\b/g, 'vi.runOnlyPendingTimers'],
  [/\bjest\.runOnlyPendingTimersAsync\b/g, 'vi.runOnlyPendingTimersAsync'],
  [/\bjest\.setSystemTime\b/g, 'vi.setSystemTime'],
  [/\bjest\.getRealSystemTime\b/g, 'vi.getRealSystemTime'],
  [/\bjest\.getTimerCount\b/g, 'vi.getTimerCount'],
  [/\bjest\.isMockFunction\b/g, 'vi.isMockFunction'],
  [/\bjest\.unmock\b/g, 'vi.unmock'],
  [/\bjest\.doMock\b/g, 'vi.doMock'],
  [/\bjest\.doUnmock\b/g, 'vi.doUnmock'],
  [/@jest-environment\b/g, '@vitest-environment'],
  [/from\s+['"]@jest\/globals['"]/g, "from 'vitest'"],
];

export function jestCompatPlugin(): Plugin {
  return {
    name: 'vitest-jest-compat',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('node_modules')) return null;
      if (
        !code.includes('jest.') &&
        !code.includes('jest-environment') &&
        !code.includes('@jest/globals')
      ) {
        return null;
      }

      let transformed = code;

      // Transform `jest.mock('module', () => ({ ...jest.requireActual('module'), ... }))`
      // into `vi.mock('module', async () => ({ ...(await vi.importActual('module')), ... }))`
      //
      // Step 1: Replace jest.requireActual → (await vi.importActual)
      transformed = transformed.replace(
        /\bjest\.requireActual\s*\(/g,
        '(await vi.importActual(',
      );
      // Close the extra paren: requireActual('x') → (await vi.importActual('x'))
      // We need to find the matching closing paren after importActual( and add )
      // Simple approach: jest.requireActual('x') becomes (await vi.importActual('x'))
      // The replace above gives us `(await vi.importActual('x')` — need closing )
      // Actually since requireActual('x') has its own closing paren, we get:
      //   (await vi.importActual('x')  <-- missing closing )
      // Let's use a more precise regex:
      transformed = transformed.replace(
        /\(await vi\.importActual\(([^)]+)\)/g,
        '(await vi.importActual($1))',
      );

      // Step 2: Make mock factories async if they contain `await`
      // Pattern: jest.mock('x', () => { ... await ... })
      // or: jest.mock('x', () => ({ ... await ... }))
      // We need to replace the `() =>` with `async () =>`
      // This is tricky with regex alone, but for the common pattern:
      transformed = transformed.replace(
        /\bjest\.mock\s*\(\s*(['"][^'"]+['"]),\s*\(\)\s*=>/g,
        (match, modulePath) => {
          // Check if the factory body contains `await`
          // Find the factory body by looking ahead
          const factoryStart = transformed.indexOf(match);
          const afterArrow = factoryStart + match.length;
          const restOfCode = transformed.substring(afterArrow);
          // Simple heuristic: if there's an `await` before the next `jest.mock` or end of line
          // with a reasonable scope, make it async
          if (restOfCode.substring(0, 500).includes('await vi.importActual')) {
            return `vi.mock(${modulePath}, async () =>`;
          }
          return `vi.mock(${modulePath}, () =>`;
        },
      );

      // Step 3: Handle remaining jest.mock without requireActual
      transformed = transformed.replace(/\bjest\.mock\b/g, 'vi.mock');

      // Step 4: Handle jest.requireMock
      transformed = transformed.replace(
        /\bjest\.requireMock\s*\(/g,
        '(await vi.importMock(',
      );
      transformed = transformed.replace(
        /\(await vi\.importMock\(([^)]+)\)/g,
        '(await vi.importMock($1))',
      );

      // Step 5: Apply simple replacements
      for (const [pattern, replacement] of SIMPLE_REPLACEMENTS) {
        transformed = transformed.replace(pattern, replacement);
      }

      if (transformed === code) return null;

      return { code: transformed, map: null };
    },
  };
}
