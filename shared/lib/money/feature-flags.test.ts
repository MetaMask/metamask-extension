import packageJson from '../../../package.json';
import {
  DEFAULT_MONEY_ACCOUNT_BLOCKED_COUNTRIES,
  MONEY_ACCOUNT_GEO_BLOCKED_COUNTRIES_FLAG_NAME,
  MONEY_ACTIVITY_MOCK_DATA_ENABLED_FLAG_NAME,
  MONEY_EARNING_SECTION_ENABLED_FLAG_NAME,
  MONEY_ENABLE_ACTIVITY_DETAILS_FLAG_NAME,
  MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME,
  MONEY_HOME_SCREEN_CARD_ENABLED_FLAG_NAME,
  MONEY_DEPOSIT_CTA_TOKEN_ADDRESSES_FLAG_NAME,
  MONEY_TOKEN_LIST_ITEM_CTA_ENABLED_FLAG_NAME,
  getMoneyAccountGeoBlockedCountries,
  getMoneyDepositCtaTokenAddresses,
  isMoneyAccountEnabled,
  isMoneyAccountGeoEligible,
  isMoneyActivityDetailsEnabled,
  isMoneyActivityMockDataEnabled,
  isMoneyEarningSectionEnabled,
  isMoneyHomeScreenCardEnabled,
  isMoneyTokenListItemCtaEnabled,
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

describe('isMoneyHomeScreenCardEnabled', () => {
  it('returns true for an enabled flag the current version satisfies', () => {
    expect(
      isMoneyHomeScreenCardEnabled({
        [MONEY_HOME_SCREEN_CARD_ENABLED_FLAG_NAME]: {
          enabled: true,
          minimumVersion: CURRENT_VERSION,
        },
      }),
    ).toBe(true);
  });

  it('returns true for an enabled flag inside a progressive rollout wrapper', () => {
    expect(
      isMoneyHomeScreenCardEnabled({
        [MONEY_HOME_SCREEN_CARD_ENABLED_FLAG_NAME]: {
          name: 'home-card-rollout',
          value: { enabled: true, minimumVersion: '0.0.0' },
        },
      }),
    ).toBe(true);
  });

  it('returns false for a disabled flag', () => {
    expect(
      isMoneyHomeScreenCardEnabled({
        [MONEY_HOME_SCREEN_CARD_ENABLED_FLAG_NAME]: {
          enabled: false,
          minimumVersion: '0.0.0',
        },
      }),
    ).toBe(false);
  });

  it('returns false when the current version is below the minimum', () => {
    expect(
      isMoneyHomeScreenCardEnabled({
        [MONEY_HOME_SCREEN_CARD_ENABLED_FLAG_NAME]: {
          enabled: true,
          minimumVersion: '9999.0.0',
        },
      }),
    ).toBe(false);
  });

  it('returns false when the flag is absent, malformed, or unserved', () => {
    const cases: [string, Record<string, unknown> | undefined][] = [
      ['unserved flags', undefined],
      ['no card flag', { someOtherFlag: true }],
      ['plain boolean', { [MONEY_HOME_SCREEN_CARD_ENABLED_FLAG_NAME]: true }],
      [
        'missing minimumVersion',
        { [MONEY_HOME_SCREEN_CARD_ENABLED_FLAG_NAME]: { enabled: true } },
      ],
    ];

    for (const [name, flags] of cases) {
      expect({
        name,
        enabled: isMoneyHomeScreenCardEnabled(flags),
      }).toStrictEqual({ name, enabled: false });
    }
  });
});

describe('isMoneyActivityMockDataEnabled', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.MM_MONEY_ACTIVITY_MOCK_DATA_ENABLED;
    delete process.env.MM_MONEY_ACTIVITY_MOCK_DATA_ENABLED;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.MM_MONEY_ACTIVITY_MOCK_DATA_ENABLED;
    } else {
      process.env.MM_MONEY_ACTIVITY_MOCK_DATA_ENABLED = originalEnv;
    }
  });

  it('returns the remote boolean when it is true', () => {
    expect(
      isMoneyActivityMockDataEnabled({
        [MONEY_ACTIVITY_MOCK_DATA_ENABLED_FLAG_NAME]: true,
      }),
    ).toBe(true);
  });

  it('returns the remote boolean when it is false, ignoring the env var', () => {
    process.env.MM_MONEY_ACTIVITY_MOCK_DATA_ENABLED = 'true';
    expect(
      isMoneyActivityMockDataEnabled({
        [MONEY_ACTIVITY_MOCK_DATA_ENABLED_FLAG_NAME]: false,
      }),
    ).toBe(false);
  });

  it('falls back to the env var when the remote flag is unserved', () => {
    process.env.MM_MONEY_ACTIVITY_MOCK_DATA_ENABLED = 'true';
    expect(isMoneyActivityMockDataEnabled(undefined)).toBe(true);
    expect(isMoneyActivityMockDataEnabled({})).toBe(true);
  });

  it('falls back to the env var when the remote flag is not a boolean', () => {
    process.env.MM_MONEY_ACTIVITY_MOCK_DATA_ENABLED = 'true';
    expect(
      isMoneyActivityMockDataEnabled({
        [MONEY_ACTIVITY_MOCK_DATA_ENABLED_FLAG_NAME]: 'yes',
      }),
    ).toBe(true);
  });

  it('returns false when the remote flag is unserved and the env var is off', () => {
    process.env.MM_MONEY_ACTIVITY_MOCK_DATA_ENABLED = 'false';
    expect(isMoneyActivityMockDataEnabled(undefined)).toBe(false);
  });

  it('returns false when the remote flag is unserved and the env var is missing', () => {
    expect(isMoneyActivityMockDataEnabled(undefined)).toBe(false);
  });
});

