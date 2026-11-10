import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import { resolveFlowIterations } from './flow-iterations';

const OPTIONS = { iterations: 5, retries: 2 };

const FLOWS_DIR = path.resolve(__dirname, '../flows');

/**
 * A top-level export named `iterations`: a function, a binding, or a name in
 * an export list.
 */
const ITERATIONS_EXPORT =
  /^export\s+(?:async\s+)?(?:function\s*\*?|const|let|var)\s+iterations\b|^export\s*(?:type\s+)?\{[^}]*\biterations\b[^}]*\}/mu;

/**
 * Every flow module under `flows/` that `run-benchmark.ts` can import, the
 * tests and Playwright specs left out, relative to `flows/`.
 * @returns Their paths, sorted.
 */
function flowModulePaths(): string[] {
  return readdirSync(FLOWS_DIR, { recursive: true, encoding: 'utf8' })
    .filter(
      (file) => file.endsWith('.ts') && !/\.(?:test|spec)\.ts$/u.test(file),
    )
    .map((file) => file.split(path.sep).join('/'))
    .sort();
}

describe('resolveFlowIterations', () => {
  // `restoreMocks` in `jest.config.js` restores the spy after each test.
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  it("runs the invocation's count, and logs it, for a module that exports no `iterations`", () => {
    expect(
      resolveFlowIterations('confirm-tx', { run: jest.fn() }, OPTIONS),
    ).toBe(5);
    expect(console.log).toHaveBeenCalledWith(
      'Running confirm-tx with 5 iterations (retries: 2)',
    );
  });

  it("runs the invocation's count where `iterations()` returns undefined", () => {
    expect(
      resolveFlowIterations(
        'bridge-user-actions',
        { iterations: () => undefined },
        OPTIONS,
      ),
    ).toBe(5);
    expect(console.log).toHaveBeenCalledWith(
      'Running bridge-user-actions with 5 iterations (retries: 2)',
    );
  });

  it("runs the module's own count, and logs it, where `iterations()` returns one", () => {
    expect(
      resolveFlowIterations(
        'bridge-user-actions',
        { iterations: () => 17 },
        OPTIONS,
      ),
    ).toBe(17);
    expect(console.log).toHaveBeenCalledWith(
      'Running bridge-user-actions with 17 iterations (retries: 2)',
    );
  });

  it('refuses an `iterations` export that is not a function, rather than ignore it', () => {
    expect(() =>
      resolveFlowIterations('bridge-user-actions', { iterations: 17 }, OPTIONS),
    ).toThrow(
      'bridge-user-actions exports `iterations` as a number; it must be a function returning a count or undefined',
    );
    expect(console.log).not.toHaveBeenCalled();
  });

  it('refuses an `iterations()` that returns something other than a count', () => {
    expect(() =>
      resolveFlowIterations(
        'bridge-user-actions',
        { iterations: () => '17' },
        OPTIONS,
      ),
    ).toThrow(
      "bridge-user-actions's `iterations()` returned a string; it must return a count or undefined",
    );
  });
});

describe('the flow modules', () => {
  it('list the interaction, user-journey and startup flows the presets name', () => {
    expect(flowModulePaths()).toStrictEqual(
      expect.arrayContaining([
        'interaction/bridge-user-actions.ts',
        'interaction/confirm-tx.ts',
        'interaction/load-new-account.ts',
        'startup/standard-home.ts',
        'user-journey/swap.ts',
      ]),
    );
  });

  it("export `iterations` from the bridge flow alone, so every other flow runs the invocation's count whatever the switch", () => {
    const exporting = flowModulePaths().filter((file) =>
      ITERATIONS_EXPORT.test(readFileSync(path.join(FLOWS_DIR, file), 'utf8')),
    );

    expect(exporting).toStrictEqual(['interaction/bridge-user-actions.ts']);
  });
});
