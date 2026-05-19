import { renderHook } from '@testing-library/react-hooks';
import { TransactionMeta } from '@metamask/transaction-controller';
import { GasFeeEstimates } from '@metamask/gas-fee-controller';
import { PriorityLevels } from '../../../../shared/constants/gas';
import * as gasUtils from '../../../helpers/utils/gas';
import { useCancelSpeedupInitialGas } from './useCancelSpeedupInitialGas';

const mockGasFeeEstimatesWithMedium = {
  medium: { suggestedMaxFeePerGas: '0x2' },
} as GasFeeEstimates;

const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

const mockUpdatePreviousGasParams = jest.fn(
  (_txId: string, _previousGasParams: Record<string, unknown>) => () =>
    Promise.resolve(),
);

jest.mock('../../../store/actions', () => ({
  updatePreviousGasParams: (
    txId: string,
    previousGasParams: Record<string, unknown>,
  ) => mockUpdatePreviousGasParams(txId, previousGasParams),
}));

jest.mock('../../../helpers/utils/gas', () => ({
  gasEstimateGreaterThanGasUsedPlusTenPercent: jest.fn(),
}));

const gasEstimateGreaterThanGasUsedPlusTenPercent = jest.mocked(
  gasUtils.gasEstimateGreaterThanGasUsedPlusTenPercent,
);

