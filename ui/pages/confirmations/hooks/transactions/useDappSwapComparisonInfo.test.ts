import { QuoteResponse } from '@metamask/bridge-controller';
import { act } from '@testing-library/react';

import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { TokenStandAndDetails } from '../../../../store/actions';
import { fetchQuotes } from '../../../../store/controller-actions/bridge-controller';
import * as Utils from '../../../../helpers/utils/util';
import * as TokenUtils from '../../utils/token';
import { Confirmation } from '../../types/confirm';
import { useDappSwapComparisonInfo } from './useDappSwapComparisonInfo';

jest.useFakeTimers();

const mockUpdateTransactionEventFragment = jest.fn();
jest.mock('../../hooks/useTransactionEventFragment', () => ({
  useTransactionEventFragment: () => ({
    updateTransactionEventFragment: mockUpdateTransactionEventFragment,
  }),
}));

jest.mock('../../../../store/controller-actions/bridge-controller', () => ({
  ...jest.requireActual(
    '../../../../store/controller-actions/bridge-controller',
  ),
  fetchQuotes: jest.fn(),
}));

const confirmationDataMock = {
  time: new Date().getTime(),
  chainId: '0xa4b1',
  id: '66b489a0-aa87-11f0-a866-c513455971f9',
  networkClientId: 'cc8a125a-ac7e-4390-8ac9-02cb19a9a116',
  origin: 'https://app.uniswap.org',
  status: 'unapproved',
  txParams: {
    from: '0x178239802520a9c99dcbd791f81326b70298d629',
    data: '0x3593564c000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000068f0e4df000000000000000000000000000000000000000000000000000000000000000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000003c0000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000003070b0e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000002a000000000000000000000000000000000000000000000000000000000000001a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000af88d065e77c8cc2239327c5edb3a432268e583100000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000002710000000000000000000000000000000000000000000000000000000000000261600000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000fd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb900000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000af88d065e77c8cc2239327c5edb3a432268e5831000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000060000000000000000000000000fd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9000000000000000000000000178239802520a9c99dcbd791f81326b70298d62900000000000000000000000000000000000000000000000000000000000000000c',
    gas: '0x2af63',
    to: '0xa51afafe0263b40edaef0df8781ea9aa03e381a3',
    value: '0x0',
    estimatedBaseFee: '0xe4e1c0',
    maxFeePerGas: '0xe4e1c0',
    maxPriorityFeePerGas: '0xe4e1c0',
    type: '0x2',
  },
  type: 'contractInteraction',
  simulationData: {
    tokenBalanceChanges: [
      {
        address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
        standard: 'erc20',
        previousBalance: '0x61467',
        newBalance: '0x5ed57',
        difference: '0x2710',
        isDecrease: true,
      },
      {
        address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
        standard: 'erc20',
        previousBalance: '0x2af0',
        newBalance: '0x51fa',
        difference: '0x270a',
        isDecrease: false,
      },
    ],
  },
};

async function runHook() {
  const response = renderHookWithConfirmContextProvider(
    useDappSwapComparisonInfo,
    getMockConfirmStateForTransaction(confirmationDataMock as Confirmation),
  );

  await act(async () => {
    // Ignore
  });

  return response.result.current;
}

describe('useDappSwapComparisonInfo', () => {
  const fetchQuotesMock = jest.mocked(fetchQuotes);

  beforeEach(() => {
    jest.resetAllMocks();

    fetchQuotesMock.mockResolvedValue([
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
          destTokenAmount: '9907',
          minDestTokenAmount: '9708',
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
          gasLimit: 63109,
        },
        trade: {
          chainId: 42161,
          to: '0x9dDA6Ef3D919c9bC8885D5560999A3640431e8e6',
          from: '0x178239802520a9C99DCBD791f81326B70298d629',
          value: '0x0',
          data: '',
          gasLimit: 296174,
        },
        estimatedProcessingTimeInSeconds: 0,
      },
    ] as unknown as QuoteResponse[]);
  });

  it('initially call updateTransactionEventFragment with loading', async () => {
    await runHook();
    expect(mockUpdateTransactionEventFragment).toHaveBeenLastCalledWith(
      {
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          dapp_swap_comparison: 'loading',
        },
      },
      '66b489a0-aa87-11f0-a866-c513455971f9',
    );
  });

  it('updateTransactionEventFragment with all values', async () => {
    jest.spyOn(Utils, 'fetchTokenExchangeRates').mockResolvedValue({
      '0x0000000000000000000000000000000000000000': 4052.27,
      '0xaf88d065e77c8cC2239327C5EDb3A432268e5831': 0.999804,
      '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9': 1,
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
          dapp_swap_comparison: 'completed',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_comparison_total_latency_ms: '0',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_dapp_from_token_simulated_value_usd: '0.00999804',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_dapp_minimum_received_value_usd: '0.00975',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_dapp_network_fee_usd: '0.01069623006255',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_dapp_request_detection_latency_ms: '0',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_dapp_to_token_simulated_value_usd: '0.009994',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_mm_from_token_simulated_value_usd: '0.00999804',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_mm_minimum_received_value_usd: '0.009708',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_mm_network_fee_usd: '0.02183867583615',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_mm_quote_provider: 'openocean',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_mm_quote_request_latency_ms: '0',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_mm_quote_response_latency_ms: '0',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_mm_slippage: 2,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_mm_to_token_simulated_value_usd: '0.009907',
        },
        sensitiveProperties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_from_token_contract:
            '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_from_token_symbol: 'USDC',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_to_token_contract: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_to_token_symbol: 'USDT',
        },
      },
      '66b489a0-aa87-11f0-a866-c513455971f9',
    );
  });
});
