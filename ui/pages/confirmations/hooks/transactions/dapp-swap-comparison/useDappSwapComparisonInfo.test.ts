/* eslint-disable @typescript-eslint/naming-convention */
import { act } from '@testing-library/react';

import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import {
  mockBridgeQuotes,
  mockSwapConfirmation,
} from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { TokenStandAndDetails } from '../../../../../store/actions';
import { getRemoteFeatureFlags } from '../../../../../selectors/remote-feature-flags';
import * as Utils from '../../../../../helpers/utils/util';
import * as TokenUtils from '../../../utils/token';
import { Confirmation } from '../../../types/confirm';
import { useDappSwapComparisonInfo } from './useDappSwapComparisonInfo';

jest.useFakeTimers();

const mockUpdateTransactionEventFragment = jest.fn();
jest.mock('../../../hooks/useTransactionEventFragment', () => ({
  useTransactionEventFragment: () => ({
    updateTransactionEventFragment: mockUpdateTransactionEventFragment,
  }),
}));

jest.mock('../../../../../store/controller-actions/bridge-controller', () => ({
  ...jest.requireActual(
    '../../../../../store/controller-actions/bridge-controller',
  ),
  fetchQuotes: jest.fn(),
}));

jest.mock('../../../../../selectors/remote-feature-flags');

const mockUseDappSwapComparisonLatencyMetricsResponse = {
  requestDetectionLatency: '1200',
  updateRequestDetectionLatency: jest.fn(),
  updateSwapComparisonLatency: jest.fn().mockReturnValue('1500'),
};

jest.mock('./useDappSwapComparisonLatencyMetrics', () => ({
  useDappSwapComparisonLatencyMetrics: () =>
    mockUseDappSwapComparisonLatencyMetricsResponse,
}));

const mockGetRemoteFeatureFlags = jest.mocked(getRemoteFeatureFlags);

async function runHook(args: Record<string, unknown> = {}) {
  const response = renderHookWithConfirmContextProvider(
    () => useDappSwapComparisonInfo(),
    getMockConfirmStateForTransaction(mockSwapConfirmation as Confirmation, {
      metamask: {
        dappSwapComparisonData: {
          '1234567': {
            quotes: mockBridgeQuotes,
            latency: 3600,
            commands: '0x0a100604',
            swapInfo: {
              srcTokenAddress: '0xfdcc3dd6671eab0709a4c0f3f53de9a333d80798',
              destTokenAddress: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
              srcTokenAmount: '0x0de0b6b3a7640000',
              destTokenAmountMin: '0x0de0b6b3a7640000',
            },
            ...args,
          },
        },
      },
    }),
  );

  await act(async () => {
    // Ignore
  });

  return response.result.current;
}