function createMockTransaction(overrides: Partial<TransactionMeta> = {}) {
  return {
    id: 'tx-1',
    txParams: {
      gas: '0x5208',
      gasLimit: '0x5208',
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
    mockDispatch.mockClear();
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

      expect(
        gasEstimateGreaterThanGasUsedPlusTenPercent,
      ).not.toHaveBeenCalled();
      expect(mockUpdateTransactionUsingEstimate).not.toHaveBeenCalled();
      expect(
        mockUpdateTransactionToTenPercentIncreasedGasFee,
      ).not.toHaveBeenCalled();
    });

    it('does not call updates when appIsLoading is true', () => {
      const effectiveTransaction = createMockTransaction();

      renderHook(() =>
        useCancelSpeedupInitialGas({
          effectiveTransaction,
          gasFeeEstimates: mockGasFeeEstimatesWithMedium,
          updateTransactionUsingEstimate: mockUpdateTransactionUsingEstimate,
          updateTransactionToTenPercentIncreasedGasFee:
            mockUpdateTransactionToTenPercentIncreasedGasFee,
          appIsLoading: true,
          currentModal: CANCEL_SPEEDUP_MODAL,
        }),
      );

      expect(
        gasEstimateGreaterThanGasUsedPlusTenPercent,
      ).not.toHaveBeenCalled();
      expect(mockUpdateTransactionUsingEstimate).not.toHaveBeenCalled();
      expect(
        mockUpdateTransactionToTenPercentIncreasedGasFee,
      ).not.toHaveBeenCalled();
    });

    it('does not call updates when currentModal is not cancelSpeedUpTransaction', () => {
      const effectiveTransaction = createMockTransaction();

      renderHook(() =>
        useCancelSpeedupInitialGas({
          effectiveTransaction,
          gasFeeEstimates: mockGasFeeEstimatesWithMedium,
          updateTransactionUsingEstimate: mockUpdateTransactionUsingEstimate,
          updateTransactionToTenPercentIncreasedGasFee:
            mockUpdateTransactionToTenPercentIncreasedGasFee,
          appIsLoading: false,
          currentModal: 'other',
        }),
      );

      expect(
        gasEstimateGreaterThanGasUsedPlusTenPercent,
      ).not.toHaveBeenCalled();
      expect(mockUpdateTransactionUsingEstimate).not.toHaveBeenCalled();
      expect(
        mockUpdateTransactionToTenPercentIncreasedGasFee,
      ).not.toHaveBeenCalled();
    });
  });

  describe('when initial gas rule runs', () => {
    it('calls updateTransactionUsingEstimate with medium when medium estimate is greater than gas used + 10%', () => {
      const effectiveTransaction = createMockTransaction();
      gasEstimateGreaterThanGasUsedPlusTenPercent.mockReturnValue(true);

      renderHook(() =>
        useCancelSpeedupInitialGas({
          effectiveTransaction,
          gasFeeEstimates: mockGasFeeEstimatesWithMedium,
          updateTransactionUsingEstimate: mockUpdateTransactionUsingEstimate,
          updateTransactionToTenPercentIncreasedGasFee:
            mockUpdateTransactionToTenPercentIncreasedGasFee,
          appIsLoading: false,
          currentModal: CANCEL_SPEEDUP_MODAL,
        }),
      );

      expect(gasEstimateGreaterThanGasUsedPlusTenPercent).toHaveBeenCalledWith(
        effectiveTransaction.txParams,
        mockGasFeeEstimatesWithMedium,
        PriorityLevels.medium,
      );
      expect(mockUpdateTransactionUsingEstimate).toHaveBeenCalledWith(
        PriorityLevels.medium,
      );
      expect(
        mockUpdateTransactionToTenPercentIncreasedGasFee,
      ).not.toHaveBeenCalled();
    });

    it('calls updateTransactionToTenPercentIncreasedGasFee when medium estimate is not greater than gas used + 10%', () => {
      const effectiveTransaction = createMockTransaction();
      gasEstimateGreaterThanGasUsedPlusTenPercent.mockReturnValue(false);

      renderHook(() =>
        useCancelSpeedupInitialGas({
          effectiveTransaction,
          gasFeeEstimates: mockGasFeeEstimatesWithMedium,
          updateTransactionUsingEstimate: mockUpdateTransactionUsingEstimate,
          updateTransactionToTenPercentIncreasedGasFee:
            mockUpdateTransactionToTenPercentIncreasedGasFee,
          appIsLoading: false,
          currentModal: CANCEL_SPEEDUP_MODAL,
        }),
      );

      expect(gasEstimateGreaterThanGasUsedPlusTenPercent).toHaveBeenCalledWith(
        effectiveTransaction.txParams,
        mockGasFeeEstimatesWithMedium,
        PriorityLevels.medium,
      );
      expect(mockUpdateTransactionUsingEstimate).not.toHaveBeenCalled();
      expect(
        mockUpdateTransactionToTenPercentIncreasedGasFee,
      ).toHaveBeenCalledWith();
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

      expect(
        gasEstimateGreaterThanGasUsedPlusTenPercent,
      ).not.toHaveBeenCalled();
      expect(mockUpdateTransactionUsingEstimate).not.toHaveBeenCalled();
      expect(
        mockUpdateTransactionToTenPercentIncreasedGasFee,
      ).toHaveBeenCalledWith();
    });

    it('does not call updates again when effect re-runs for same transaction (e.g. after gasFeeEstimates reference change)', () => {
      const effectiveTransaction = createMockTransaction();
      gasEstimateGreaterThanGasUsedPlusTenPercent.mockReturnValue(true);

      const { rerender } = renderHook(
        ({ gasFeeEstimates }) =>
          useCancelSpeedupInitialGas({
            effectiveTransaction,
            gasFeeEstimates,
            updateTransactionUsingEstimate: mockUpdateTransactionUsingEstimate,
            updateTransactionToTenPercentIncreasedGasFee:
              mockUpdateTransactionToTenPercentIncreasedGasFee,
            appIsLoading: false,
            currentModal: CANCEL_SPEEDUP_MODAL,
          }),
        {
          initialProps: { gasFeeEstimates: mockGasFeeEstimatesWithMedium },
        },
      );

      expect(mockUpdateTransactionUsingEstimate).toHaveBeenCalledTimes(1);
      expect(mockUpdateTransactionUsingEstimate).toHaveBeenCalledWith(
        PriorityLevels.medium,
      );

      rerender({ gasFeeEstimates: { ...mockGasFeeEstimatesWithMedium } });

      expect(mockUpdateTransactionUsingEstimate).toHaveBeenCalledTimes(1);
      expect(
        mockUpdateTransactionToTenPercentIncreasedGasFee,
      ).not.toHaveBeenCalled();
    });

    it('dispatches updatePreviousGasParams once when modal opens and previousGas is not set', () => {
      const effectiveTransaction = createMockTransaction();
      gasEstimateGreaterThanGasUsedPlusTenPercent.mockReturnValue(true);

      renderHook(() =>
        useCancelSpeedupInitialGas({
          effectiveTransaction,
          gasFeeEstimates: mockGasFeeEstimatesWithMedium,
          updateTransactionUsingEstimate: mockUpdateTransactionUsingEstimate,
          updateTransactionToTenPercentIncreasedGasFee:
            mockUpdateTransactionToTenPercentIncreasedGasFee,
          appIsLoading: false,
          currentModal: CANCEL_SPEEDUP_MODAL,
        }),
      );

      expect(mockDispatch).toHaveBeenCalled();
      expect(mockUpdatePreviousGasParams).toHaveBeenCalledTimes(1);
      expect(mockUpdatePreviousGasParams).toHaveBeenCalledWith(
        effectiveTransaction.id,
        {
          maxFeePerGas: '0x1',
          maxPriorityFeePerGas: '0x1',
          gasLimit: '0x5208',
        },
      );
    });
  });
});
