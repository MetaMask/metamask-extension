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

export const BRIDGE_SOLANA_USD_SPOT_PRICE = 112.87;

/**
 * Non-native USD spot prices served by the price API mock. Assets missing here
 * have no price, which is what makes the bridge UI fall back to showing a
 * quote's Total cost as a native network fee instead of a fiat amount.
 */
export const BRIDGE_MOCK_TOKEN_SPOT_PRICES: Record<
  string,
  { id: string; price: number }
> = {
  'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f': {
    id: 'dai',
    price: 1.0,
  },
  'eip155:59144/erc20:0x6b175474e89094c44da98b954eedeac495271d0f': {
    id: 'dai',
    price: 1.0,
  },
  'eip155:1/erc20:0xaca92e438df0b2401ff60da7e4337b687a2435da': {
    id: 'musd',
    price: 0.9999,
  },
};

/**
 * Resolves the USD spot price the price API mock serves for an asset, or
 * `undefined` when the asset is unpriced.
 *
 * @param assetId - CAIP-19 asset id.
 * @param ethUsdSpotPrice - Native ETH price for the fixture set in use.
 */
export function getBridgeMockUsdSpotPrice(
  assetId: string,
  ethUsdSpotPrice: number = BRIDGE_ETH_USD_SPOT_PRICE,
): number | undefined {
  if (assetId.endsWith('/slip44:60') || assetId.endsWith('/slip44:1')) {
    return ethUsdSpotPrice;
  }
  if (assetId.startsWith('solana:')) {
    return BRIDGE_SOLANA_USD_SPOT_PRICE;
  }
  return BRIDGE_MOCK_TOKEN_SPOT_PRICES[assetId.toLowerCase()]?.price;
}

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
