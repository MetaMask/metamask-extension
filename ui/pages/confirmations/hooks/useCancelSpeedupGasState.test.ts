import { renderHook } from '@testing-library/react-hooks';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  EditGasModes,
  GasEstimateTypes,
} from '../../../../shared/constants/gas';
import { useGasFeeEstimates } from '../../../hooks/useGasFeeEstimates';
import { useSupportsEIP1559 } from '../components/confirm/info/hooks/useSupportsEIP1559';
import { useCancelSpeedupGasState } from './useCancelSpeedupGasState';

import { useTransactionFunctions } from './useTransactionFunctions';
import { useLegacyCancelSpeedupFlow } from './useLegacyCancelSpeedupFlow';

jest.mock('../../../hooks/useGasFeeEstimates', () => ({
  useGasFeeEstimates: jest.fn(),
}));

jest.mock('../components/confirm/info/hooks/useSupportsEIP1559', () => ({
  useSupportsEIP1559: jest.fn(),
}));

jest.mock('./useTransactionFunctions', () => ({
  useTransactionFunctions: jest.fn(),
}));

jest.mock('./useLegacyCancelSpeedupFlow', () => ({
  useLegacyCancelSpeedupFlow: jest.fn(),
}));

const mockUseLegacyCancelSpeedupFlow = jest.mocked(useLegacyCancelSpeedupFlow);

const mockUseGasFeeEstimates = jest.mocked(useGasFeeEstimates);
const mockUseTransactionFunctions = jest.mocked(useTransactionFunctions);
const mockUseSupportsEIP1559 = jest.mocked(useSupportsEIP1559);

const mockSelectTransactionMetadata = jest.fn();
jest.mock('../../../selectors', () => ({
  selectTransactionMetadata: (...args: unknown[]) =>
    mockSelectTransactionMetadata(...args),
}));

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) =>
    selector?.({}) ?? undefined,
  useDispatch: () => jest.fn(),
}));

function createMockTransaction(overrides: Partial<TransactionMeta> = {}) {
  return {
    id: 'tx-1',
    chainId: '0x1',
    networkClientId: 'mainnet',
    txParams: {
      gas: '0x5208',
      gasLimit: '0x5208',
      maxFeePerGas: '0x1',
      maxPriorityFeePerGas: '0x1',
    },
    ...overrides,
  } as TransactionMeta;
}

