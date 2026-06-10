import { getActiveTabDomainForMetrics } from './active-tab-domain-metrics';

describe('getActiveTabDomainForMetrics', () => {
  describe('allowlisted origins', () => {
    it('returns the canonical origin for an exact allowlisted hostname', () => {
      expect(getActiveTabDomainForMetrics('https://x.com')).toBe('https://x.com');
    });

    it('returns the canonical origin for a subdomain of an allowlisted hostname', () => {
      expect(getActiveTabDomainForMetrics('https://mobile.x.com')).toBe(
        'https://mobile.x.com',
      );
    });

    it('normalises the origin to lowercase regardless of input casing', () => {
      expect(getActiveTabDomainForMetrics('https://X.COM')).toBe(
        'https://x.com',
      );
    });

    it('strips credentials from the returned origin', () => {
      expect(
        getActiveTabDomainForMetrics('https://user:pass@x.com'),
      ).toBe('https://x.com');
    });
  });

  describe('non-allowlisted origins', () => {
    it('returns undefined for a hostname that is not on the allowlist', () => {
      expect(getActiveTabDomainForMetrics('https://example.com')).toBeUndefined();
    });

    it('returns undefined when the hostname only contains the allowlisted domain without a dot separator', () => {
      expect(getActiveTabDomainForMetrics('https://evilx.com')).toBeUndefined();
    });

    it('returns undefined when the hostname contains an allowlisted domain as a suffix without a dot', () => {
      expect(
        getActiveTabDomainForMetrics('https://nottwitter.com'),
      ).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('returns undefined for undefined input', () => {
      expect(getActiveTabDomainForMetrics(undefined)).toBeUndefined();
    });

    it('returns undefined for an empty string', () => {
      expect(getActiveTabDomainForMetrics('')).toBeUndefined();
    });

    it('returns undefined for an unparseable string', () => {
      expect(getActiveTabDomainForMetrics('not-a-url')).toBeUndefined();
    });

    it('returns undefined for a hostname with a trailing root dot', () => {
      // 'https://x.com.' parses to hostname 'x.com.' which !== 'x.com'
      expect(getActiveTabDomainForMetrics('https://x.com.')).toBeUndefined();
    });
  });
});
