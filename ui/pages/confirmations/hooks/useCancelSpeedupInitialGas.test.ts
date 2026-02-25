import { renderHook } from '@testing-library/react-hooks';
import { TransactionMeta } from '@metamask/transaction-controller';
import { PriorityLevels } from '../../../../shared/constants/gas';
import { useCancelSpeedupInitialGas } from './useCancelSpeedupInitialGas';

jest.mock('../../../helpers/utils/gas', () => ({
  gasEstimateGreaterThanGasUsedPlusTenPercent: jest.fn(),
}));

import * as gasUtils from '../../../helpers/utils/gas';

const gasEstimateGreaterThanGasUsedPlusTenPercent = jest.mocked(
  gasUtils.gasEstimateGreaterThanGasUsedPlusTenPercent,
);

function createMockTransaction(overrides: Partial<TransactionMeta> = {}) {
  return {
    id: 'tx-1',
    txParams: {
      gas: '0x5208',
      maxFeePerGas: '0x1',
      maxPriorityFeePerGas: '0x1',
    },
    ...overrides,
  } as TransactionMeta;
}

describe('useCancelSpeedupInitialGas', () => {
  const mockUpdateTransactionUsingEstimate = jest.fn();
  const mockUpdateTransactionToTenPercentIncreasedGasFee = jest.fn();
  const CANCEL_SPEEDUP_MODAL = 'cancelSpeedUpTransaction';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when initial gas rule is skipped', () => {
    it('does not call updates when effectiveTransaction.previousGas is set', () => {
      const effectiveTransaction = createMockTransaction({
        previousGas: {
          maxFeePerGas: '0x1',
          maxPriorityFeePerGas: '0x1',
          gasLimit: '0x5208',
        },
      });

      renderHook(() =>
        useCancelSpeedupInitialGas({
          effectiveTransaction,
          gasFeeEstimates: {},
          updateTransactionUsingEstimate: mockUpdateTransactionUsingEstimate,
          updateTransactionToTenPercentIncreasedGasFee:
            mockUpdateTransactionToTenPercentIncreasedGasFee,
          appIsLoading: false,
          currentModal: CANCEL_SPEEDUP_MODAL,
        }),
      );

      expect(gasEstimateGreaterThanGasUsedPlusTenPercent).not.toHaveBeenCalled();
      expect(mockUpdateTransactionUsingEstimate).not.toHaveBeenCalled();
      expect(mockUpdateTransactionToTenPercentIncreasedGasFee).not.toHaveBeenCalled();
    });

    it('does not call updates when appIsLoading is true', () => {
      const effectiveTransaction = createMockTransaction();

      renderHook(() =>
        useCancelSpeedupInitialGas({
          effectiveTransaction,
          gasFeeEstimates: { medium: { suggestedMaxFeePerGas: '0x2' } },
          updateTransactionUsingEstimate: mockUpdateTransactionUsingEstimate,
          updateTransactionToTenPercentIncreasedGasFee:
            mockUpdateTransactionToTenPercentIncreasedGasFee,
          appIsLoading: true,
          currentModal: CANCEL_SPEEDUP_MODAL,
        }),
      );

      expect(gasEstimateGreaterThanGasUsedPlusTenPercent).not.toHaveBeenCalled();
      expect(mockUpdateTransactionUsingEstimate).not.toHaveBeenCalled();
      expect(mockUpdateTransactionToTenPercentIncreasedGasFee).not.toHaveBeenCalled();
    });

    it('does not call updates when currentModal is not cancelSpeedUpTransaction', () => {
      const effectiveTransaction = createMockTransaction();

      renderHook(() =>
        useCancelSpeedupInitialGas({
          effectiveTransaction,
          gasFeeEstimates: { medium: { suggestedMaxFeePerGas: '0x2' } },
          updateTransactionUsingEstimate: mockUpdateTransactionUsingEstimate,
          updateTransactionToTenPercentIncreasedGasFee:
            mockUpdateTransactionToTenPercentIncreasedGasFee,
          appIsLoading: false,
          currentModal: 'other',
        }),
      );

      expect(gasEstimateGreaterThanGasUsedPlusTenPercent).not.toHaveBeenCalled();
      expect(mockUpdateTransactionUsingEstimate).not.toHaveBeenCalled();
      expect(mockUpdateTransactionToTenPercentIncreasedGasFee).not.toHaveBeenCalled();
    });
  });

  describe('when initial gas rule runs', () => {
    it('calls updateTransactionUsingEstimate with medium when medium estimate is greater than gas used + 10%', () => {
      const effectiveTransaction = createMockTransaction();
      gasEstimateGreaterThanGasUsedPlusTenPercent.mockReturnValue(true);

      renderHook(() =>
        useCancelSpeedupInitialGas({
          effectiveTransaction,
          gasFeeEstimates: { medium: { suggestedMaxFeePerGas: '0x2' } },
          updateTransactionUsingEstimate: mockUpdateTransactionUsingEstimate,
          updateTransactionToTenPercentIncreasedGasFee:
            mockUpdateTransactionToTenPercentIncreasedGasFee,
          appIsLoading: false,
          currentModal: CANCEL_SPEEDUP_MODAL,
        }),
      );

      expect(gasEstimateGreaterThanGasUsedPlusTenPercent).toHaveBeenCalledWith(
        effectiveTransaction.txParams,
        { medium: { suggestedMaxFeePerGas: '0x2' } },
        PriorityLevels.medium,
      );
      expect(mockUpdateTransactionUsingEstimate).toHaveBeenCalledWith(
        PriorityLevels.medium,
      );
      expect(mockUpdateTransactionToTenPercentIncreasedGasFee).not.toHaveBeenCalled();
    });

    it('calls updateTransactionToTenPercentIncreasedGasFee when medium estimate is not greater than gas used + 10%', () => {
      const effectiveTransaction = createMockTransaction();
      gasEstimateGreaterThanGasUsedPlusTenPercent.mockReturnValue(false);

      renderHook(() =>
        useCancelSpeedupInitialGas({
          effectiveTransaction,
          gasFeeEstimates: { medium: { suggestedMaxFeePerGas: '0x2' } },
          updateTransactionUsingEstimate: mockUpdateTransactionUsingEstimate,
          updateTransactionToTenPercentIncreasedGasFee:
            mockUpdateTransactionToTenPercentIncreasedGasFee,
          appIsLoading: false,
          currentModal: CANCEL_SPEEDUP_MODAL,
        }),
      );

      expect(gasEstimateGreaterThanGasUsedPlusTenPercent).toHaveBeenCalledWith(
        effectiveTransaction.txParams,
        { medium: { suggestedMaxFeePerGas: '0x2' } },
        PriorityLevels.medium,
      );
      expect(mockUpdateTransactionUsingEstimate).not.toHaveBeenCalled();
      expect(mockUpdateTransactionToTenPercentIncreasedGasFee).toHaveBeenCalledWith(
        true,
      );
    });

    it('calls updateTransactionToTenPercentIncreasedGasFee when gasFeeEstimates is null', () => {
      const effectiveTransaction = createMockTransaction();

      renderHook(() =>
        useCancelSpeedupInitialGas({
          effectiveTransaction,
          gasFeeEstimates: null,
          updateTransactionUsingEstimate: mockUpdateTransactionUsingEstimate,
          updateTransactionToTenPercentIncreasedGasFee:
            mockUpdateTransactionToTenPercentIncreasedGasFee,
          appIsLoading: false,
          currentModal: CANCEL_SPEEDUP_MODAL,
        }),
      );

      expect(gasEstimateGreaterThanGasUsedPlusTenPercent).not.toHaveBeenCalled();
      expect(mockUpdateTransactionUsingEstimate).not.toHaveBeenCalled();
      expect(mockUpdateTransactionToTenPercentIncreasedGasFee).toHaveBeenCalledWith(
        true,
      );
    });
  });
});