describe('isMoneyActivityDetailsEnabled', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.MM_MONEY_ENABLE_ACTIVITY_DETAILS;
    delete process.env.MM_MONEY_ENABLE_ACTIVITY_DETAILS;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.MM_MONEY_ENABLE_ACTIVITY_DETAILS;
    } else {
      process.env.MM_MONEY_ENABLE_ACTIVITY_DETAILS = originalEnv;
    }
  });

  it('returns the remote boolean when it is true', () => {
    expect(
      isMoneyActivityDetailsEnabled({
        [MONEY_ENABLE_ACTIVITY_DETAILS_FLAG_NAME]: true,
      }),
    ).toBe(true);
  });

  it('returns the remote boolean when it is false, ignoring the env var', () => {
    process.env.MM_MONEY_ENABLE_ACTIVITY_DETAILS = 'true';
    expect(
      isMoneyActivityDetailsEnabled({
        [MONEY_ENABLE_ACTIVITY_DETAILS_FLAG_NAME]: false,
      }),
    ).toBe(false);
  });

  it('falls back to the env var when the remote flag is unserved', () => {
    process.env.MM_MONEY_ENABLE_ACTIVITY_DETAILS = 'true';
    expect(isMoneyActivityDetailsEnabled(undefined)).toBe(true);
    expect(isMoneyActivityDetailsEnabled({})).toBe(true);
  });

  it('falls back to the env var when the remote flag is not a boolean', () => {
    process.env.MM_MONEY_ENABLE_ACTIVITY_DETAILS = 'true';
    expect(
      isMoneyActivityDetailsEnabled({
        [MONEY_ENABLE_ACTIVITY_DETAILS_FLAG_NAME]: 'yes',
      }),
    ).toBe(true);
  });

  it('returns false when the remote flag is unserved and the env var is off', () => {
    process.env.MM_MONEY_ENABLE_ACTIVITY_DETAILS = 'false';
    expect(isMoneyActivityDetailsEnabled(undefined)).toBe(false);
  });

  it('returns false when the remote flag is unserved and the env var is missing', () => {
    expect(isMoneyActivityDetailsEnabled(undefined)).toBe(false);
  });
});

