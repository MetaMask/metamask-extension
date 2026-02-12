import { act, waitFor } from '@testing-library/react';
import { cloneDeep } from 'lodash';
import { PAYMENT_TYPES } from '@metamask/subscription-controller';
import type { Hex } from '@metamask/utils';
import { addHexPrefix } from 'ethereumjs-util';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import { GasEstimateTypes } from '../../../shared/constants/gas';
import { decGWEIToHexWEI } from '../../../shared/modules/conversion.utils';
import * as actions from '../../store/actions';
import { useGasFeeEstimates } from '../useGasFeeEstimates';
import type { MetaMaskReduxState } from '../../store/store';
import { useSubscriptionCryptoApprovalTransaction } from './useSubscription';
import * as subscriptionPricingHooks from './useSubscriptionPricing';
import type { TokenWithApprovalAmount } from './useSubscriptionPricing';

jest.mock('../useGasFeeEstimates');
jest.mock('./useSubscriptionPricing');
jest.mock('../../store/actions', () => ({
  ...jest.requireActual('../../store/actions'),
  estimateGas: jest.fn().mockResolvedValue('0x5208'),
  addTransaction: jest.fn().mockResolvedValue({}),
  getSubscriptionPricing: jest.fn().mockResolvedValue({}),
}));

const mockUseGasFeeEstimates = jest.mocked(useGasFeeEstimates);
const mockAddTransaction = jest.mocked(actions.addTransaction);
const mockUseSubscriptionPricing = jest.mocked(
  subscriptionPricingHooks.useSubscriptionPricing,
);

const MOCK_SELECTED_TOKEN = {
  chainId: '0x1' as Hex,
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Hex,
  approvalAmount: {
    approveAmount: '1000000',
    chainId: '0x1' as Hex,
    paymentAddress: '0x1234567890123456789012345678901234567890' as Hex,
    paymentTokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Hex,
  },
} satisfies Pick<
  TokenWithApprovalAmount,
  'chainId' | 'address' | 'approvalAmount'
>;

/**
 * Helper to mock EIP-1559 fee market gas estimates
 *
 * @param lowPriorityFee
 * @param mediumPriorityFee
 * @param baseFee
 */
function mockFeeMarketGasEstimates(
  lowPriorityFee: string,
  mediumPriorityFee: string,
  baseFee: string,
) {
  mockUseGasFeeEstimates.mockReturnValue({
    gasFeeEstimates: {
      low: { suggestedMaxPriorityFeePerGas: lowPriorityFee },
      medium: { suggestedMaxPriorityFeePerGas: mediumPriorityFee },
      estimatedBaseFee: baseFee,
    },
    gasEstimateType: GasEstimateTypes.feeMarket,
    isGasEstimatesLoading: false,
    isGasEstimateLoading: false,
    isNetworkBusy: false,
  } as unknown as ReturnType<typeof useGasFeeEstimates>);
}

/**
 * Helper to mock legacy gas estimates (non-EIP-1559)
 *
 * @param gasPrice
 */
function mockLegacyGasEstimates(gasPrice: string) {
  mockUseGasFeeEstimates.mockReturnValue({
    gasFeeEstimates: { gasPrice },
    gasEstimateType: GasEstimateTypes.legacy,
    isGasEstimatesLoading: false,
    isGasEstimateLoading: false,
    isNetworkBusy: false,
  } as unknown as ReturnType<typeof useGasFeeEstimates>);
}

