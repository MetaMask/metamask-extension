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
  },
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
} = {}) {
  return {
    metamask: {
      currentCurrency,
      currencyRates,
      networkConfigurationsByChainId,
      marketData,
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
