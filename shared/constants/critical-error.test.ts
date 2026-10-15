import {
  CORRUPTION_BLOCK_CHECKSUM_MISMATCH,
  MISSING_VAULT_ERROR,
} from './errors';
import {
  CriticalErrorType,
  getStateCorruptionErrorType,
  isStateCorruptionErrorType,
  StateCorruptionErrorType,
} from './critical-error';

describe('isStateCorruptionErrorType', () => {
  it('accepts the missing-vault error type', () => {
    expect(
      isStateCorruptionErrorType(CriticalErrorType.MissingVaultInDatabase),
    ).toBe(true);
  });

  it('accepts the inaccessible-database error type', () => {
    expect(
      isStateCorruptionErrorType(CriticalErrorType.InaccessibleDatabase),
    ).toBe(true);
  });

  it('rejects critical error types that are not state corruption', () => {
    expect(isStateCorruptionErrorType(CriticalErrorType.Other)).toBe(false);
    expect(
      isStateCorruptionErrorType(CriticalErrorType.GeneralStartupError),
    ).toBe(false);
  });

  it('rejects missing and unrecognized values', () => {
    expect(isStateCorruptionErrorType(undefined)).toBe(false);
    expect(isStateCorruptionErrorType('missing_vault')).toBe(false);
  });

  it('exposes only the critical error types that describe unusable state', () => {
    expect(Object.values(StateCorruptionErrorType)).toStrictEqual([
      CriticalErrorType.MissingVaultInDatabase,
      CriticalErrorType.InaccessibleDatabase,
    ]);
  });
});

describe('getStateCorruptionErrorType', () => {
  it('returns the corruption type stated by the error', () => {
    expect(
      getStateCorruptionErrorType({
        message: MISSING_VAULT_ERROR,
        corruptionType: StateCorruptionErrorType.MissingVaultInDatabase,
      }),
    ).toBe(StateCorruptionErrorType.MissingVaultInDatabase);
  });

  it('treats the browser block checksum mismatch as an inaccessible database', () => {
    expect(
      getStateCorruptionErrorType({
        message: CORRUPTION_BLOCK_CHECKSUM_MISMATCH,
      }),
    ).toBe(StateCorruptionErrorType.InaccessibleDatabase);
  });

  it('returns undefined for errors that leave the state usable', () => {
    expect(
      getStateCorruptionErrorType({ message: 'Something else broke' }),
    ).toBeUndefined();
  });

  it('does not classify our own display messages without a corruption type', () => {
    expect(
      getStateCorruptionErrorType({ message: MISSING_VAULT_ERROR }),
    ).toBeUndefined();
  });
});
