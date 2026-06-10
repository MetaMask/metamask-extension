import {
  ACTIVE_TAB_DOMAIN_METRICS_FLAG,
  getActiveTabDomainAllowlist,
  getActiveTabDomainForMetrics,
} from './active-tab-domain-metrics';

describe('getActiveTabDomainAllowlist', () => {
  it('returns the remote flag value when it is a valid non-empty string array', () => {
    expect(
      getActiveTabDomainAllowlist({
        remoteFeatureFlags: {
          [ACTIVE_TAB_DOMAIN_METRICS_FLAG]: ['x.com', 'example.com'],
        },
      }),
    ).toStrictEqual(['x.com', 'example.com']);
  });

  it('filters out non-string entries from the remote flag value', () => {
    expect(
      getActiveTabDomainAllowlist({
        remoteFeatureFlags: {
          [ACTIVE_TAB_DOMAIN_METRICS_FLAG]: ['x.com', 42, null, 'twitter.com'],
        },
      }),
    ).toStrictEqual(['x.com', 'twitter.com']);
  });

  it('filters out empty strings from the remote flag value', () => {
    expect(
      getActiveTabDomainAllowlist({
        remoteFeatureFlags: {
          [ACTIVE_TAB_DOMAIN_METRICS_FLAG]: ['', 'x.com'],
        },
      }),
    ).toStrictEqual(['x.com']);
  });
});

describe('getActiveTabDomainForMetrics', () => {
  describe('allowlisted origins', () => {
    it('returns the canonical origin for an exact allowlisted hostname', () => {
      expect(getActiveTabDomainForMetrics('https://x.com')).toBe(
        'https://x.com',
      );
    });

    it('returns the canonical origin for the second allowlisted hostname', () => {
      expect(getActiveTabDomainForMetrics('https://twitter.com')).toBe(
        'https://twitter.com',
      );
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
      expect(getActiveTabDomainForMetrics('https://user:pass@x.com')).toBe(
        'https://x.com',
      );
    });
  });

  describe('custom allowlist parameter', () => {
    it('matches against a caller-provided allowlist', () => {
      expect(
        getActiveTabDomainForMetrics('https://example.com', ['example.com']),
      ).toBe('https://example.com');
    });

    it('returns undefined when origin is not in the caller-provided allowlist', () => {
      expect(
        getActiveTabDomainForMetrics('https://x.com', ['example.com']),
      ).toBeUndefined();
    });
  });

  describe('non-allowlisted origins', () => {
    it('returns undefined for a hostname not on the allowlist', () => {
      expect(
        getActiveTabDomainForMetrics('https://example.com'),
      ).toBeUndefined();
    });

    it('returns undefined when the hostname contains the allowlisted domain without a dot separator', () => {
      expect(
        getActiveTabDomainForMetrics('https://evilx.com'),
      ).toBeUndefined();
    });

    it('returns undefined when the hostname contains an allowlisted domain as a non-dot suffix', () => {
      expect(
        getActiveTabDomainForMetrics('https://nottwitter.com'),
      ).toBeUndefined();
    });
  });

  describe('non-HTTPS origins', () => {
    it('returns undefined for an HTTP origin even if the hostname is allowlisted', () => {
      expect(getActiveTabDomainForMetrics('http://x.com')).toBeUndefined();
    });

    it('returns undefined for a chrome:// origin', () => {
      expect(
        getActiveTabDomainForMetrics('chrome://settings'),
      ).toBeUndefined();
    });

    it('returns undefined for a javascript: URI', () => {
      expect(
        getActiveTabDomainForMetrics('javascript:alert(1)'),
      ).toBeUndefined();
    });

    it('returns undefined for a data: URI', () => {
      expect(
        getActiveTabDomainForMetrics('data:text/html,<h1>hi</h1>'),
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