describe('isMoneyTokenListItemCtaEnabled', () => {
  const enabled = { enabled: true, minimumVersion: '0.0.1' };

  it('returns true when both the CTA and Money Account flags are on', () => {
    expect(
      isMoneyTokenListItemCtaEnabled({
        [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: enabled,
        [MONEY_TOKEN_LIST_ITEM_CTA_ENABLED_FLAG_NAME]: enabled,
      }),
    ).toBe(true);
  });

  it('returns false when the Money Account flag is off', () => {
    expect(
      isMoneyTokenListItemCtaEnabled({
        [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: { ...enabled, enabled: false },
        [MONEY_TOKEN_LIST_ITEM_CTA_ENABLED_FLAG_NAME]: enabled,
      }),
    ).toBe(false);
  });

  it('returns false when the CTA flag is off', () => {
    expect(
      isMoneyTokenListItemCtaEnabled({
        [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: enabled,
        [MONEY_TOKEN_LIST_ITEM_CTA_ENABLED_FLAG_NAME]: {
          ...enabled,
          enabled: false,
        },
      }),
    ).toBe(false);
  });

  it('returns false when the CTA flag requires a newer version', () => {
    expect(
      isMoneyTokenListItemCtaEnabled({
        [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: enabled,
        [MONEY_TOKEN_LIST_ITEM_CTA_ENABLED_FLAG_NAME]: {
          enabled: true,
          minimumVersion: '9999.0.0',
        },
      }),
    ).toBe(false);
  });

  it('returns false when the CTA flag is unserved', () => {
    expect(
      isMoneyTokenListItemCtaEnabled({
        [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: enabled,
      }),
    ).toBe(false);
  });
});

describe('getMoneyDepositCtaTokenAddresses', () => {
  const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
  const USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

  it('normalizes chain IDs and lowercases addresses', () => {
    expect(
      getMoneyDepositCtaTokenAddresses({
        [MONEY_DEPOSIT_CTA_TOKEN_ADDRESSES_FLAG_NAME]: {
          '0x01': [USDC],
          '0xE708': [USDT],
        },
      }),
    ).toStrictEqual({
      '0x1': [USDC.toLowerCase()],
      '0xe708': [USDT.toLowerCase()],
    });
  });

  it('accepts a JSON string', () => {
    expect(
      getMoneyDepositCtaTokenAddresses({
        [MONEY_DEPOSIT_CTA_TOKEN_ADDRESSES_FLAG_NAME]: JSON.stringify({
          '0x1': [USDC],
        }),
      }),
    ).toStrictEqual({ '0x1': [USDC.toLowerCase()] });
  });

  it('merges chain IDs that normalize to the same value', () => {
    expect(
      getMoneyDepositCtaTokenAddresses({
        [MONEY_DEPOSIT_CTA_TOKEN_ADDRESSES_FLAG_NAME]: {
          '0x1': [USDC],
          '0x01': [USDT],
        },
      }),
    ).toStrictEqual({ '0x1': [USDC.toLowerCase(), USDT.toLowerCase()] });
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([
    ['unserved', undefined],
    ['not an object', 42],
    ['an array', [USDC]],
    ['invalid JSON', '{not json'],
    ['a non-hex chain ID', { '1': [USDC] }],
    ['a CAIP chain ID', { 'eip155:1': [USDC] }],
    ['an invalid address', { '0x1': ['0x1234'] }],
    ['a non-array address list', { '0x1': USDC }],
  ])(
    'returns an empty list when the flag is %s',
    (_case: string, value: unknown) => {
      expect(
        getMoneyDepositCtaTokenAddresses({
          [MONEY_DEPOSIT_CTA_TOKEN_ADDRESSES_FLAG_NAME]: value,
        }),
      ).toStrictEqual({});
    },
  );
});
