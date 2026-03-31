import {
  CORRUPTION_BLOCK_CHECKSUM_MISMATCH,
  FIREFOX_STORAGE_UNEXPECTED_ERROR,
  MISSING_VAULT_ERROR,
  isStateCorruptionError,
} from './errors';

describe('isStateCorruptionError', () => {
  it('returns true for missing vault persistence error', () => {
    expect(
      isStateCorruptionError({
        message: MISSING_VAULT_ERROR,
        name: 'PersistenceError',
      }),
    ).toBe(true);
  });

  it('returns true for block checksum mismatch', () => {
    expect(
      isStateCorruptionError({
        message: CORRUPTION_BLOCK_CHECKSUM_MISMATCH,
        name: 'Error',
      }),
    ).toBe(true);
  });

  it('returns true for Firefox generic storage failure message', () => {
    expect(
      isStateCorruptionError({
        message: FIREFOX_STORAGE_UNEXPECTED_ERROR,
        name: 'Error',
      }),
    ).toBe(true);
  });

  it('returns false for unrelated errors', () => {
    expect(
      isStateCorruptionError({
        message: 'Network request failed',
        name: 'Error',
      }),
    ).toBe(false);
  });
});
