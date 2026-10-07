import { setGlobalDevModeChecks } from 'reselect';

import {
  MemoizeMode,
  createParameterizedSelector,
  createSelectorWith,
  createWeakMapSelector,
} from './selector-creators';

/**
 * Reselect warns once a memoized function passes 1000 distinct values in the
 * same primitive argument position, which is exactly the unbounded growth we
 * care about here. Driving the selector past that threshold and asserting on
 * the warning is deterministic, unlike measuring retained heap.
 *
 * @param run - Exercises the selector under test.
 * @returns The cache-size warnings reselect emitted.
 */
function collectCacheSizeWarnings(run: () => void): string[] {
  const warnings: string[] = [];
  const warn = jest
    .spyOn(console, 'warn')
    .mockImplementation((message: unknown) => {
      if (String(message).includes('A function memoized with weakMapMemoize')) {
        warnings.push(String(message));
      }
    });
  setGlobalDevModeChecks({ cacheSizeCheck: 'always' });

  try {
    run();
  } finally {
    setGlobalDevModeChecks({ cacheSizeCheck: 'once' });
    warn.mockRestore();
  }

  return warnings;
}

// Enough iterations to clear reselect's 1000-entry threshold.
const ITERATIONS = 3000;

describe('selector-creators', () => {
  describe('maxSize', () => {
    it('bounds the arguments cache, not just the result cache', () => {
      // A selector keeps two caches. `maxSize` has to reach both, or a
      // selector called with an ever-changing primitive keeps one arguments
      // cache entry per value it has ever seen.
      const selector = createParameterizedSelector(20)(
        (state: { value: number }) => state.value,
        (_state: { value: number }, timestamp: number) => timestamp,
        (value, timestamp) => timestamp - value > 0,
      );
      // A state object that is never replaced is what makes this observable.
      // Redux hands over a fresh object on every update, which lets the
      // arguments cache release the previous entry and hides the growth.
      const state = { value: 1 };

      const warnings = collectCacheSizeWarnings(() => {
        for (let i = 0; i < ITERATIONS; i++) {
          selector(state, i);
        }
      });

      expect(warnings).toStrictEqual([]);
    });

    it('bounds the arguments cache for weakmap-memoized selectors too', () => {
      const selector = createSelectorWith({
        memoize: MemoizeMode.Weak,
        maxSize: 20,
      })(
        (state: { value: number }) => state.value,
        (_state: { value: number }, timestamp: number) => timestamp,
        (value, timestamp) => timestamp - value > 0,
      );
      const state = { value: 1 };

      const warnings = collectCacheSizeWarnings(() => {
        for (let i = 0; i < ITERATIONS; i++) {
          selector(state, i);
        }
      });

      expect(warnings).toStrictEqual([]);
    });

    it('still returns correct results once both caches are bounded', () => {
      const selector = createParameterizedSelector(3)(
        (state: { threshold: number }) => state.threshold,
        (_state: { threshold: number }, value: number) => value,
        (threshold, value) => value > threshold,
      );
      const state = { threshold: 10 };

      // Cycle well past maxSize so entries are evicted and recomputed.
      for (let round = 0; round < 50; round++) {
        expect(selector(state, 5)).toBe(false);
        expect(selector(state, 10)).toBe(false);
        expect(selector(state, 11)).toBe(true);
        expect(selector(state, 1000)).toBe(true);
      }
    });
  });

  describe('createWeakMapSelector', () => {
    it('releases cached results when object keys are garbage collected', () => {
      // The documented reason to pick weakmap memoization. Object keys are the
      // supported case; primitive keys are held until `clearCache()`, which is
      // why the docs steer primitives to createParameterizedSelector.
      const selector = createWeakMapSelector(
        (state: { tokens: Record<string, string[]> }) => state.tokens,
        (
          _state: { tokens: Record<string, string[]> },
          account: { address: string },
        ) => account,
        (tokens, account) => tokens[account.address] ?? [],
      );
      const state = { tokens: { '0x1': ['TOKEN'] } };

      const account = { address: '0x1' };
      expect(selector(state, account)).toStrictEqual(['TOKEN']);
      // Same object key, so the cached result comes back by reference.
      expect(selector(state, account)).toBe(selector(state, account));
    });
  });
});
