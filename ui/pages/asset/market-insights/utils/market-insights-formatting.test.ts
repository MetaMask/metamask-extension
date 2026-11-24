import type { MarketInsightsSource } from '@metamask/ai-controllers';
import {
  formatRelativeTime,
  getFaviconUrl,
  getNormalizedHandle,
  getOpenableSourceUrl,
  getUniqueSourcesByFavicon,
  isSafeUrl,
  isXHostUrl,
  isXSourceUrl,
} from './market-insights-formatting';

describe('market-insights-formatting', () => {
  describe('getFaviconUrl', () => {
    it('builds a favicon URL from a full URL', () => {
      expect(getFaviconUrl('https://www.coindesk.com/article')).toBe(
        'https://www.google.com/s2/favicons?domain=www.coindesk.com&sz=32',
      );
    });

    it('builds a favicon URL from a bare domain', () => {
      expect(getFaviconUrl('coindesk.com/article')).toBe(
        'https://www.google.com/s2/favicons?domain=coindesk.com&sz=32',
      );
    });

    it('falls back to the text before the first slash for unparseable sources', () => {
      expect(getFaviconUrl('The Block/')).toBe(
        'https://www.google.com/s2/favicons?domain=The%20Block&sz=32',
      );
    });
  });

  describe('getNormalizedHandle', () => {
    it('prefixes a bare handle with @', () => {
      expect(getNormalizedHandle('ethanalyst')).toBe('@ethanalyst');
    });

    it('collapses leading @s into a single prefix', () => {
      expect(getNormalizedHandle('@@ethanalyst')).toBe('@ethanalyst');
    });
  });

  describe('isXSourceUrl', () => {
    it('matches the literal source names x and twitter', () => {
      expect(isXSourceUrl('x')).toBe(true);
      expect(isXSourceUrl('Twitter')).toBe(true);
    });

    it('matches x.com and twitter.com URLs', () => {
      expect(isXSourceUrl('https://x.com/a/status/1')).toBe(true);
      expect(isXSourceUrl('https://www.twitter.com/a')).toBe(true);
    });

    it('matches subdomains of x.com', () => {
      expect(isXSourceUrl('https://api.x.com')).toBe(true);
    });

    it('does not match other domains', () => {
      expect(isXSourceUrl('https://example.com')).toBe(false);
      expect(isXSourceUrl('https://notx.com')).toBe(false);
      expect(isXSourceUrl('https://twitter.evil.com')).toBe(false);
    });

    it('does not match unparseable sources', () => {
      expect(isXSourceUrl('not a url')).toBe(false);
    });
  });

  describe('isSafeUrl', () => {
    it('accepts https URLs and rejects http URLs', () => {
      expect(isSafeUrl('https://example.com')).toBe(true);
      expect(isSafeUrl('http://example.com')).toBe(false);
    });

    it('rejects other schemes and unparseable URLs', () => {
      expect(isSafeUrl(['java', 'script:alert(1)'].join(''))).toBe(false);
      expect(isSafeUrl('chrome-extension://abc')).toBe(false);
      expect(isSafeUrl('not a url')).toBe(false);
    });
  });

  describe('isXHostUrl', () => {
    it('accepts https x.com and twitter.com URLs including subdomains', () => {
      expect(isXHostUrl('https://x.com/user/status/1')).toBe(true);
      expect(isXHostUrl('https://www.twitter.com/user/status/1')).toBe(true);
      expect(isXHostUrl('https://mobile.x.com/user/status/1')).toBe(true);
    });

    it('rejects bare source names, other hosts, and non-https URLs', () => {
      expect(isXHostUrl('x')).toBe(false);
      expect(isXHostUrl('twitter')).toBe(false);
      expect(isXHostUrl('https://example.com/tweet')).toBe(false);
      expect(isXHostUrl('http://x.com/user/status/1')).toBe(false);
      expect(isXHostUrl('not a url')).toBe(false);
    });
  });

  describe('getOpenableSourceUrl', () => {
    it('returns https article URLs as-is', () => {
      expect(getOpenableSourceUrl('https://example.com/a', 'article')).toBe(
        'https://example.com/a',
      );
    });

    it('returns only x.com and twitter.com URLs for tweets', () => {
      expect(getOpenableSourceUrl('https://x.com/user/status/1', 'tweet')).toBe(
        'https://x.com/user/status/1',
      );
      expect(
        getOpenableSourceUrl('https://twitter.com/user/status/1', 'tweet'),
      ).toBe('https://twitter.com/user/status/1');
      expect(getOpenableSourceUrl('https://example.com/tweet', 'tweet')).toBe(
        null,
      );
      expect(getOpenableSourceUrl('x', 'tweet')).toBe(null);
    });

    it('returns null for unsafe URLs of either kind', () => {
      const unsafeUrl = ['java', 'script:alert(1)'].join('');
      expect(getOpenableSourceUrl(unsafeUrl, 'article')).toBe(null);
      expect(getOpenableSourceUrl('http://example.com/a', 'article')).toBe(
        null,
      );
    });
  });

  describe('getUniqueSourcesByFavicon', () => {
    it('keeps one source per domain in original order', () => {
      const sources: MarketInsightsSource[] = [
        { name: 'CoinDesk', type: 'news', url: 'https://coindesk.com/a' },
        { name: 'The Block', type: 'news', url: 'theblock.co' },
        { name: 'CoinDesk again', type: 'news', url: 'coindesk.com/b' },
      ];

      expect(getUniqueSourcesByFavicon(sources)).toEqual([
        { name: 'CoinDesk', type: 'news', url: 'https://coindesk.com/a' },
        { name: 'The Block', type: 'news', url: 'theblock.co' },
      ]);
    });

    it('returns an empty array for no sources', () => {
      expect(getUniqueSourcesByFavicon([])).toEqual([]);
    });
  });

  describe('formatRelativeTime', () => {
    const FIXED_NOW = new Date('2025-01-15T12:00:00Z').getTime();
    const t = jest.fn((key: string, substitutions?: string[]) =>
      substitutions ? `${key}:${substitutions.join(',')}` : key,
    );

    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('returns an empty string for an unparseable date', () => {
      expect(formatRelativeTime('not-a-date', t)).toBe('');
    });

    it('labels timestamps under a minute old as now', () => {
      const timestamp = new Date(FIXED_NOW - 30 * 1000).toISOString();
      expect(formatRelativeTime(timestamp, t)).toBe('marketInsightsTimeAgoNow');
    });

    it('labels minute-old timestamps with the minute count', () => {
      const timestamp = new Date(FIXED_NOW - 5 * 60 * 1000).toISOString();
      expect(formatRelativeTime(timestamp, t)).toBe(
        'marketInsightsTimeAgoMinutes:5',
      );
    });

    it('labels hour-old timestamps with the hour count', () => {
      const timestamp = new Date(FIXED_NOW - 3 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(timestamp, t)).toBe(
        'marketInsightsTimeAgoHours:3',
      );
    });

    it('labels day-old timestamps with the day count', () => {
      const timestamp = new Date(
        FIXED_NOW - 2 * 24 * 60 * 60 * 1000,
      ).toISOString();
      expect(formatRelativeTime(timestamp, t)).toBe(
        'marketInsightsTimeAgoDays:2',
      );
    });
  });
});