describe('useCancelSpeedupGasState', () => {
  const mockCancelTransaction = jest.fn();
  const mockSpeedUpTransaction = jest.fn();
  const mockUpdateTransactionToTenPercentIncreasedGasFee = jest.fn();
  const mockUpdateTransactionUsingEstimate = jest.fn();

  const mockUpdateTransaction = jest.fn();
  const mockUpdateTransactionUsingDAPPSuggestedValues = jest.fn();

  const mockLegacyCancelTransaction = jest.fn();
  const mockLegacySpeedUpTransaction = jest.fn();
  const mockLegacyUpdateTenPercent = jest.fn();
  const mockLegacyUpdateUsingEstimate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectTransactionMetadata.mockReturnValue(undefined);
    mockUseSupportsEIP1559.mockReturnValue({ supportsEIP1559: true });
    mockUseGasFeeEstimates.mockReturnValue({
      gasFeeEstimates: { medium: { suggestedMaxFeePerGas: '0x2' } },
      gasEstimateType: GasEstimateTypes.feeMarket,
      isGasEstimatesLoading: false,
      isNetworkBusy: false,
    } as unknown as ReturnType<typeof useGasFeeEstimates>);
    mockUseTransactionFunctions.mockReturnValue({
      cancelTransaction: mockCancelTransaction,
      speedUpTransaction: mockSpeedUpTransaction,
      updateTransaction: mockUpdateTransaction,
      updateTransactionToTenPercentIncreasedGasFee:
        mockUpdateTransactionToTenPercentIncreasedGasFee,
      updateTransactionUsingDAPPSuggestedValues:
        mockUpdateTransactionUsingDAPPSuggestedValues,
      updateTransactionUsingEstimate: mockUpdateTransactionUsingEstimate,
    });
    mockUseLegacyCancelSpeedupFlow.mockReturnValue({
      cancelTransaction: mockLegacyCancelTransaction,
      speedUpTransaction: mockLegacySpeedUpTransaction,
      updateTransactionToTenPercentIncreasedGasFee: mockLegacyUpdateTenPercent,
      updateTransactionUsingEstimate: mockLegacyUpdateUsingEstimate,
    });
  });

  it('returns effectiveTransaction, gasFeeEstimates, isGasEstimatesLoading, and transaction action functions', () => {
    const transaction = createMockTransaction();

    const { result } = renderHook(() =>
      useCancelSpeedupGasState(transaction, EditGasModes.speedUp),
    );

    expect(result.current).toMatchObject({
      gasFeeEstimates: { medium: { suggestedMaxFeePerGas: '0x2' } },
      isGasEstimatesLoading: false,
    });
    expect(result.current.effectiveTransaction).toBeDefined();
    expect(result.current.cancelTransaction).toBe(mockCancelTransaction);
    expect(result.current.speedUpTransaction).toBe(mockSpeedUpTransaction);
    expect(result.current.updateTransactionToTenPercentIncreasedGasFee).toBe(
      mockUpdateTransactionToTenPercentIncreasedGasFee,
    );
    expect(result.current.updateTransactionUsingEstimate).toBe(
      mockUpdateTransactionUsingEstimate,
    );
  });

  it('returns isGasEstimatesLoading as true when estimates are still loading', () => {
    mockUseGasFeeEstimates.mockReturnValue({
      gasFeeEstimates: {},
      gasEstimateType: GasEstimateTypes.feeMarket,
      isGasEstimatesLoading: true,
      isNetworkBusy: false,
    } as unknown as ReturnType<typeof useGasFeeEstimates>);

    const transaction = createMockTransaction();
    const { result } = renderHook(() =>
      useCancelSpeedupGasState(transaction, EditGasModes.speedUp),
    );

    expect(result.current.isGasEstimatesLoading).toBe(true);
  });

  it('uses transaction as effectiveTransaction when store has no matching tx (speedUp)', () => {
    const transaction = createMockTransaction({ userFeeLevel: 'medium' });

    const { result } = renderHook(() =>
      useCancelSpeedupGasState(transaction, EditGasModes.speedUp),
    );

    expect(result.current.effectiveTransaction.id).toBe(transaction.id);
    expect(result.current.effectiveTransaction.chainId).toBe(
      transaction.chainId,
    );
    expect(result.current.effectiveTransaction.txParams).toEqual(
      transaction.txParams,
    );
    expect(result.current.effectiveTransaction.networkClientId).toBe('mainnet');
  });

  it('uses transaction as effectiveTransaction when store has no matching tx (cancel)', () => {
    const transaction = createMockTransaction();

    const { result } = renderHook(() =>
      useCancelSpeedupGasState(transaction, EditGasModes.cancel),
    );

    expect(result.current.effectiveTransaction.id).toBe(transaction.id);
    expect(result.current.effectiveTransaction.networkClientId).toBe('mainnet');
  });

  it('returns gasFeeEstimates as null when useGasFeeEstimates returns undefined estimates', () => {
    mockUseGasFeeEstimates.mockReturnValue({
      gasFeeEstimates: undefined,
      gasEstimateType: GasEstimateTypes.feeMarket,
      isGasEstimatesLoading: false,
      isNetworkBusy: false,
    } as unknown as ReturnType<typeof useGasFeeEstimates>);

    const transaction = createMockTransaction();
    const { result } = renderHook(() =>
      useCancelSpeedupGasState(transaction, EditGasModes.speedUp),
    );

    expect(result.current.gasFeeEstimates).toBeNull();
  });

  it('passes effectiveTransaction and editGasMode to useTransactionFunctions', () => {
    const transaction = createMockTransaction();

    renderHook(() =>
      useCancelSpeedupGasState(transaction, EditGasModes.speedUp),
    );

    expect(mockUseTransactionFunctions).toHaveBeenCalledWith(
      expect.objectContaining({
        editGasMode: EditGasModes.speedUp,
        defaultEstimateToUse: 'medium',
        transaction: expect.objectContaining({
          id: transaction.id,
          chainId: transaction.chainId,
        }),
      }),
    );
  });

  describe('legacy and EIP-1559 flows', () => {
    it('returns EIP-1559 functions when transaction has maxFeePerGas', () => {
      const transaction = createMockTransaction();

      const { result } = renderHook(() =>
        useCancelSpeedupGasState(transaction, EditGasModes.speedUp),
      );

      expect(result.current.cancelTransaction).toBe(mockCancelTransaction);
      expect(result.current.speedUpTransaction).toBe(mockSpeedUpTransaction);
      expect(result.current.updateTransactionToTenPercentIncreasedGasFee).toBe(
        mockUpdateTransactionToTenPercentIncreasedGasFee,
      );
      expect(result.current.updateTransactionUsingEstimate).toBe(
        mockUpdateTransactionUsingEstimate,
      );
    });

    it('returns legacy functions when transaction does not support EIP-1559', () => {
      mockUseSupportsEIP1559.mockReturnValue({ supportsEIP1559: false });
      const legacyTransaction = createMockTransaction({
        txParams: {
          gas: '0x5208',
          gasLimit: '0x5208',
          gasPrice: '0x2540be400',
        } as TransactionMeta['txParams'],
      });

      const { result } = renderHook(() =>
        useCancelSpeedupGasState(legacyTransaction, EditGasModes.cancel),
      );

      expect(result.current.cancelTransaction).toBe(
        mockLegacyCancelTransaction,
      );
      expect(result.current.speedUpTransaction).toBe(
        mockLegacySpeedUpTransaction,
      );
      expect(result.current.updateTransactionToTenPercentIncreasedGasFee).toBe(
        mockLegacyUpdateTenPercent,
      );
      expect(result.current.updateTransactionUsingEstimate).toBe(
        mockLegacyUpdateUsingEstimate,
      );
    });

    it('calls useLegacyCancelSpeedupFlow with effectiveTransaction and gasFeeEstimates', () => {
      mockUseSupportsEIP1559.mockReturnValue({ supportsEIP1559: false });
      const legacyTransaction = createMockTransaction({
        txParams: {
          gas: '0x5208',
          gasPrice: '0x2540be400',
        } as TransactionMeta['txParams'],
      });

      renderHook(() =>
        useCancelSpeedupGasState(legacyTransaction, EditGasModes.speedUp),
      );

      expect(mockUseLegacyCancelSpeedupFlow).toHaveBeenCalledWith(
        expect.objectContaining({
          transaction: expect.objectContaining({
            id: legacyTransaction.id,
          }),
        }),
      );
    });
  });
});
