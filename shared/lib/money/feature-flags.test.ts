import packageJson from '../../../package.json';
import {
  MONEY_EARNING_SECTION_ENABLED_FLAG_NAME,
  MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME,
  isMoneyAccountEnabled,
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
