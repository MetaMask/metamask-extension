import { FeatureFlagResponse } from '../../../../ui/pages/bridge/bridge.util';

export const DEFAULT_FEATURE_FLAGS_RESPONSE: FeatureFlagResponse = {
  'extension-support': false,
  'src-network-allowlist': [1, 42161, 59144],
  'dest-network-allowlist': [1, 42161, 59144],
};

export const LOCATOR = {
  // bridge
  BRIDGE_BUTTON: (prefix: string) =>
    `[data-testid="${prefix}-overview-bridge"]`,
  BRIDGE_ASSET_PICKER: (prefix: string) =>
    `[data-testid="${prefix}-token-picker"]`,
  BRIDGE_FROM_AMOUNT: '[data-testid="from-amount"]',
  BRIDGE_TO_AMOUNT: '[data-testid="to-amount"]',
  // mutichain asset picker
  ASSET_PICKER_NETWORK: '[data-testid="multichain-asset-picker__network"]',
  ASSET_PICKER_SEARCH: '[id="multichain-asset-picker__asset-search"]',
  ASSET_PICKER_ITEM: (symbol: string) => ({
    css: `[data-testid="searchable-item-list__item"]`,
    text: symbol,
  }),
  // wallet
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
