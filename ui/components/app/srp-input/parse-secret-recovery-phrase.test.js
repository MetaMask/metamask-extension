import { parseSecretRecoveryPhrase } from './parse-secret-recovery-phrase';

describe('parseSecretRecoveryPhrase', () => {
  it('should handle a regular Secret Recovery Phrase', () => {
    expect(parseSecretRecoveryPhrase('foo bar baz')).toStrictEqual(
      'foo bar baz',
    );
  });

  it('should handle a mixed-case Secret Recovery Phrase', () => {
    expect(parseSecretRecoveryPhrase('FOO bAr baZ')).toStrictEqual(
      'foo bar baz',
    );
  });

  it('should handle an upper-case Secret Recovery Phrase', () => {
    expect(parseSecretRecoveryPhrase('FOO BAR BAZ')).toStrictEqual(
      'foo bar baz',
    );
  });

  it('should trim extraneous whitespace from the given Secret Recovery Phrase', () => {
    expect(parseSecretRecoveryPhrase('  foo   bar   baz  ')).toStrictEqual(
      'foo bar baz',
    );
  });

  it('should return an empty string when given a whitespace-only string', () => {
    expect(parseSecretRecoveryPhrase('   ')).toStrictEqual('');
  });

  it('should return an empty string when given a string with only symbols', () => {
    expect(parseSecretRecoveryPhrase('$')).toStrictEqual('');
  });

  it('should return an empty string for both null and undefined', () => {
    expect(parseSecretRecoveryPhrase(undefined)).toStrictEqual('');
    expect(parseSecretRecoveryPhrase(null)).toStrictEqual('');
  });
});
