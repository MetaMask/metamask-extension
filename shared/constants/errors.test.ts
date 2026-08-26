import {
  BROWSER_SHUTTING_DOWN_ERROR,
  CORRUPTION_BLOCK_CHECKSUM_MISMATCH,
  MISSING_VAULT_ERROR,
  isBrowserShuttingDownError,
  isStateCorruptionError,
} from './errors';

describe('isBrowserShuttingDownError', () => {
  it('identifies the browser shutdown rejection', () => {
    expect(
      isBrowserShuttingDownError(new Error(BROWSER_SHUTTING_DOWN_ERROR)),
    ).toBe(true);
  });

  it('identifies it when raised as a DOMException', () => {
    // Extension APIs can reject with one, so the predicate has to accept it.
    expect(
      isBrowserShuttingDownError(
        new DOMException(BROWSER_SHUTTING_DOWN_ERROR, 'InvalidStateError'),
      ),
    ).toBe(true);
  });

  it('identifies it when the error has crossed a realm', () => {
    // An extension has separate realms for the service worker, the offscreen
    // document and each UI context. An error that crosses one keeps its shape
    // but fails `instanceof Error`, so matching must not depend on the
    // prototype - otherwise the error is reported after all.
    const crossRealmError = Object.create(null);
    crossRealmError.name = 'Error';
    crossRealmError.message = BROWSER_SHUTTING_DOWN_ERROR;

    expect(crossRealmError instanceof Error).toBe(false);
    expect(isBrowserShuttingDownError(crossRealmError)).toBe(true);
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
      isBrowserShuttingDownError(
        new Error('Corruption: block checksum mismatch'),
      ),
    ).toBe(false);
  });

  it('tolerates values that carry no message', () => {
    // A bare string is not treated as a match: only a thrown object with this
    // exact `message` counts, so an unrelated value cannot silence reporting.
    expect(isBrowserShuttingDownError(BROWSER_SHUTTING_DOWN_ERROR)).toBe(false);
    expect(isBrowserShuttingDownError(undefined)).toBe(false);
    expect(isBrowserShuttingDownError(null)).toBe(false);
    expect(isBrowserShuttingDownError(42)).toBe(false);
    expect(isBrowserShuttingDownError({})).toBe(false);
    expect(isBrowserShuttingDownError({ message: 42 })).toBe(false);
  });
});

describe('isStateCorruptionError', () => {
  it('identifies the state corruption errors', () => {
    expect(isStateCorruptionError(new Error(MISSING_VAULT_ERROR))).toBe(true);
    expect(
      isStateCorruptionError(new Error(CORRUPTION_BLOCK_CHECKSUM_MISMATCH)),
    ).toBe(true);
  });

  it('identifies them on a serialized error sent over the port', () => {
    // The critical-error port carries plain objects rather than Errors, so this
    // must not depend on the prototype either.
    expect(
      isStateCorruptionError({ name: 'Error', message: MISSING_VAULT_ERROR }),
    ).toBe(true);
  });

  it('rejects unrelated and message-less values', () => {
    expect(isStateCorruptionError(new Error(BROWSER_SHUTTING_DOWN_ERROR))).toBe(
      false,
    );
    expect(isStateCorruptionError(undefined)).toBe(false);
    expect(isStateCorruptionError(null)).toBe(false);
    expect(isStateCorruptionError({})).toBe(false);
  });
});
