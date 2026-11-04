import { it as jestIt } from '@jest/globals';
import {
  getMoneyReferralCode,
  buildMoneyReferralRoute,
} from './money-referral';

describe('getMoneyReferralCode', () => {
  jestIt.each(['abc', 'A'.repeat(24), '  kol123  '])(
    'normalizes %s',
    (code) => {
      const url = new URL('https://link.metamask.io/swap?amount=123');
      url.searchParams.set('ref', code);
      const original = url.toString();
      expect(getMoneyReferralCode(url)).toBe(code.trim().toUpperCase());
      expect(url.toString()).toBe(original);
    },
  );

  jestIt.each([
    '',
    'AB',
    'A'.repeat(25),
    'KOL-123',
    'KOL_123',
    'KO L',
    '💰123',
  ])('rejects %s rather than sanitizing it', (code) => {
    const url = new URL('https://link.metamask.io/home');
    url.searchParams.set('ref', code);
    expect(getMoneyReferralCode(url)).toBeNull();
  });

  jestIt.each([
    'https://link.metamask.io/home?referral=ABC123',
    'https://example.com/home?ref=ABC123',
    'https://link.metamask.com/home?ref=ABC123',
    'https://link.metamask.io/home?ref=ABC&ref=DEF',
  ])('ignores unsupported or ambiguous context in %s', (url) => {
    expect(getMoneyReferralCode(new URL(url))).toBeNull();
  });

  jestIt('does not confuse the legacy points parameter with ref', () => {
    expect(
      getMoneyReferralCode(
        new URL('https://link.metamask.io/home?ref=kol123&referral=OLD-CODE'),
      ),
    ).toBe('KOL123');
  });
});

describe('buildMoneyReferralRoute', () => {
  jestIt(
    'encodes the original link separately from its context identity',
    () => {
      const url = 'https://link.metamask.io/swap?ref=ABC&amount=123';
      const route = buildMoneyReferralRoute({ id: 'context-1', url });
      const parsed = new URL(route, 'https://extension.test');
      expect(parsed.pathname).toBe('/referral-invite');
      expect(parsed.searchParams.get('u')).toBe(url);
      expect(parsed.searchParams.get('context')).toBe('context-1');
    },
  );
});
