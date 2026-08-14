import {
  ACTIVE_TAB_DOMAIN_METRICS_FLAG,
  getActiveTabDomainAllowlist,
  getActiveTabDomainForMetrics,
} from './active-tab-domain-metrics';

describe('getActiveTabDomainAllowlist', () => {
  describe('valid flag shape: { value, minimumVersion }', () => {
    it('returns the value array when the version requirement is met', () => {
      expect(
        getActiveTabDomainAllowlist({
          remoteFeatureFlags: {
            [ACTIVE_TAB_DOMAIN_METRICS_FLAG]: {
              value: ['x.com', 'twitter.com'],
              minimumVersion: '1.0.0',
            },
          },
        }),
      ).toStrictEqual(['x.com', 'twitter.com']);
    });

    it('returns an empty array when the app version does not meet minimumVersion', () => {
      expect(
        getActiveTabDomainAllowlist({
          remoteFeatureFlags: {
            [ACTIVE_TAB_DOMAIN_METRICS_FLAG]: {
              value: ['x.com'],
              minimumVersion: '9999.0.0',
            },
          },
        }),
      ).toStrictEqual([]);
    });

    it('filters out non-string entries from value', () => {
      expect(
        getActiveTabDomainAllowlist({
          remoteFeatureFlags: {
            [ACTIVE_TAB_DOMAIN_METRICS_FLAG]: {
              value: ['x.com', 42, null, 'twitter.com'],
              minimumVersion: '1.0.0',
            },
          },
        }),
      ).toStrictEqual(['x.com', 'twitter.com']);
    });

    it('filters out empty strings from value', () => {
      expect(
        getActiveTabDomainAllowlist({
          remoteFeatureFlags: {
            [ACTIVE_TAB_DOMAIN_METRICS_FLAG]: {
              value: ['', 'x.com'],
              minimumVersion: '1.0.0',
            },
          },
        }),
      ).toStrictEqual(['x.com']);
    });

    it('returns an empty array when value contains only invalid entries', () => {
      expect(
        getActiveTabDomainAllowlist({
          remoteFeatureFlags: {
            [ACTIVE_TAB_DOMAIN_METRICS_FLAG]: {
              value: [null, 42, ''],
              minimumVersion: '1.0.0',
            },
          },
        }),
      ).toStrictEqual([]);
    });

    it('returns an empty array when value is an empty array', () => {
      expect(
        getActiveTabDomainAllowlist({
          remoteFeatureFlags: {
            [ACTIVE_TAB_DOMAIN_METRICS_FLAG]: {
              value: [],
              minimumVersion: '1.0.0',
            },
          },
        }),
      ).toStrictEqual([]);
    });
  });

  describe('invalid or absent flag', () => {
    it('returns an empty array when the flag is absent', () => {
      expect(
        getActiveTabDomainAllowlist({ remoteFeatureFlags: {} }),
      ).toStrictEqual([]);
    });

    it('returns an empty array when the flag is a plain array (unsupported shape)', () => {
      expect(
        getActiveTabDomainAllowlist({
          remoteFeatureFlags: {
            [ACTIVE_TAB_DOMAIN_METRICS_FLAG]: ['x.com'],
          },
        }),
      ).toStrictEqual([]);
    });

    it('returns an empty array when the flag is missing minimumVersion', () => {
      expect(
        getActiveTabDomainAllowlist({
          remoteFeatureFlags: {
            [ACTIVE_TAB_DOMAIN_METRICS_FLAG]: { value: ['x.com'] },
          },
        }),
      ).toStrictEqual([]);
    });

    it('returns an empty array when the flag is missing value', () => {
      expect(
        getActiveTabDomainAllowlist({
          remoteFeatureFlags: {
            [ACTIVE_TAB_DOMAIN_METRICS_FLAG]: { minimumVersion: '1.0.0' },
          },
        }),
      ).toStrictEqual([]);
    });

    it('returns an empty array when source is undefined', () => {
      expect(getActiveTabDomainAllowlist()).toStrictEqual([]);
    });
  });
});

describe('getActiveTabDomainForMetrics', () => {
  const allowlist = ['x.com', 'twitter.com'];

  describe('allowlisted HTTPS origins', () => {
    it('returns the origin for an exact allowlisted hostname', () => {
      expect(getActiveTabDomainForMetrics('https://x.com', allowlist)).toBe(
        'https://x.com',
      );
    });

    it('returns the origin for a subdomain of an allowlisted hostname', () => {
      expect(
        getActiveTabDomainForMetrics('https://mobile.x.com', allowlist),
      ).toBe('https://mobile.x.com');
    });

    it('normalises the origin to lowercase regardless of input casing', () => {
      expect(getActiveTabDomainForMetrics('https://X.COM', allowlist)).toBe(
        'https://x.com',
      );
    });

    it('strips credentials from the returned origin', () => {
      expect(
        getActiveTabDomainForMetrics('https://user:pass@x.com', allowlist),
      ).toBe('https://x.com');
    });

    it('strips query parameters from the returned origin', () => {
      expect(getActiveTabDomainForMetrics('https://x.com?q=1', allowlist)).toBe(
        'https://x.com',
      );
    });
  });

  describe('non-allowlisted origins', () => {
    it('returns undefined for a hostname not on the allowlist', () => {
      expect(
        getActiveTabDomainForMetrics('https://example.com', allowlist),
      ).toBeUndefined();
    });

    it('returns undefined when the hostname contains the allowlisted domain without a dot separator', () => {
      expect(
        getActiveTabDomainForMetrics('https://evilx.com', allowlist),
      ).toBeUndefined();
    });

    it('returns undefined when the hostname contains an allowlisted domain as a non-dot suffix', () => {
      expect(
        getActiveTabDomainForMetrics('https://nottwitter.com', allowlist),
      ).toBeUndefined();
    });
  });

  describe('non-HTTPS origins', () => {
    it('returns undefined for an HTTP origin even if the hostname is allowlisted', () => {
      expect(
        getActiveTabDomainForMetrics('http://x.com', allowlist),
      ).toBeUndefined();
    });

    it('returns undefined for a chrome:// origin', () => {
      expect(
        getActiveTabDomainForMetrics('chrome://settings', allowlist),
      ).toBeUndefined();
    });

    it('returns undefined for a data: URI', () => {
      expect(
        getActiveTabDomainForMetrics('data:text/html,<h1>hi</h1>', allowlist),
      ).toBeUndefined();
    });
  });

  describe('empty allowlist', () => {
    it('returns undefined immediately when the allowlist is empty', () => {
      expect(getActiveTabDomainForMetrics('https://x.com', [])).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('returns undefined for undefined origin', () => {
      expect(
        getActiveTabDomainForMetrics(undefined, allowlist),
      ).toBeUndefined();
    });

    it('returns undefined for an empty string origin', () => {
      expect(getActiveTabDomainForMetrics('', allowlist)).toBeUndefined();
    });

    it('returns undefined for an unparseable string', () => {
      expect(
        getActiveTabDomainForMetrics('not-a-url', allowlist),
      ).toBeUndefined();
    });

    it('returns undefined for a hostname with a trailing root dot', () => {
      expect(
        getActiveTabDomainForMetrics('https://x.com.', allowlist),
      ).toBeUndefined();
    });
  });
});
