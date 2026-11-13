import { it as jestIt } from '@jest/globals';
import { consumeReferralCode } from '#ui/helpers/utils/consume-referral-code';

describe('consumeReferralCode', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  jestIt.each([
    ['ref=abc123', { code: 'ABC123', entryType: 'deeplink' }],
    [
      'ref=abc123&refEntryType=restored_context',
      { code: 'ABC123', entryType: 'restored_context' },
    ],
    [
      'ref=abc123&refEntryType=unrecognized',
      { code: 'ABC123', entryType: 'deeplink' },
    ],
    ['ref=ABC&ref=DEF', null],
  ])(
    'consumes metadata while preserving route parameters and history: %s',
    (query, expected) => {
      const state = { key: 'current', idx: 1, usr: { from: 'unlock' } };
      window.history.replaceState(
        state,
        '',
        `/home.html?existing=value&${query}#/money?ref=product&asset=ETH`,
      );

      expect(consumeReferralCode()).toStrictEqual(expected);
      expect(window.location.search).toBe('?existing=value');
      expect(window.location.hash).toBe('#/money?ref=product&asset=ETH');
      expect(window.history.state).toStrictEqual(state);
      expect(consumeReferralCode()).toBeNull();
    },
  );
});