describe('useSubscriptionCryptoApprovalTransaction', () => {
  let state: MetaMaskReduxState;

  beforeEach(() => {
    jest.clearAllMocks();
    state = cloneDeep(mockState) as unknown as MetaMaskReduxState;

    // Mock network configuration
    (state.metamask.networkConfigurationsByChainId as Record<string, unknown>) =
      {
        '0x1': {
          chainId: '0x1',
          rpcEndpoints: [{ networkClientId: 'mainnet' }],
          defaultRpcEndpointIndex: 0,
        },
      };

    // Mock useSubscriptionPricing hook
    mockUseSubscriptionPricing.mockReturnValue({
      subscriptionPricing: {
        products: [],
        paymentMethods: [
          {
            type: PAYMENT_TYPES.byCrypto,
            chains: [
              {
                chainId: '0x1',
                paymentAddress: '0x1234567890123456789012345678901234567890',
                tokens: [],
              },
            ],
          },
        ],
      },
      loading: false,
      error: undefined,
    });
  });

  describe('gas fee optimization: min(2 * low, medium)', () => {
    it('uses 2 * low as priorityFee when 2 * low < medium', async () => {
      // low = 1.0, medium = 2.5 → min(2*1.0, 2.5) = min(2.0, 2.5) = 2.0
      mockFeeMarketGasEstimates('1.0', '2.5', '50.0');

      const { result } = renderHookWithProvider(
        () => useSubscriptionCryptoApprovalTransaction(MOCK_SELECTED_TOKEN),
        state,
      );

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalled();
      });

      const [txParams] = mockAddTransaction.mock.calls[0];
      // priorityFee = min(2 * 1.0, 2.5) = 2.0 GWEI
      expect(txParams.maxPriorityFeePerGas).toBe(
        addHexPrefix(decGWEIToHexWEI(2.0)),
      );
      expect(txParams.maxFeePerGas).toBeUndefined();
    });

    it('uses medium as priorityFee when 2 * low > medium', async () => {
      // low = 2.0, medium = 2.5 → min(2*2.0, 2.5) = min(4.0, 2.5) = 2.5
      mockFeeMarketGasEstimates('2.0', '2.5', '50.0');

      const { result } = renderHookWithProvider(
        () => useSubscriptionCryptoApprovalTransaction(MOCK_SELECTED_TOKEN),
        state,
      );

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalled();
      });

      const [txParams] = mockAddTransaction.mock.calls[0];
      // priorityFee = min(2 * 2.0, 2.5) = 2.5 GWEI
      expect(txParams.maxPriorityFeePerGas).toBe(
        addHexPrefix(decGWEIToHexWEI(2.5)),
      );
      expect(txParams.maxFeePerGas).toBeUndefined();
    });

    it('does not set gas fees on non-EIP-1559 networks', async () => {
      mockLegacyGasEstimates('20');

      const { result } = renderHookWithProvider(
        () => useSubscriptionCryptoApprovalTransaction(MOCK_SELECTED_TOKEN),
        state,
      );

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalled();
      });

      const [txParams] = mockAddTransaction.mock.calls[0];
      // No EIP-1559 gas fees should be set
      expect(txParams.maxPriorityFeePerGas).toBeUndefined();
      expect(txParams.maxFeePerGas).toBeUndefined();
    });

    it('uses either value when 2 * low equals medium', async () => {
      // low = 1.5, medium = 3.0 → min(2*1.5, 3.0) = min(3.0, 3.0) = 3.0
      mockFeeMarketGasEstimates('1.5', '3.0', '50.0');

      const { result } = renderHookWithProvider(
        () => useSubscriptionCryptoApprovalTransaction(MOCK_SELECTED_TOKEN),
        state,
      );

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalled();
      });

      const [txParams] = mockAddTransaction.mock.calls[0];
      // priorityFee = min(2 * 1.5, 3.0) = 3.0 GWEI
      expect(txParams.maxPriorityFeePerGas).toBe(
        addHexPrefix(decGWEIToHexWEI(3.0)),
      );
      expect(txParams.maxFeePerGas).toBeUndefined();
    });

    it('does not set gas fees when gas estimates are missing', async () => {
      mockUseGasFeeEstimates.mockReturnValue({
        gasFeeEstimates: {},
        gasEstimateType: GasEstimateTypes.feeMarket,
        isGasEstimatesLoading: false,
        isGasEstimateLoading: false,
        isNetworkBusy: false,
      } as unknown as ReturnType<typeof useGasFeeEstimates>);

      const { result } = renderHookWithProvider(
        () => useSubscriptionCryptoApprovalTransaction(MOCK_SELECTED_TOKEN),
        state,
      );

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalled();
      });

      const [txParams] = mockAddTransaction.mock.calls[0];
      // No gas fees should be set when estimates are missing
      expect(txParams.maxPriorityFeePerGas).toBeUndefined();
      expect(txParams.maxFeePerGas).toBeUndefined();
    });

    it('does not set gas fees when parsed values are NaN', async () => {
      mockUseGasFeeEstimates.mockReturnValue({
        gasFeeEstimates: {
          low: { suggestedMaxPriorityFeePerGas: 'invalid' },
          medium: { suggestedMaxPriorityFeePerGas: '2.5' },
          estimatedBaseFee: '50.0',
        },
        gasEstimateType: GasEstimateTypes.feeMarket,
        isGasEstimatesLoading: false,
        isGasEstimateLoading: false,
        isNetworkBusy: false,
      } as unknown as ReturnType<typeof useGasFeeEstimates>);

      const { result } = renderHookWithProvider(
        () => useSubscriptionCryptoApprovalTransaction(MOCK_SELECTED_TOKEN),
        state,
      );

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalled();
      });

      const [txParams] = mockAddTransaction.mock.calls[0];
      // No gas fees should be set when values can't be parsed
      expect(txParams.maxPriorityFeePerGas).toBeUndefined();
      expect(txParams.maxFeePerGas).toBeUndefined();
    });
  });
});
