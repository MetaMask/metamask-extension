import { QuoteResponse } from '@metamask/bridge-controller';
import { act } from '@testing-library/react';

import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { mockSwapConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { TokenStandAndDetails } from '../../../../../store/actions';
import { fetchQuotes } from '../../../../../store/controller-actions/bridge-controller';
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

const mockUseDappSwapComparisonLatencyMetricsResponse = {
  requestDetectionLatency: '1200',
  quoteRequestLatency: '2400',
  quoteResponseLatency: '3600',
  swapComparisonLatency: '1500',
  updateRequestDetectionLatency: jest.fn(),
  updateQuoteRequestLatency: jest.fn(),
  updateQuoteResponseLatency: jest.fn(),
  updateSwapComparisonLatency: jest.fn(),
};
jest.mock('./useDappSwapComparisonLatencyMetrics', () => ({
  useDappSwapComparisonLatencyMetrics: () =>
    mockUseDappSwapComparisonLatencyMetricsResponse,
}));

async function runHook() {
  const response = renderHookWithConfirmContextProvider(
    useDappSwapComparisonInfo,
    getMockConfirmStateForTransaction(mockSwapConfirmation as Confirmation),
  );

  await act(async () => {
    // Ignore
  });

  return response.result.current;
}

const quotes = [
  {
    quote: {
      requestId:
        '0xe00805b32ac0b8ef9a2cb1d2b18a3c3eed1a9190fdfa8e99b718df90d9070026',
      bridgeId: 'kyberswap',
      srcChainId: 42161,
      destChainId: 42161,
      aggregator: 'kyberswap',
      aggregatorType: 'AGG',
      srcTokenAmount: '9913',
      destTokenAmount: '9902',
      minDestTokenAmount: '9703',
      walletAddress: '0x178239802520a9C99DCBD791f81326B70298d629',
      destWalletAddress: '0x178239802520a9C99DCBD791f81326B70298d629',
      bridges: ['kyberswap'],
      protocols: ['kyberswap'],
      steps: [],
      slippage: 2,
    },
    approval: {
      chainId: 42161,
      to: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      from: '0x178239802520a9C99DCBD791f81326B70298d629',
      value: '0x0',
      data: '',
      gasLimit: 63103,
    },
    trade: {
      chainId: 42161,
      to: '0x9dDA6Ef3D919c9bC8885D5560999A3640431e8e6',
      from: '0x178239802520a9C99DCBD791f81326B70298d629',
      value: '0x0',
      data: '',
      gasLimit: 399863,
    },
    estimatedProcessingTimeInSeconds: 0,
  },
  {
    quote: {
      requestId:
        '0xb7e0cdb746800056208ae5408a1755d9c8c10970c067a5e1fbbe768d2f6f626c',
      bridgeId: '0x',
      srcChainId: 42161,
      destChainId: 42161,
      aggregator: 'openocean',
      aggregatorType: 'AGG',
      srcTokenAmount: '9913',
      destTokenAmount: '11104',
      minDestTokenAmount: '10881',
      walletAddress: '0x178239802520a9C99DCBD791f81326B70298d629',
      destWalletAddress: '0x178239802520a9C99DCBD791f81326B70298d629',
      bridges: ['0x'],
      protocols: ['0x'],
      steps: [],
      slippage: 2,
    },
    approval: {
      chainId: 42161,
      to: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      from: '0x178239802520a9C99DCBD791f81326B70298d629',
      value: '0x0',
      data: '',
      gasLimit: 63109,
    },
    trade: {
      chainId: 42161,
      to: '0x9dDA6Ef3D919c9bC8885D5560999A3640431e8e6',
      from: '0x178239802520a9C99DCBD791f81326B70298d629',
      value: '0x0',
      data: '',
      gasLimit: 596053,
    },
    estimatedProcessingTimeInSeconds: 0,
  },
  {
    quote: {
      requestId:
        '0xea157f969eb2bf91ae3f78f461788f3cc789617978e94a56326a94607674e7cf',
      bridgeId: 'openocean',
      srcChainId: 42161,
      destChainId: 42161,
      aggregator: 'openocean',
      aggregatorType: 'AGG',
      srcTokenAmount: '9913',
      destTokenAmount: '10200',
      minDestTokenAmount: '9996',
      walletAddress: '0x178239802520a9C99DCBD791f81326B70298d629',
      destWalletAddress: '0x178239802520a9C99DCBD791f81326B70298d629',
      bridges: ['openocean'],
      protocols: ['openocean'],
      steps: [],
      slippage: 2,
    },
    approval: {
      chainId: 42161,
      to: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      from: '0x178239802520a9C99DCBD791f81326B70298d629',
      value: '0x0',
      data: '',
      gasLimit: 63109,
    },
    trade: {
      chainId: 42161,
      to: '0x9dDA6Ef3D919c9bC8885D5560999A3640431e8e6',
      from: '0x178239802520a9C99DCBD791f81326B70298d629',
      value: '0x0',
      data: '',
      gasLimit: 679877,
    },
    estimatedProcessingTimeInSeconds: 0,
  },
  {
    quote: {
      aggregator: 'openocean',
      requestId:
        '0xf5fe1ea0c87b44825dfc89cc60c3398f1cf83eb49a07e491029e00cb72090ef2',
      bridgeId: 'okx',
      srcChainId: 42161,
      destChainId: 42161,
      srcTokenAmount: '9913',
      destTokenAmount: '1004000',
      minDestTokenAmount: '972870',
      walletAddress: '0x178239802520a9C99DCBD791f81326B70298d629',
      destWalletAddress: '0x178239802520a9C99DCBD791f81326B70298d629',
      bridges: ['okx'],
      protocols: ['okx'],
      steps: [],
      slippage: 2,
    },
    approval: {
      chainId: 42161,
      to: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      from: '0x178239802520a9C99DCBD791f81326B70298d629',
      value: '0x0',
      data: '',
      gasLimit: 62000,
    },
    trade: {
      chainId: 42161,
      to: '0x9dDA6Ef3D919c9bC8885D5560999A3640431e8e6',
      from: '0x178239802520a9C99DCBD791f81326B70298d629',
      value: '0x0',
      data: '',
      gasLimit: 80000,
    },
    estimatedProcessingTimeInSeconds: 0,
  },
] as unknown as QuoteResponse[];

describe('useDappSwapComparisonInfo', () => {
  const fetchQuotesMock = jest.mocked(fetchQuotes);

  beforeEach(() => {
    jest.resetAllMocks();
    fetchQuotesMock.mockResolvedValue(quotes);
  });

  it('initially call updateTransactionEventFragment with loading', async () => {
    await runHook();
    expect(mockUpdateTransactionEventFragment).toHaveBeenLastCalledWith(
      {
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_dapp_comparison: 'loading',
          // eslint-disable-next-line @typescript-eslint/naming-convention
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
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_dapp_comparison: 'completed',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_dapp_commands: '0x0a100604',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_comparison_total_latency_ms: '1500',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_dapp_from_token_simulated_value_usd: '1',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_dapp_minimum_received_value_usd: '0.000000000000972677317872',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_dapp_network_fee_usd: '0.01119466650091628514',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_dapp_request_detection_latency_ms: '1200',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_dapp_to_token_simulated_value_usd: '0.000000000000996995550564',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_mm_from_token_simulated_value_usd: '1',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_mm_minimum_received_value_usd: '0.00000000000097267931748',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_mm_network_fee_usd: '0.00550828904272868',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_mm_quote_provider: 'openocean',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_mm_quote_request_latency_ms: '2400',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_mm_quote_response_latency_ms: '3600',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_mm_slippage: 2,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_mm_to_token_simulated_value_usd: '0.000000000001003803216',
        },
        sensitiveProperties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_from_token_contract:
            '0xfdcc3dd6671eab0709a4c0f3f53de9a333d80798',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_from_token_symbol: 'N/A',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_to_token_contract: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          // eslint-disable-next-line @typescript-eslint/naming-convention
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
      destinationTokenSymbol,
      gasDifference,
      selectedQuote,
      selectedQuoteValueDifference,
      sourceTokenAmount,
      tokenAmountDifference,
      tokenDetails,
    } = await runHook();
    expect(selectedQuote).toEqual(quotes[3]);
    expect(selectedQuoteValueDifference).toBe(0.012494042894187605);
    expect(gasDifference).toBe(0.005686377458187605);
    expect(tokenAmountDifference).toBe(0.006807665436);
    expect(destinationTokenSymbol).toBe('USDC');
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
});
