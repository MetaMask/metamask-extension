import { renderHook } from '@testing-library/react-hooks';
import { TransactionMeta } from '@metamask/transaction-controller';
import { EditGasModes } from '../../../../shared/constants/gas';
import { useGasFeeEstimates } from '../../../hooks/useGasFeeEstimates';
import { useCancelSpeedupGasState } from './useCancelSpeedupGasState';

import { useTransactionFunctions } from './useTransactionFunctions';

jest.mock('../../../hooks/useGasFeeEstimates', () => ({
  useGasFeeEstimates: jest.fn(),
}));

jest.mock('./useTransactionFunctions', () => ({
  useTransactionFunctions: jest.fn(),
}));

const mockUseGasFeeEstimates = jest.mocked(useGasFeeEstimates);
const mockUseTransactionFunctions = jest.mocked(useTransactionFunctions);

const mockNetwork = {
  rpcEndpoints: [{ networkClientId: 'mainnet' }],
  defaultRpcEndpointIndex: 0,
};

const mockSelectNetworkConfigurationByChainId = jest.fn();
const mockSelectTransactionMetadata = jest.fn();
jest.mock('../../../selectors', () => ({
  selectNetworkConfigurationByChainId: (...args: unknown[]) =>
    mockSelectNetworkConfigurationByChainId(...args),
  selectTransactionMetadata: (...args: unknown[]) =>
    mockSelectTransactionMetadata(...args),
}));

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) =>
    selector?.({}) ?? undefined,
}));

function createMockTransaction(overrides: Partial<TransactionMeta> = {}) {
  return {
    id: 'tx-1',
    chainId: '0x1',
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectNetworkConfigurationByChainId.mockReturnValue(mockNetwork);
    mockSelectTransactionMetadata.mockReturnValue(undefined);
    mockUseGasFeeEstimates.mockReturnValue({
      gasFeeEstimates: { medium: { suggestedMaxFeePerGas: '0x2' } },
    } as ReturnType<typeof mockUseGasFeeEstimates>);
    mockUseTransactionFunctions.mockReturnValue({
      cancelTransaction: mockCancelTransaction,
      speedUpTransaction: mockSpeedUpTransaction,
      updateTransactionToTenPercentIncreasedGasFee:
        mockUpdateTransactionToTenPercentIncreasedGasFee,
      updateTransactionUsingEstimate: mockUpdateTransactionUsingEstimate,
    } as ReturnType<typeof mockUseTransactionFunctions>);
  });

  it('returns effectiveTransaction, gasFeeEstimates, and transaction action functions', () => {
    const transaction = createMockTransaction();

    const { result } = renderHook(() =>
      useCancelSpeedupGasState(transaction, EditGasModes.speedUp),
    );

    expect(result.current).toMatchObject({
      gasFeeEstimates: { medium: { suggestedMaxFeePerGas: '0x2' } },
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

  it('merges transaction with retryTxMeta in effectiveTransaction when editGasMode is speedUp', () => {
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

  it('merges transaction with retryTxMeta in effectiveTransaction when editGasMode is cancel', () => {
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
    } as ReturnType<typeof mockUseGasFeeEstimates>);

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
});