describe('useDappSwapComparisonInfo', () => {
  beforeEach(() => {
    mockGetRemoteFeatureFlags.mockReturnValue({
      dappSwapQa: { enabled: true },
      dappSwapUi: { enabled: true, threshold: 0.01 },
    });
  });

  it('initially call updateTransactionEventFragment with loading', async () => {
    await runHook();
    expect(mockUpdateTransactionEventFragment).toHaveBeenNthCalledWith(
      1,
      {
        properties: {
          swap_dapp_comparison: 'loading',
          swap_dapp_commands: '0x0a100604',
        },
      },
      'f8172040-b3d0-11f0-a882-3f99aa2e9f0c',
    );
  });

  it('updateTransactionEventFragment with all values', async () => {
    jest.spyOn(Utils, 'fetchTokenExchangeRates').mockResolvedValue({
      '0x0000000000000000000000000000000000000000': 4052.27,
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 0.999804,
      '0xfdcc3dd6671eab0709a4c0f3f53de9a333d80798': 1,
    });
    jest.spyOn(TokenUtils, 'fetchAllTokenDetails').mockResolvedValue({
      '0xaf88d065e77c8cc2239327c5edb3a432268e5831': {
        symbol: 'USDC',
        decimals: '6',
      } as TokenStandAndDetails,
      '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': {
        symbol: 'USDT',
        decimals: '6',
      } as TokenStandAndDetails,
    });

    await runHook();
    expect(mockUpdateTransactionEventFragment).toHaveBeenLastCalledWith(
      {
        properties: {
          swap_dapp_comparison: 'completed',
          swap_dapp_commands: '0x0a100604',
          swap_comparison_total_latency_ms: '1500',
          swap_dapp_from_token_simulated_value_usd: '1',
          swap_dapp_minimum_received_value_usd: '0.999804',
          swap_dapp_network_fee_usd: '0.01119466650091628514',
          swap_dapp_to_token_simulated_value_usd: '0.000000000000996995550564',
          swap_mm_from_token_simulated_value_usd: '1',
          swap_mm_minimum_received_value_usd: '0.00000000000097267931748',
          swap_mm_network_fee_usd: '0.00550828904272868',
          swap_mm_quote_provider: 'openocean',
          swap_mm_quote_response_latency_ms: '3600',
          swap_mm_slippage: 2,
          swap_mm_to_token_simulated_value_usd: '0.000000000001003803216',
        },
        sensitiveProperties: {
          swap_from_token_contract:
            '0xfdcc3dd6671eab0709a4c0f3f53de9a333d80798',
          swap_from_token_symbol: 'N/A',
          swap_to_token_contract: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          swap_to_token_symbol: 'N/A',
        },
      },
      'f8172040-b3d0-11f0-a882-3f99aa2e9f0c',
    );
  });

  it('return correct values', async () => {
    jest.spyOn(Utils, 'fetchTokenExchangeRates').mockResolvedValue({
      '0x0000000000000000000000000000000000000000': 4052.27,
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 0.999804,
      '0xfdcc3dd6671eab0709a4c0f3f53de9a333d80798': 1,
    });
    jest.spyOn(TokenUtils, 'fetchAllTokenDetails').mockResolvedValue({
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': {
        symbol: 'USDC',
        decimals: '6',
      } as TokenStandAndDetails,
      '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': {
        symbol: 'USDT',
        decimals: '6',
      } as TokenStandAndDetails,
    });

    const {
      fiatRates,
      selectedQuote,
      selectedQuoteValueDifference,
      sourceTokenAmount,
      tokenAmountDifference,
      tokenDetails,
    } = await runHook({
      swapInfo: {
        srcTokenAddress: '0xfdcc3dd6671eab0709a4c0f3f53de9a333d80798',
        destTokenAddress: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        srcTokenAmount: '0x0de0b6b3a7640000',
        destTokenAmountMin: '0x0',
      },
    });
    expect(selectedQuote).toEqual(mockBridgeQuotes[3]);
    expect(selectedQuoteValueDifference).toBe(0.012494042894187605);
    expect(tokenAmountDifference).toBe(0.006807665436);
    expect(sourceTokenAmount).toBe('0x0de0b6b3a7640000');
    expect(tokenDetails).toEqual({
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': {
        symbol: 'USDC',
        decimals: '6',
      },
      '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': {
        decimals: '6',
        symbol: 'USDT',
      },
    });
    expect(fiatRates).toEqual({
      '0x0000000000000000000000000000000000000000': 4052.27,
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 0.999804,
      '0xfdcc3dd6671eab0709a4c0f3f53de9a333d80798': 1,
    });
  });

  it('return quote calculation values as zero if dappSwapUi is not enabled', async () => {
    mockGetRemoteFeatureFlags.mockReturnValue({
      dappSwapQa: { enabled: true },
      dappSwapUi: { enabled: false, threshold: 0.01 },
    });
    jest.spyOn(Utils, 'fetchTokenExchangeRates').mockResolvedValue({
      '0x0000000000000000000000000000000000000000': 4052.27,
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 0.999804,
      '0xfdcc3dd6671eab0709a4c0f3f53de9a333d80798': 1,
    });
    jest.spyOn(TokenUtils, 'fetchAllTokenDetails').mockResolvedValue({
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': {
        symbol: 'USDC',
        decimals: '6',
      } as TokenStandAndDetails,
      '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': {
        symbol: 'USDT',
        decimals: '6',
      } as TokenStandAndDetails,
    });

    const {
      selectedQuote,
      selectedQuoteValueDifference,
      tokenAmountDifference,
    } = await runHook({
      swapInfo: {
        srcTokenAddress: '0xfdcc3dd6671eab0709a4c0f3f53de9a333d80798',
        destTokenAddress: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        srcTokenAmount: '0x0de0b6b3a7640000',
        destTokenAmountMin: '0x0',
      },
    });
    expect(selectedQuote).toEqual(mockBridgeQuotes[3]);
    expect(selectedQuoteValueDifference).toBe(0);
    expect(tokenAmountDifference).toBe(0);
  });
});
