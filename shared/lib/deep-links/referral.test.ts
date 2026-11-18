import { it as jestIt } from '@jest/globals';
import {
  getReferralCode,
  withReferralCode,
} from '#shared/lib/deep-links/referral';

describe('getReferralCode', () => {
  jestIt.each([
    [' a1b ', 'A1B'],
    ['a'.repeat(24), 'A'.repeat(24)],
  ])('normalizes a valid code: %s', (input, expected) => {
    expect(getReferralCode(new URLSearchParams({ ref: input }))).toBe(expected);
  });

  jestIt.each([
    '',
    'ref=ab',
    'ref=ABC-123',
    'ref=ABC&ref=DEF',
    `ref=${'A'.repeat(25)}`,
  ])('ignores malformed or ambiguous input: %s', (query) => {
    expect(getReferralCode(new URLSearchParams(query))).toBeNull();
  });

  jestIt.each([
    ['ref=abc123&sig=signature', 'ABC123'],
    ['ref=abc123&sig=signature&sig_params=ref', 'ABC123'],
    ['ref=abc123&sig=signature&sig_params=from,ref,to', 'ABC123'],
    ['ref=abc123&sig=signature&sig_params=', null],
    ['ref=abc123&sig=signature&sig_params=from,to', null],
    ['ref=abc123&sig=signature&sig_params=referral', null],
    ['ref=abc123&sig=signature&sig_params=REF', null],
    ['ref=abc123&sig=&sig_params=from,to', null],
    ['ref=abc123&sig_params=from,to', 'ABC123'],
    ['ref=abc123&sig_params=', 'ABC123'],
  ])('respects the signature parameter scope: %s', (query, expected) => {
    expect(getReferralCode(new URLSearchParams(query))).toBe(expected);
  });
});

describe('withReferralCode', () => {
  it('carries the code outside the product route without changing its parameters', () => {
    const params = new URLSearchParams('ref=abc123&unsigned=ignored');
    const result = withReferralCode('scheme://id/home.html?a=v#/r?t=E', params);
    expect(result).toBe('scheme://id/home.html?a=v&ref=ABC123#/r?t=E');
  });

  it('preserves the destination when there is no valid referral', () => {
    const destination = 'scheme://id/home.html#/m';
    const route = withReferralCode(destination, new URLSearchParams('ref=???'));
    expect(route).toBe(destination);
  });

  it('does not carry a referral excluded from the signature', () => {
    const destination = 'scheme://id/home.html#/m';
    const params = new URLSearchParams(
      'ref=abc123&sig=signature&sig_params=from,to',
    );

    expect(withReferralCode(destination, params)).toBe(destination);
  });
});
