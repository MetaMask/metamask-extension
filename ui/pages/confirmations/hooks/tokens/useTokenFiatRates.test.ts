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

const MAINNET_CHAIN_ID_MOCK = '0x1' as Hex;
const USDC_MAINNET_ADDRESS_MOCK =
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as Hex;
const USDC_MAINNET_CHECKSUM_ADDRESS_MOCK =
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Hex;
const MUSD_MAINNET_ADDRESS_MOCK =
  '0xaca92e438df0b2401ff60da7e4337b687a2435da' as Hex;

function createMockState({
  currentCurrency = 'tst',
  currencyRates = {
    [TICKER_1_MOCK]: {
      conversionRate: CONVERSION_RATE_1_MOCK,
      usdConversionRate: USD_RATE_1_MOCK,
    },
    [TICKER_2_MOCK]: {
      conversionRate: CONVERSION_RATE_2_MOCK,
      usdConversionRate: USD_RATE_2_MOCK,
    },
  },
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
    [MAINNET_CHAIN_ID_MOCK]: {
      chainId: MAINNET_CHAIN_ID_MOCK,
      nativeCurrency: TICKER_1_MOCK,
      rpcEndpoints: [{ networkClientId: 'test-mainnet' }],
      defaultRpcEndpointIndex: 0,
    },
  },
  marketData = {
    [CHAIN_ID_1_MOCK]: {
      [ADDRESS_1_MOCK]: {
        tokenAddress: ADDRESS_1_MOCK,
        price: PRICE_1_MOCK,
      },
    },
    [CHAIN_ID_2_MOCK]: {
      [ADDRESS_2_MOCK]: {
        tokenAddress: ADDRESS_2_MOCK,
        price: PRICE_2_MOCK,
      },
    },
    // Deliberately priced away from $1 so the peg is distinguishable from the
    // market-data path.
    [MAINNET_CHAIN_ID_MOCK]: {
      [USDC_MAINNET_CHECKSUM_ADDRESS_MOCK]: {
        tokenAddress: USDC_MAINNET_CHECKSUM_ADDRESS_MOCK,
        price: PRICE_1_MOCK,
      },
    },
  },
  remoteFeatureFlags = {},
}: {
  currentCurrency?: string;
  currencyRates?: Record<
    string,
    { conversionRate: number; usdConversionRate: number }
  >;
  networkConfigurationsByChainId?: Record<string, object>;
  marketData?: Record<
    string,
    Record<string, { tokenAddress: string; price: number }>
  >;
  remoteFeatureFlags?: Record<string, unknown>;
} = {}) {
  return {
    metamask: {
      currentCurrency,
      currencyRates,
      networkConfigurationsByChainId,
      marketData,
      remoteFeatureFlags,
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
        currencyRates: {},
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

  describe('stablecoins', () => {
    it('returns exactly 1 for a stablecoin when currency is USD', () => {
      const result = runHook({
        requests: [
          {
            address: USDC_MAINNET_ADDRESS_MOCK,
            chainId: MAINNET_CHAIN_ID_MOCK,
            currency: 'usd',
          },
        ],
      });

      expect(result).toEqual([1]);
    });

    it('ignores market data for a stablecoin when currency is USD', () => {
      const result = runHook({
        requests: [
          {
            address: USDC_MAINNET_ADDRESS_MOCK,
            chainId: MAINNET_CHAIN_ID_MOCK,
            currency: 'usd',
          },
        ],
      });

      expect(result).not.toEqual([PRICE_1_MOCK * USD_RATE_1_MOCK]);
    });

    it('matches a checksummed stablecoin address', () => {
      const result = runHook({
        requests: [
          {
            address: USDC_MAINNET_CHECKSUM_ADDRESS_MOCK,
            chainId: MAINNET_CHAIN_ID_MOCK,
            currency: 'usd',
          },
        ],
      });

      expect(result).toEqual([1]);
    });

    it('matches an uppercase USD currency override', () => {
      const result = runHook({
        requests: [
          {
            address: USDC_MAINNET_ADDRESS_MOCK,
            chainId: MAINNET_CHAIN_ID_MOCK,
            currency: 'USD',
          },
        ],
      });

      expect(result).toEqual([1]);
    });

    it('returns 1 for MUSD when currency is USD', () => {
      const result = runHook({
        requests: [
          {
            address: MUSD_MAINNET_ADDRESS_MOCK,
            chainId: MAINNET_CHAIN_ID_MOCK,
            currency: 'usd',
          },
        ],
      });

      expect(result).toEqual([1]);
    });

    // A EUR-denominated stablecoin balance still needs a real conversion.
    it('does not peg a stablecoin when currency is not USD', () => {
      const result = runHook({
        requests: [
          {
            address: USDC_MAINNET_ADDRESS_MOCK,
            chainId: MAINNET_CHAIN_ID_MOCK,
          },
        ],
      });

      expect(result).toEqual([PRICE_1_MOCK * CONVERSION_RATE_1_MOCK]);
    });

    it('does not peg a non-stablecoin when currency is USD', () => {
      const result = runHook({
        requests: [
          {
            address: ADDRESS_1_MOCK,
            chainId: CHAIN_ID_1_MOCK,
            currency: 'usd',
          },
        ],
      });

      expect(result).toEqual([PRICE_1_MOCK * USD_RATE_1_MOCK]);
    });

    it('does not peg a stablecoin address on a different chain', () => {
      const result = runHook({
        requests: [
          {
            address: USDC_MAINNET_ADDRESS_MOCK,
            chainId: CHAIN_ID_1_MOCK,
            currency: 'usd',
          },
        ],
      });

      // Not in the mock market data for this chain, so it takes the existing
      // missing-price path rather than the peg.
      expect(result).toEqual([USD_RATE_1_MOCK]);
    });

    it('pegs a stablecoin supplied by the remote flag', () => {
      const result = runHook({
        requests: [
          {
            address: ADDRESS_1_MOCK,
            chainId: CHAIN_ID_1_MOCK,
            currency: 'usd',
          },
        ],
        state: createMockState({
          remoteFeatureFlags: {
            stableTokens: { [CHAIN_ID_1_MOCK]: [ADDRESS_1_MOCK] },
          },
        }),
      });

      expect(result).toEqual([1]);
    });

    it('stops pegging a default stablecoin when the flag omits it', () => {
      const result = runHook({
        requests: [
          {
            address: USDC_MAINNET_ADDRESS_MOCK,
            chainId: MAINNET_CHAIN_ID_MOCK,
            currency: 'usd',
          },
        ],
        state: createMockState({
          remoteFeatureFlags: {
            stableTokens: { [CHAIN_ID_1_MOCK]: [ADDRESS_1_MOCK] },
          },
        }),
      });

      expect(result).toEqual([PRICE_1_MOCK * USD_RATE_1_MOCK]);
    });

    it('pegs only the stablecoin entries in a batch', () => {
      const result = runHook({
        requests: [
          {
            address: USDC_MAINNET_ADDRESS_MOCK,
            chainId: MAINNET_CHAIN_ID_MOCK,
            currency: 'usd',
          },
          {
            address: ADDRESS_1_MOCK,
            chainId: CHAIN_ID_1_MOCK,
            currency: 'usd',
          },
        ],
      });

      expect(result).toEqual([1, PRICE_1_MOCK * USD_RATE_1_MOCK]);
    });
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
