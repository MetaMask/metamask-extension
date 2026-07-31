/* eslint-disable @typescript-eslint/naming-convention */
import { getIsPayAmountPrefillEnabled } from './pay-prefill';

function buildSource(prefilledAmount?: Record<string, unknown>) {
  return {
    remoteFeatureFlags: {
      confirmations_pay_extended: {
        prefilledAmount,
      },
    },
  };
}

describe('getIsPayAmountPrefillEnabled', () => {
  it('returns false when remote flags are missing', () => {
    expect(getIsPayAmountPrefillEnabled({}, 'musdConversion')).toBe(false);
  });

  it('returns false when the flag has no prefilledAmount config', () => {
    expect(
      getIsPayAmountPrefillEnabled(buildSource(undefined), 'musdConversion'),
    ).toBe(false);
  });

  it('returns the default value when there is no transaction-specific config', () => {
    expect(
      getIsPayAmountPrefillEnabled(
        buildSource({ default: { enabled: true } }),
        'musdConversion',
      ),
    ).toBe(true);
  });

  it('returns false when the default config is absent', () => {
    expect(
      getIsPayAmountPrefillEnabled(
        buildSource({ overrides: { perpsDeposit: { enabled: true } } }),
        'musdConversion',
      ),
    ).toBe(false);
  });

  it('prefers the override for the transaction type over the default', () => {
    expect(
      getIsPayAmountPrefillEnabled(
        buildSource({
          default: { enabled: false },
          overrides: { musdConversion: { enabled: true } },
        }),
        'musdConversion',
      ),
    ).toBe(true);
  });

  it('lets the override disable prefill when the default is enabled', () => {
    expect(
      getIsPayAmountPrefillEnabled(
        buildSource({
          default: { enabled: true },
          overrides: { musdConversion: { enabled: false } },
        }),
        'musdConversion',
      ),
    ).toBe(false);
  });

  it('reads config placed directly at the transaction type', () => {
    expect(
      getIsPayAmountPrefillEnabled(
        buildSource({
          default: { enabled: false },
          musdConversion: { enabled: true },
        }),
        'musdConversion',
      ),
    ).toBe(true);
  });

  it('prefers the override over config placed directly at the transaction type', () => {
    expect(
      getIsPayAmountPrefillEnabled(
        buildSource({
          overrides: { musdConversion: { enabled: false } },
          musdConversion: { enabled: true },
        }),
        'musdConversion',
      ),
    ).toBe(false);
  });

  it('returns the default value when no transaction type is provided', () => {
    expect(
      getIsPayAmountPrefillEnabled(buildSource({ default: { enabled: true } })),
    ).toBe(true);
  });
});
