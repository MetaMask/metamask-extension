import { renderHook } from '@testing-library/react-hooks';
import { TransactionMeta } from '@metamask/transaction-controller';
import { GasFeeEstimates } from '@metamask/gas-fee-controller';
import { PriorityLevels } from '../../../../shared/constants/gas';
import * as gasUtils from '../../../helpers/utils/gas';
import {
  UseCancelSpeedupInitialGasParams,
  useCancelSpeedupInitialGas,
} from './useCancelSpeedupInitialGas';

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

  function buildHookParams(
    overrides: Partial<UseCancelSpeedupInitialGasParams> = {},
  ): UseCancelSpeedupInitialGasParams {
    return {
      effectiveTransaction: createMockTransaction(),
      gasFeeEstimates: mockGasFeeEstimatesWithMedium,
      isGasEstimatesLoading: false,
      updateTransactionUsingEstimate: mockUpdateTransactionUsingEstimate,
      updateTransactionToTenPercentIncreasedGasFee:
        mockUpdateTransactionToTenPercentIncreasedGasFee,
      appIsLoading: false,
      currentModal: CANCEL_SPEEDUP_MODAL,
      ...overrides,
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch.mockClear();
  });

  describe('isInitialGasReady', () => {
    it('returns true when effectiveTransaction.previousGas is set', () => {
      const params = buildHookParams({
        effectiveTransaction: createMockTransaction({
          previousGas: {
            maxFeePerGas: '0x1',
            maxPriorityFeePerGas: '0x1',
            gasLimit: '0x5208',
          },
        }),
        gasFeeEstimates: {},
      });

      const { result } = renderHook(() => useCancelSpeedupInitialGas(params));

      expect(result.current.isInitialGasReady).toBe(true);
    });

    it('returns false when effectiveTransaction.previousGas is not set', () => {
      const { result } = renderHook(() =>
        useCancelSpeedupInitialGas(buildHookParams()),
      );

      expect(result.current.isInitialGasReady).toBe(false);
    });
  });

  describe('when initial gas rule is skipped', () => {
    function expectNoUpdates() {
      expect(
        gasEstimateGreaterThanGasUsedPlusTenPercent,
      ).not.toHaveBeenCalled();
      expect(mockUpdateTransactionUsingEstimate).not.toHaveBeenCalled();
      expect(
        mockUpdateTransactionToTenPercentIncreasedGasFee,
      ).not.toHaveBeenCalled();
    }

    it('does not call updates when effectiveTransaction.previousGas is set', () => {
      renderHook(() =>
        useCancelSpeedupInitialGas(
          buildHookParams({
            effectiveTransaction: createMockTransaction({
              previousGas: {
                maxFeePerGas: '0x1',
                maxPriorityFeePerGas: '0x1',
                gasLimit: '0x5208',
              },
            }),
            gasFeeEstimates: {},
          }),
        ),
      );

      expectNoUpdates();
    });

    it('does not call updates when appIsLoading is true', () => {
      renderHook(() =>
        useCancelSpeedupInitialGas(buildHookParams({ appIsLoading: true })),
      );

      expectNoUpdates();
    });

    it('does not call updates when isGasEstimatesLoading is true', () => {
      renderHook(() =>
        useCancelSpeedupInitialGas(
          buildHookParams({ isGasEstimatesLoading: true }),
        ),
      );

      expectNoUpdates();
    });

    it('does not call updates when currentModal is not cancelSpeedUpTransaction', () => {
      renderHook(() =>
        useCancelSpeedupInitialGas(buildHookParams({ currentModal: 'other' })),
      );

      expectNoUpdates();
    });
  });

  describe('when initial gas rule runs', () => {
    it('calls updateTransactionUsingEstimate with medium when medium estimate is greater than gas used + 10%', () => {
      gasEstimateGreaterThanGasUsedPlusTenPercent.mockReturnValue(true);
      const params = buildHookParams();

      renderHook(() => useCancelSpeedupInitialGas(params));

      expect(gasEstimateGreaterThanGasUsedPlusTenPercent).toHaveBeenCalledWith(
        params.effectiveTransaction.txParams,
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
      gasEstimateGreaterThanGasUsedPlusTenPercent.mockReturnValue(false);
      const params = buildHookParams();

      renderHook(() => useCancelSpeedupInitialGas(params));

      expect(gasEstimateGreaterThanGasUsedPlusTenPercent).toHaveBeenCalledWith(
        params.effectiveTransaction.txParams,
        mockGasFeeEstimatesWithMedium,
        PriorityLevels.medium,
      );
      expect(mockUpdateTransactionUsingEstimate).not.toHaveBeenCalled();
      expect(
        mockUpdateTransactionToTenPercentIncreasedGasFee,
      ).toHaveBeenCalledWith();
    });

    it('calls updateTransactionToTenPercentIncreasedGasFee when gasFeeEstimates is null', () => {
      renderHook(() =>
        useCancelSpeedupInitialGas(buildHookParams({ gasFeeEstimates: null })),
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
      gasEstimateGreaterThanGasUsedPlusTenPercent.mockReturnValue(true);
      const baseParams = buildHookParams();

      const { rerender } = renderHook(
        ({ gasFeeEstimates }) =>
          useCancelSpeedupInitialGas({ ...baseParams, gasFeeEstimates }),
        {
          initialProps: {
            gasFeeEstimates:
              mockGasFeeEstimatesWithMedium as UseCancelSpeedupInitialGasParams['gasFeeEstimates'],
          },
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
      gasEstimateGreaterThanGasUsedPlusTenPercent.mockReturnValue(true);
      const params = buildHookParams();

      renderHook(() => useCancelSpeedupInitialGas(params));

      expect(mockDispatch).toHaveBeenCalled();
      expect(mockUpdatePreviousGasParams).toHaveBeenCalledTimes(1);
      expect(mockUpdatePreviousGasParams).toHaveBeenCalledWith(
        params.effectiveTransaction.id,
        {
          maxFeePerGas: '0x1',
          maxPriorityFeePerGas: '0x1',
          gasLimit: '0x5208',
        },
      );
    });
  });

  describe('legacy transactions', () => {
    function createLegacyTransaction(overrides: Partial<TransactionMeta> = {}) {
      return {
        id: 'legacy-tx-1',
        txParams: {
          gas: '0x5208',
          gasLimit: '0x5208',
          gasPrice: '0x2540be400',
        },
        ...overrides,
      } as TransactionMeta;
    }

    it('dispatches updatePreviousGasParams with gasPrice and gasLimit for legacy tx', () => {
      renderHook(() =>
        useCancelSpeedupInitialGas(
          buildHookParams({
            effectiveTransaction: createLegacyTransaction(),
          }),
        ),
      );

      expect(mockDispatch).toHaveBeenCalled();
      expect(mockUpdatePreviousGasParams).toHaveBeenCalledTimes(1);
      expect(mockUpdatePreviousGasParams).toHaveBeenCalledWith('legacy-tx-1', {
        gasPrice: '0x2540be400',
        gasLimit: '0x5208',
      });
    });

    it('does not store previousGas again on re-render for the same legacy transaction', () => {
      const baseParams = buildHookParams({
        effectiveTransaction: createLegacyTransaction(),
      });

      const { rerender } = renderHook(
        ({ gasFeeEstimates }) =>
          useCancelSpeedupInitialGas({ ...baseParams, gasFeeEstimates }),
        {
          initialProps: {
            gasFeeEstimates:
              mockGasFeeEstimatesWithMedium as UseCancelSpeedupInitialGasParams['gasFeeEstimates'],
          },
        },
      );

      expect(mockUpdatePreviousGasParams).toHaveBeenCalledTimes(1);

      rerender({ gasFeeEstimates: { ...mockGasFeeEstimatesWithMedium } });

      expect(mockUpdatePreviousGasParams).toHaveBeenCalledTimes(1);
    });

    it('does not dispatch previousGas when legacy tx has no gasPrice', () => {
      renderHook(() =>
        useCancelSpeedupInitialGas(
          buildHookParams({
            effectiveTransaction: createLegacyTransaction({
              txParams: { gas: '0x5208' } as TransactionMeta['txParams'],
            }),
          }),
        ),
      );

      expect(mockUpdatePreviousGasParams).not.toHaveBeenCalled();
    });
  });
});
