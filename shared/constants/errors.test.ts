import {
  BROWSER_SHUTTING_DOWN_ERROR,
  CORRUPTION_BLOCK_CHECKSUM_MISMATCH,
  isBrowserShuttingDownError,
} from './errors';

describe('isBrowserShuttingDownError', () => {
  it('identifies the browser shutdown rejection', () => {
    expect(
      isBrowserShuttingDownError(new Error(BROWSER_SHUTTING_DOWN_ERROR)),
    ).toBe(true);
  });

  it('identifies it when raised as a DOMException', () => {
    // `DOMException instanceof Error` is true, and extension APIs can reject
    // with one, so the predicate has to accept it.
    expect(
      isBrowserShuttingDownError(
        new DOMException(BROWSER_SHUTTING_DOWN_ERROR, 'InvalidStateError'),
      ),
    ).toBe(true);
  });

  it('rejects near-misses', () => {
    // Matching is exact on purpose: this silences reporting, so a loose match
    // could hide a real storage failure.
    expect(
      isBrowserShuttingDownError(new Error('The browser is shutting down')),
    ).toBe(false);
    expect(
      isBrowserShuttingDownError(new Error('the browser is shutting down.')),
    ).toBe(false);
    expect(
      isBrowserShuttingDownError(
        new Error('Failed because: The browser is shutting down.'),
      ),
    ).toBe(false);
  });

  it('rejects unrelated storage errors', () => {
    expect(
      isBrowserShuttingDownError(new Error(CORRUPTION_BLOCK_CHECKSUM_MISMATCH)),
    ).toBe(false);
  });

  it('tolerates values that are not errors', () => {
    // Callers pass `catch` variables straight in, which are typed `unknown`.
    expect(isBrowserShuttingDownError(BROWSER_SHUTTING_DOWN_ERROR)).toBe(false);
    expect(isBrowserShuttingDownError(undefined)).toBe(false);
    expect(isBrowserShuttingDownError(null)).toBe(false);
    expect(isBrowserShuttingDownError(42)).toBe(false);
    expect(isBrowserShuttingDownError({})).toBe(false);
    expect(
      isBrowserShuttingDownError({ message: BROWSER_SHUTTING_DOWN_ERROR }),
    ).toBe(false);
  });
});
