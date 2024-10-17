import { FeatureFlagResponse } from '../../../../ui/pages/bridge/types';

export const DEFAULT_FEATURE_FLAGS_RESPONSE: FeatureFlagResponse = {
  'extension-config': {
    refreshRate: 30,
    maxRefreshCount: 5,
  },
  'extension-support': false,
  'src-network-allowlist': [1, 42161, 59144],
  'dest-network-allowlist': [1, 42161, 59144],
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
