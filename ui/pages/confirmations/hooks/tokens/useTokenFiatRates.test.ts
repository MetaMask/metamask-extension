import type { Hex } from '@metamask/utils';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import {
  TokenFiatRateRequest,
  useTokenFiatRates,
  useTokenFiatRate,
} from './useTokenFiatRates';

const CHAIN_ID_1_MOCK = '0x123' as Hex;
const CHAIN_ID_2_MOCK = '0x456' as Hex;
const ADDRESS_1_MOCK = '0x1111111111111111111111111111111111111111' as Hex;
const ADDRESS_2_MOCK = '0x2222222222222222222222222222222222222222' as Hex;
const PRICE_1_MOCK = 2;
const PRICE_2_MOCK = 3;
const TICKER_1_MOCK = 'ETH';
const TICKER_2_MOCK = 'MATIC';
const CONVERSION_RATE_1_MOCK = 4;
const CONVERSION_RATE_2_MOCK = 5;
const USD_RATE_1_MOCK = 6;
const USD_RATE_2_MOCK = 7;

const NATIVE_ASSET_ID_1 = `eip155:${Number.parseInt(CHAIN_ID_1_MOCK, 16)}/slip44:60`;
const NATIVE_ASSET_ID_2 = `eip155:${Number.parseInt(CHAIN_ID_2_MOCK, 16)}/slip44:60`;
const TOKEN_ASSET_ID_1 = `eip155:${Number.parseInt(CHAIN_ID_1_MOCK, 16)}/erc20:${ADDRESS_1_MOCK}`;
const TOKEN_ASSET_ID_2 = `eip155:${Number.parseInt(CHAIN_ID_2_MOCK, 16)}/erc20:${ADDRESS_2_MOCK}`;

function createMockState({
  selectedCurrency = 'tst',
  includeNativeRates = true,
  includeTokenPrices = true,
  networkConfigurationsByChainId = {
    [CHAIN_ID_1_MOCK]: {
      chainId: CHAIN_ID_1_MOCK,
      nativeCurrency: TICKER_1_MOCK,
      rpcEndpoints: [{ networkClientId: 'test-1' }],
      defaultRpcEndpointIndex: 0,
    },
    [CHAIN_ID_2_MOCK]: {
      chainId: CHAIN_ID_2_MOCK,
      nativeCurrency: TICKER_2_MOCK,
      rpcEndpoints: [{ networkClientId: 'test-2' }],
      defaultRpcEndpointIndex: 0,
    },
  },
}: {
  selectedCurrency?: string;
  includeNativeRates?: boolean;
  includeTokenPrices?: boolean;
  networkConfigurationsByChainId?: Record<string, object>;
} = {}) {
  const assetsInfo: Record<string, object> = {
    [NATIVE_ASSET_ID_1]: {
      type: 'native',
      decimals: 18,
      symbol: TICKER_1_MOCK,
    },
    [NATIVE_ASSET_ID_2]: {
      type: 'native',
      decimals: 18,
      symbol: TICKER_2_MOCK,
    },
    [TOKEN_ASSET_ID_1]: {
      type: 'erc20',
      decimals: 18,
      symbol: 'T1',
    },
    [TOKEN_ASSET_ID_2]: {
      type: 'erc20',
      decimals: 18,
      symbol: 'T2',
    },
  };

  const assetsPrice: Record<string, object> = {};

  if (includeNativeRates) {
    assetsPrice[NATIVE_ASSET_ID_1] = {
      assetPriceType: 'fungible',
      price: CONVERSION_RATE_1_MOCK,
      usdPrice: USD_RATE_1_MOCK,
      lastUpdated: 1,
    };
    assetsPrice[NATIVE_ASSET_ID_2] = {
      assetPriceType: 'fungible',
      price: CONVERSION_RATE_2_MOCK,
      usdPrice: USD_RATE_2_MOCK,
      lastUpdated: 1,
    };
  }

  if (includeTokenPrices && includeNativeRates) {
    // marketData price is denominated in native currency; multiply by native rate
    assetsPrice[TOKEN_ASSET_ID_1] = {
      assetPriceType: 'fungible',
      price: PRICE_1_MOCK * CONVERSION_RATE_1_MOCK,
      usdPrice: PRICE_1_MOCK * USD_RATE_1_MOCK,
      lastUpdated: 1,
    };
    assetsPrice[TOKEN_ASSET_ID_2] = {
      assetPriceType: 'fungible',
      price: PRICE_2_MOCK * CONVERSION_RATE_2_MOCK,
      usdPrice: PRICE_2_MOCK * USD_RATE_2_MOCK,
      lastUpdated: 1,
    };
  }

  return {
    metamask: {
      selectedCurrency,
      assetsInfo,
      assetsPrice,
      networkConfigurationsByChainId,
    },
  };
}

