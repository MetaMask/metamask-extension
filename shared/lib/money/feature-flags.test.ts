import packageJson from '../../../package.json';
import {
  DEFAULT_MONEY_ACCOUNT_BLOCKED_COUNTRIES,
  MONEY_ACCOUNT_GEO_BLOCKED_COUNTRIES_FLAG_NAME,
  MONEY_EARNING_SECTION_ENABLED_FLAG_NAME,
  MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME,
  getMoneyAccountGeoBlockedCountries,
  isMoneyAccountEnabled,
  isMoneyAccountGeoEligible,
  isMoneyEarningSectionEnabled,
} from './feature-flags';

const CURRENT_VERSION = packageJson.version;

describe('isMoneyAccountEnabled', () => {
  it('returns true for an enabled flag the current version satisfies', () => {
    expect(
      isMoneyAccountEnabled({
        [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: {
          enabled: true,
          minimumVersion: '0.0.1',
        },
      }),
    ).toBe(true);
  });

  it('returns true for an enabled flag inside a progressive rollout wrapper', () => {
    expect(
      isMoneyAccountEnabled({
        [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: {
          name: 'money-rollout',
          value: { enabled: true, minimumVersion: CURRENT_VERSION },
        },
      }),
    ).toBe(true);
  });

  it('returns false for a disabled flag', () => {
    expect(
      isMoneyAccountEnabled({
        [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: {
          enabled: false,
          minimumVersion: '0.0.1',
        },
      }),
    ).toBe(false);
  });

  it('returns false when the current version is below the minimum', () => {
    expect(
      isMoneyAccountEnabled({
        [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: {
          enabled: true,
          minimumVersion: '9999.0.0',
        },
      }),
    ).toBe(false);
  });

  it('returns false when the flag is absent, malformed, or the flags are unserved', () => {
    const cases: [string, Record<string, unknown> | undefined][] = [
      ['unserved flags', undefined],
      ['no money flag', { someOtherFlag: true }],
      ['malformed flag', { [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: 'yes' }],
      [
        'missing minimumVersion',
        { [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: { enabled: true } },
      ],
    ];

    for (const [name, flags] of cases) {
      expect({ name, enabled: isMoneyAccountEnabled(flags) }).toStrictEqual({
        name,
        enabled: false,
      });
    }
  });
});

describe('getMoneyAccountGeoBlockedCountries', () => {
  it('returns blockedRegions from the remote flag when it is a string array', () => {
    expect(
      getMoneyAccountGeoBlockedCountries({
        [MONEY_ACCOUNT_GEO_BLOCKED_COUNTRIES_FLAG_NAME]: {
          blockedRegions: ['GB', 'US'],
        },
      }),
    ).toStrictEqual(['GB', 'US']);
  });

  it('returns an empty array when the remote flag has empty blockedRegions', () => {
    expect(
      getMoneyAccountGeoBlockedCountries({
        [MONEY_ACCOUNT_GEO_BLOCKED_COUNTRIES_FLAG_NAME]: {
          blockedRegions: [],
        },
      }),
    ).toStrictEqual([]);
  });

  it('falls back to DEFAULT_MONEY_ACCOUNT_BLOCKED_COUNTRIES when the flag is absent, malformed, or flags are unserved', () => {
    const cases: [string, Record<string, unknown> | undefined][] = [
      ['unserved flags', undefined],
      ['no geo flag', { someOtherFlag: true }],
      [
        'malformed flag',
        { [MONEY_ACCOUNT_GEO_BLOCKED_COUNTRIES_FLAG_NAME]: 'yes' },
      ],
      [
        'blockedRegions is not an array',
        {
          [MONEY_ACCOUNT_GEO_BLOCKED_COUNTRIES_FLAG_NAME]: {
            blockedRegions: 'GB',
          },
        },
      ],
      [
        'blockedRegions contains a non-string',
        {
          [MONEY_ACCOUNT_GEO_BLOCKED_COUNTRIES_FLAG_NAME]: {
            blockedRegions: ['GB', 1],
          },
        },
      ],
    ];

    for (const [name, flags] of cases) {
      expect({
        name,
        countries: getMoneyAccountGeoBlockedCountries(flags),
      }).toStrictEqual({
        name,
        countries: DEFAULT_MONEY_ACCOUNT_BLOCKED_COUNTRIES,
      });
    }
  });

  it('defaults to blocking GB', () => {
    expect(DEFAULT_MONEY_ACCOUNT_BLOCKED_COUNTRIES).toStrictEqual(['GB']);
  });
});

describe('isMoneyAccountGeoEligible', () => {
  const gbBlocked = ['GB'];
  const gbUsBlocked = ['GB', 'US'];

  it('returns false when location is unknown, empty, or missing', () => {
    const cases: (string | undefined | null)[] = [
      undefined,
      null,
      '',
      'UNKNOWN',
    ];

    for (const location of cases) {
      expect({
        location,
        eligible: isMoneyAccountGeoEligible(location, gbBlocked),
      }).toStrictEqual({
        location,
        eligible: false,
      });
    }
  });

  it('returns false when the user country is in the blocked list', () => {
    expect(isMoneyAccountGeoEligible('GB', gbBlocked)).toBe(false);
  });

  it('returns false when a country-region code matches a blocked country', () => {
    expect(isMoneyAccountGeoEligible('GB-ENG', gbBlocked)).toBe(false);
  });

  it('returns false when the user is in one of multiple blocked countries', () => {
    expect(isMoneyAccountGeoEligible('US', gbUsBlocked)).toBe(false);
  });

  it('returns true when the user country is not in the blocked list', () => {
    expect(isMoneyAccountGeoEligible('US', gbBlocked)).toBe(true);
  });

  it('returns true when a country-region code does not match any blocked country', () => {
    expect(isMoneyAccountGeoEligible('US-CA', gbBlocked)).toBe(true);
  });

  it('returns true when the blocked countries list is empty', () => {
    expect(isMoneyAccountGeoEligible('GB', [])).toBe(true);
  });

  it('compares geolocation codes case-insensitively', () => {
    expect(isMoneyAccountGeoEligible('gb', gbBlocked)).toBe(false);
  });

  it('compares blocked country codes case-insensitively', () => {
    expect(isMoneyAccountGeoEligible('GB', ['gb'])).toBe(false);
  });
});

describe('isMoneyEarningSectionEnabled', () => {
  it('returns true for an enabled flag the current version satisfies', () => {
    expect(
      isMoneyEarningSectionEnabled({
        [MONEY_EARNING_SECTION_ENABLED_FLAG_NAME]: {
          enabled: true,
          minimumVersion: CURRENT_VERSION,
        },
      }),
    ).toBe(true);
  });

  it('returns false for a disabled flag', () => {
    expect(
      isMoneyEarningSectionEnabled({
        [MONEY_EARNING_SECTION_ENABLED_FLAG_NAME]: {
          enabled: false,
          minimumVersion: '0.0.1',
        },
      }),
    ).toBe(false);
  });

  it('returns false when the current version is below the minimum', () => {
    expect(
      isMoneyEarningSectionEnabled({
        [MONEY_EARNING_SECTION_ENABLED_FLAG_NAME]: {
          enabled: true,
          minimumVersion: '9999.0.0',
        },
      }),
    ).toBe(false);
  });

  it('returns false when the flag is absent, malformed, or unserved', () => {
    expect(isMoneyEarningSectionEnabled(undefined)).toBe(false);
    expect(isMoneyEarningSectionEnabled({})).toBe(false);
    expect(
      isMoneyEarningSectionEnabled({
        [MONEY_EARNING_SECTION_ENABLED_FLAG_NAME]: true,
      }),
    ).toBe(false);
  });
});
