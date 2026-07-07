import { getMockAssetsPrice } from './constants';

const DEFAULT_FIXTURE_ACCOUNT_ID = 'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4';

/** Aggregated homepage fiat total for bridge fixtures (3 enabled EVM chains). */
export const BRIDGE_EXPECTED_FIAT_BALANCE_USD = 225_730.11;

/** Mainnet native ETH after HST deploy gas on the local Anvil node. */
export const BRIDGE_MAINNET_ETH_BALANCE_AFTER_HST = 24.998;

export const BRIDGE_L2_ETH_BALANCE_PER_CHAIN = 25;

/** Total native ETH across mainnet + Linea + Arbitrum in standard bridge fixtures. */
export const BRIDGE_TOTAL_ETH_BALANCE_HUMAN =
  BRIDGE_MAINNET_ETH_BALANCE_AFTER_HST + BRIDGE_L2_ETH_BALANCE_PER_CHAIN * 2;

/** Total native ETH on mainnet + Linea + Arbitrum when each chain has 25 ETH (L2 bridge E2E). */
export const BRIDGE_L2_TOTAL_ETH_BALANCE_HUMAN =
  BRIDGE_L2_ETH_BALANCE_PER_CHAIN * 3;

export const BRIDGE_ETH_USD_SPOT_PRICE =
  BRIDGE_EXPECTED_FIAT_BALANCE_USD / BRIDGE_TOTAL_ETH_BALANCE_HUMAN;

export const BRIDGE_L2_ETH_USD_SPOT_PRICE =
  BRIDGE_EXPECTED_FIAT_BALANCE_USD / BRIDGE_L2_TOTAL_ETH_BALANCE_HUMAN;

export const BRIDGE_MOCK_CURRENCY_RATES = {
  currencyRates: {
    ETH: {
      conversionDate: 1665507609.0,
      conversionRate: BRIDGE_ETH_USD_SPOT_PRICE,
      usdConversionRate: BRIDGE_ETH_USD_SPOT_PRICE,
    },
  },
};

export const BRIDGE_L2_MOCK_CURRENCY_RATES = {
  currencyRates: {
    ETH: {
      conversionDate: 1665507609.0,
      conversionRate: BRIDGE_L2_ETH_USD_SPOT_PRICE,
      usdConversionRate: BRIDGE_L2_ETH_USD_SPOT_PRICE,
    },
  },
};

/** Native ETH balances seeded for mainnet bridge fixtures (mainnet loses gas to HST deploy). */
export function getBridgeFixtureAssetsBalance() {
  return {
    [DEFAULT_FIXTURE_ACCOUNT_ID]: {
      'eip155:1/slip44:60': {
        amount: String(BRIDGE_MAINNET_ETH_BALANCE_AFTER_HST),
      },
      'eip155:59144/slip44:60': {
        amount: String(BRIDGE_L2_ETH_BALANCE_PER_CHAIN),
      },
      'eip155:42161/slip44:60': {
        amount: String(BRIDGE_L2_ETH_BALANCE_PER_CHAIN),
      },
    },
  };
}

/** Native ETH balances seeded for L2 bridge fixtures (25 ETH on each enabled chain). */
export function getBridgeL2FixtureAssetsBalance() {
  return {
    [DEFAULT_FIXTURE_ACCOUNT_ID]: {
      'eip155:1/slip44:60': { amount: String(BRIDGE_L2_ETH_BALANCE_PER_CHAIN) },
      'eip155:59144/slip44:60': {
        amount: String(BRIDGE_L2_ETH_BALANCE_PER_CHAIN),
      },
      'eip155:42161/slip44:60': {
        amount: String(BRIDGE_L2_ETH_BALANCE_PER_CHAIN),
      },
    },
  };
}

export const BRIDGE_UNIFIED_EVM_ACCOUNTS_API_BALANCES = {
  mainnetNativeEthHuman: String(BRIDGE_MAINNET_ETH_BALANCE_AFTER_HST),
  nativeBalance: String(BRIDGE_L2_ETH_BALANCE_PER_CHAIN),
};

export const BRIDGE_L2_UNIFIED_EVM_ACCOUNTS_API_BALANCES = {
  nativeBalance: String(BRIDGE_L2_ETH_BALANCE_PER_CHAIN),
};

export function getBridgeAssetsControllerConfig() {
  return {
    assetsBalance: getBridgeFixtureAssetsBalance(),
    assetsPrice: getMockAssetsPrice(BRIDGE_ETH_USD_SPOT_PRICE),
  };
}

export function getBridgeL2AssetsControllerConfig() {
  return {
    assetsBalance: getBridgeL2FixtureAssetsBalance(),
    assetsPrice: getMockAssetsPrice(BRIDGE_L2_ETH_USD_SPOT_PRICE),
  };
}

export const BRIDGE_WITH_FIXTURES_OPTIONS = {
  ethConversionInUsd: BRIDGE_ETH_USD_SPOT_PRICE,
  unifiedEvmAccountsApiBalances: BRIDGE_UNIFIED_EVM_ACCOUNTS_API_BALANCES,
};

export const BRIDGE_L2_WITH_FIXTURES_OPTIONS = {
  ethConversionInUsd: BRIDGE_L2_ETH_USD_SPOT_PRICE,
  unifiedEvmAccountsApiBalances: BRIDGE_L2_UNIFIED_EVM_ACCOUNTS_API_BALANCES,
};
