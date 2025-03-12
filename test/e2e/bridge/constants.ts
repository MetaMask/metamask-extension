import type { FeatureFlagResponse } from '../../../../shared/types/bridge';

export const DEFAULT_FEATURE_FLAGS_RESPONSE: FeatureFlagResponse = {
  'extension-config': {
    refreshRate: 30000,
    maxRefreshCount: 5,
    support: false,
    chains: {
      '1': { isActiveSrc: true, isActiveDest: true },
      '42161': { isActiveSrc: true, isActiveDest: true },
      '59144': { isActiveSrc: true, isActiveDest: true },
    },
  },
};

export const LOCATOR = {
  MM_IMPORT_TOKENS_MODAL: (suffix: string) =>
    `[data-testid="import-tokens-modal-${suffix}"]`,
};

export const ETH_CONVERSION_RATE_USD = 3010;
export const MOCK_CURRENCY_RATES = {
  currencyRates: {
    ETH: {
      conversionDate: 1665507609.0,
      conversionRate: ETH_CONVERSION_RATE_USD,
      usdConversionRate: ETH_CONVERSION_RATE_USD,
    },
  },
};