function runHook({
  requests,
  state = createMockState(),
}: {
  requests: TokenFiatRateRequest[];
  state?: ReturnType<typeof createMockState>;
}) {
  return renderHookWithProvider(() => useTokenFiatRates(requests), state).result
    .current;
}

function runSingleHook({
  tokenAddress,
  chainId,
  currency,
  state = createMockState(),
}: {
  tokenAddress: Hex;
  chainId: Hex;
  currency?: string;
  state?: ReturnType<typeof createMockState>;
}) {
  return renderHookWithProvider(
    () => useTokenFiatRate(tokenAddress, chainId, currency),
    state,
  ).result.current;
}

describe('useTokenFiatRates', () => {
  it('returns fiat rates calculated from price and conversion rate', () => {
    const result = runHook({
      requests: [
        {
          address: ADDRESS_1_MOCK,
          chainId: CHAIN_ID_1_MOCK,
        },
        {
          address: ADDRESS_2_MOCK,
          chainId: CHAIN_ID_2_MOCK,
        },
      ],
    });

    expect(result).toEqual([
      PRICE_1_MOCK * CONVERSION_RATE_1_MOCK,
      PRICE_2_MOCK * CONVERSION_RATE_2_MOCK,
    ]);
  });

  it('returns conversion rate only if token price not found', () => {
    const result = runHook({
      requests: [
        {
          address: '0xInvalidAddress' as Hex,
          chainId: CHAIN_ID_1_MOCK,
        },
      ],
    });

    expect(result).toEqual([CONVERSION_RATE_1_MOCK]);
  });

  it('returns USD conversion rates if currency is USD', () => {
    const result = runHook({
      requests: [
        {
          address: ADDRESS_1_MOCK,
          chainId: CHAIN_ID_1_MOCK,
          currency: 'usd',
        },
        {
          address: ADDRESS_2_MOCK,
          chainId: CHAIN_ID_2_MOCK,
          currency: 'usd',
        },
      ],
    });

    expect(result).toEqual([
      PRICE_1_MOCK * USD_RATE_1_MOCK,
      PRICE_2_MOCK * USD_RATE_2_MOCK,
    ]);
  });

  it('returns undefined if network configuration not found', () => {
    const result = runHook({
      requests: [
        {
          address: ADDRESS_1_MOCK,
          chainId: '0xUnknownChain' as Hex,
        },
      ],
    });

    expect(result).toEqual([undefined]);
  });

  it('returns undefined if conversion rate not found', () => {
    const result = runHook({
      requests: [
        {
          address: ADDRESS_1_MOCK,
          chainId: CHAIN_ID_1_MOCK,
        },
      ],
      state: createMockState({
        includeNativeRates: false,
        includeTokenPrices: false,
      }),
    });

    expect(result).toEqual([undefined]);
  });

  it('handles empty requests array', () => {
    const result = runHook({
      requests: [],
    });

    expect(result).toEqual([]);
  });

  it('handles mixed valid and invalid requests', () => {
    const result = runHook({
      requests: [
        {
          address: ADDRESS_1_MOCK,
          chainId: CHAIN_ID_1_MOCK,
        },
        {
          address: ADDRESS_1_MOCK,
          chainId: '0xUnknownChain' as Hex,
        },
        {
          address: ADDRESS_2_MOCK,
          chainId: CHAIN_ID_2_MOCK,
        },
      ],
    });

    expect(result).toEqual([
      PRICE_1_MOCK * CONVERSION_RATE_1_MOCK,
      undefined,
      PRICE_2_MOCK * CONVERSION_RATE_2_MOCK,
    ]);
  });
});

describe('useTokenFiatRate', () => {
  it('returns fiat rate for a single token', () => {
    const result = runSingleHook({
      tokenAddress: ADDRESS_1_MOCK,
      chainId: CHAIN_ID_1_MOCK,
    });

    expect(result).toBe(PRICE_1_MOCK * CONVERSION_RATE_1_MOCK);
  });

  it('returns undefined for unknown chain', () => {
    const result = runSingleHook({
      tokenAddress: ADDRESS_1_MOCK,
      chainId: '0xUnknownChain' as Hex,
    });

    expect(result).toBeUndefined();
  });

  it('uses USD conversion rate when currency is usd', () => {
    const result = runSingleHook({
      tokenAddress: ADDRESS_1_MOCK,
      chainId: CHAIN_ID_1_MOCK,
      currency: 'usd',
    });

    expect(result).toBe(PRICE_1_MOCK * USD_RATE_1_MOCK);
  });
});
