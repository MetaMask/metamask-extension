import { parseSeedPhrase } from './create-new-vault';

describe('parseSeedPhrase', () => {
  it('should handle a regular Secret Recovery Phrase', () => {
    expect(parseSeedPhrase('foo bar baz')).toStrictEqual('foo bar baz');
  });

  it('should handle a mixed-case Secret Recovery Phrase', () => {
    expect(parseSeedPhrase('FOO bAr baZ')).toStrictEqual('foo bar baz');
  });

  it('should handle an upper-case Secret Recovery Phrase', () => {
    expect(parseSeedPhrase('FOO BAR BAZ')).toStrictEqual('foo bar baz');
  });

  it('should trim extraneous whitespace from the given Secret Recovery Phrase', () => {
    expect(parseSeedPhrase('  foo   bar   baz  ')).toStrictEqual('foo bar baz');
  });

  it('should return an empty string when given a whitespace-only string', () => {
    expect(parseSeedPhrase('   ')).toStrictEqual('');
  });

  it('should return an empty string when given a string with only symbols', () => {
    expect(parseSeedPhrase('$')).toStrictEqual('');
  });

  it('should return an empty string for both null and undefined', () => {
    expect(parseSeedPhrase(undefined)).toStrictEqual('');
    expect(parseSeedPhrase(null)).toStrictEqual('');
  });
});
