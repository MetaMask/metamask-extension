/**
 * Vite plugin that transforms Jest API calls to Vitest equivalents at
 * compile time, BEFORE Vitest's static analysis hoists `vi.mock()` calls.
 *
 * Key challenge: `jest.requireActual()` is synchronous in Jest but maps
 * to the async `vi.importActual()` in Vitest.
 *
 * - Inside `jest.mock()` factories: transform to `await vi.importActual()`
 *   and make the factory async.
 * - Outside factories: transform to `__vitest_requireActual()` which is a
 *   sync shim using Node's `createRequire` (provided by setup-vitest.ts).
 */
import type { Plugin } from 'vite';

/**
 * Collapse multi-line `jest\n  .method` into `jest.method`.
 */
function collapseJestDotNewlines(code: string): string {
  return code.replace(/\bjest\s*\n\s*\./g, 'jest.');
}

/**
 * Find jest.mock() calls with factories that contain jest.requireActual,
 * and transform them to async vi.mock factories with await vi.importActual.
 */
function transformMockFactories(code: string): string {
  // Match jest.mock('path', () => { or jest.mock('path', () => (
  const mockWithFactoryRe =
    /\bjest\.mock\s*\(\s*(['"][^'"]+['"]),\s*\(\)\s*=>\s*(?:\{|\()/g;
  let result = code;
  let match;

  while ((match = mockWithFactoryRe.exec(code)) !== null) {
    const factoryBodyStart = match.index + match[0].length;
    const openChar = code[factoryBodyStart - 1]; // '{' or '('
    const closeChar = openChar === '{' ? '}' : ')';

    // Find the matching close bracket for the factory body
    let depth = 1;
    let pos = factoryBodyStart;
    while (depth > 0 && pos < code.length) {
      const ch = code[pos];
      if (ch === '{' || ch === '(') depth++;
      else if (ch === '}' || ch === ')') depth--;
      pos++;
    }
    // pos now points just past the closing char that zeroed depth.
    // That closing char is the `)` of jest.mock(...).
    // The factory's closing bracket is one level inside: we need to
    // find where the factory body ends (before the mock's closing paren).

    // Actually, the depth counter uses all brackets, so we need to be
    // more careful. Let's re-do with a different approach: track only
    // the factory's own bracket type, plus account for the outer mock's `)`.

    // Simpler approach: after `() => (` or `() => {`, find the matching
    // close for that specific bracket, then expect `)`  for jest.mock's close.
    depth = 1;
    pos = factoryBodyStart;
    while (depth > 0 && pos < code.length) {
      const ch = code[pos];
      if (ch === openChar) depth++;
      else if (ch === closeChar) depth--;
      pos++;
    }
    // pos is now just past the factory body's closing bracket
    const factoryEnd = pos; // includes the closeChar

    // Skip whitespace and expect the closing `)` of jest.mock(...)
    let mockEnd = pos;
    while (mockEnd < code.length && /\s/.test(code[mockEnd])) mockEnd++;
    if (code[mockEnd] === ')') mockEnd++; // consume the mock's closing paren

    // Skip optional semicolon
    if (code[mockEnd] === ';') mockEnd++;

    const factoryBody = code.substring(factoryBodyStart, factoryEnd - 1);

    if (
      factoryBody.includes('jest.requireActual') ||
      factoryBody.includes('jest.requireMock')
    ) {
      const modulePath = match[1];
      let newBody = factoryBody.replace(
        /\bjest\.requireActual\s*(?:<[^>]*>\s*)?\(\s*([^)]+)\s*\)/g,
        '(await vi.importActual($1))',
      );
      newBody = newBody.replace(
        /\bjest\.requireMock\s*(?:<[^>]*>\s*)?\(\s*([^)]+)\s*\)/g,
        '(await vi.importMock($1))',
      );

      const fullMatch = code.substring(match.index, mockEnd);
      const semi = fullMatch.endsWith(';') ? ';' : '';
      const newMock = `vi.mock(${modulePath}, async () => ${openChar}${newBody}${closeChar})${semi}`;

      result = result.replace(fullMatch, newMock);
    }
  }

  return result;
}

const SIMPLE_REPLACEMENTS: [RegExp, string][] = [
  [/\bjest\.fn\b/g, 'vi.fn'],
  [/\bjest\.spyOn\b/g, 'vi.spyOn'],
  [/\bjest\.mocked\b/g, 'vi.mocked'],
  [/\bjest\.clearAllMocks\b/g, 'vi.clearAllMocks'],
  [/\bjest\.resetAllMocks\b/g, 'vi.resetAllMocks'],
  [/\bjest\.restoreAllMocks\b/g, 'vi.restoreAllMocks'],
  [/\bjest\.clearAllTimers\b/g, 'vi.clearAllTimers'],
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
  [/\bjest\.setTimeout\b/g, 'vi.setConfig'],
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
        !/\bjest[\s.]/.test(code) &&
        !code.includes('@jest/globals') &&
        !code.includes('jest-environment')
      ) {
        return null;
      }

      let transformed = collapseJestDotNewlines(code);

      // ── Step 1: Transform jest.mock factories with requireActual ──────
      transformed = transformMockFactories(transformed);

      // ── Step 2: Outside mock factories, replace remaining
      // jest.requireActual with sync shim (handles TS generics too)
      transformed = transformed.replace(
        /\bjest\.requireActual\s*(?:<[^>]*>\s*)?\(/g,
        '__vitest_requireActual(',
      );

      // ── Step 3: Handle remaining jest.mock ────────────────────────────
      transformed = transformed.replace(/\bjest\.mock\b/g, 'vi.mock');

      // ── Step 4: Handle jest.requireMock outside factories ─────────────
      transformed = transformed.replace(
        /\bjest\.requireMock\b/g,
        'vi.importMock',
      );

      // ── Step 5: Apply simple replacements ─────────────────────────────
      for (const [pattern, replacement] of SIMPLE_REPLACEMENTS) {
        transformed = transformed.replace(pattern, replacement);
      }

      if (transformed === code) return null;

      return { code: transformed, map: null };
    },
  };
}
