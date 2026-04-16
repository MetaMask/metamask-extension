import { renderHook, act } from '@testing-library/react-hooks';
import {
  TransactionMeta,
  CANCEL_RATE,
  SPEED_UP_RATE,
} from '@metamask/transaction-controller';
import { PriorityLevels } from '../../../../shared/constants/gas';
import { useLegacyCancelSpeedupFlow } from './useLegacyCancelSpeedupFlow';

type MockCallArgs = Record<string, string>;

const mockDispatch = jest.fn((action) => action);

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

const mockCreateCancelTransaction = jest.fn<
  { type: string },
  [string, MockCallArgs]
>(() => ({ type: 'CANCEL_TX' }));
const mockCreateSpeedUpTransaction = jest.fn<
  { type: string },
  [string, MockCallArgs]
>(() => ({ type: 'SPEEDUP_TX' }));
const mockUpdateTransactionGasFees = jest.fn<
  { type: string },
  [string, MockCallArgs]
>(() => ({ type: 'UPDATE_GAS_FEES' }));

jest.mock('../../../store/actions', () => ({
  createCancelTransaction: (txId: string, customGasSettings: MockCallArgs) =>
    mockCreateCancelTransaction(txId, customGasSettings),
  createSpeedUpTransaction: (txId: string, customGasSettings: MockCallArgs) =>
    mockCreateSpeedUpTransaction(txId, customGasSettings),
  updateTransactionGasFees: (txId: string, txGasFees: MockCallArgs) =>
    mockUpdateTransactionGasFees(txId, txGasFees),
}));

function createLegacyTx(
  overrides: Partial<TransactionMeta> = {},
): TransactionMeta {
  return {
    id: 'legacy-tx-1',
    chainId: '0x1',
    txParams: {
      gas: '0x5208',
      gasPrice: '0x2540be400',
    },
    ...overrides,
  } as TransactionMeta;
}

describe('useLegacyCancelSpeedupFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cancelTransaction', () => {
    it('dispatches createCancelTransaction with current gasPrice when no previousGas', () => {
      const tx = createLegacyTx();

      const { result } = renderHook(() =>
        useLegacyCancelSpeedupFlow({ transaction: tx }),
      );

      act(() => {
        result.current.cancelTransaction();
      });

      expect(mockCreateCancelTransaction).toHaveBeenCalledWith('legacy-tx-1', {
        gasPrice: '0x2540be400',
        gas: '0x5208',
      });
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('uses higher of current or previousGas × CANCEL_RATE', () => {
      const tx = createLegacyTx({
        txParams: {
          gas: '0x5208',
          gasPrice: '0x1',
        } as TransactionMeta['txParams'],
        previousGas: {
          gasPrice: '0x2540be400',
          gasLimit: '0x5208',
        } as unknown as TransactionMeta['previousGas'],
      });

      const { result } = renderHook(() =>
        useLegacyCancelSpeedupFlow({ transaction: tx }),
      );

      act(() => {
        result.current.cancelTransaction();
      });

      const callArgs = mockCreateCancelTransaction.mock.calls[0];
      const gasPrice = Number(callArgs[1].gasPrice);
      const minExpected = Number('0x2540be400') * CANCEL_RATE;
      expect(gasPrice).toBeGreaterThanOrEqual(minExpected);
    });
  });

  describe('speedUpTransaction', () => {
    it('dispatches createSpeedUpTransaction with current gasPrice when no previousGas', () => {
      const tx = createLegacyTx();

      const { result } = renderHook(() =>
        useLegacyCancelSpeedupFlow({ transaction: tx }),
      );

      act(() => {
        result.current.speedUpTransaction();
      });

      expect(mockCreateSpeedUpTransaction).toHaveBeenCalledWith('legacy-tx-1', {
        gasPrice: '0x2540be400',
        gas: '0x5208',
      });
    });

    it('uses higher of current or previousGas × SPEED_UP_RATE', () => {
      const tx = createLegacyTx({
        txParams: {
          gas: '0x5208',
          gasPrice: '0x1',
        } as TransactionMeta['txParams'],
        previousGas: {
          gasPrice: '0x2540be400',
          gasLimit: '0x5208',
        } as unknown as TransactionMeta['previousGas'],
      });

      const { result } = renderHook(() =>
        useLegacyCancelSpeedupFlow({ transaction: tx }),
      );

      act(() => {
        result.current.speedUpTransaction();
      });

      const callArgs = mockCreateSpeedUpTransaction.mock.calls[0];
      const gasPrice = Number(callArgs[1].gasPrice);
      const minExpected = Number('0x2540be400') * SPEED_UP_RATE;
      expect(gasPrice).toBeGreaterThanOrEqual(minExpected);
    });

    it('uses gasLimit from txParams when gas is not present', () => {
      const tx = createLegacyTx({
        txParams: {
          gasLimit: '0xABCD',
          gasPrice: '0x5',
        } as TransactionMeta['txParams'],
      });

      const { result } = renderHook(() =>
        useLegacyCancelSpeedupFlow({ transaction: tx }),
      );

      act(() => {
        result.current.speedUpTransaction();
      });

      expect(mockCreateSpeedUpTransaction.mock.calls[0][1].gas).toBe('0xABCD');
    });
  });

  describe('updateTransactionToTenPercentIncreasedGasFee', () => {
    it('dispatches updateTransactionGasFees with bumped gasPrice from txParams', () => {
      const tx = createLegacyTx();

      const { result } = renderHook(() =>
        useLegacyCancelSpeedupFlow({ transaction: tx }),
      );

      act(() => {
        result.current.updateTransactionToTenPercentIncreasedGasFee();
      });

      expect(mockUpdateTransactionGasFees).toHaveBeenCalledWith(
        'legacy-tx-1',
        expect.objectContaining({
          userFeeLevel: PriorityLevels.tenPercentIncreased,
        }),
      );
      const callArgs = mockUpdateTransactionGasFees.mock.calls[0][1];
      const bumpedPrice = Number(callArgs.gasPrice);
      const originalPrice = Number('0x2540be400');
      expect(bumpedPrice).toBeGreaterThanOrEqual(originalPrice * 1.1);
    });

    it('uses previousGas when available', () => {
      const tx = createLegacyTx({
        previousGas: {
          gasPrice: '0x2540be400',
          gas: '0x7530',
        } as unknown as TransactionMeta['previousGas'],
      });

      const { result } = renderHook(() =>
        useLegacyCancelSpeedupFlow({ transaction: tx }),
      );

      act(() => {
        result.current.updateTransactionToTenPercentIncreasedGasFee();
      });

      expect(mockUpdateTransactionGasFees).toHaveBeenCalledWith(
        'legacy-tx-1',
        expect.objectContaining({
          gas: '0x7530',
          gasLimit: '0x7530',
        }),
      );
    });

    it('does nothing when gasPrice is missing from both previousGas and txParams', () => {
      const tx = createLegacyTx({
        txParams: { gas: '0x5208' } as TransactionMeta['txParams'],
      });

      const { result } = renderHook(() =>
        useLegacyCancelSpeedupFlow({ transaction: tx }),
      );

      act(() => {
        result.current.updateTransactionToTenPercentIncreasedGasFee();
      });

      expect(mockUpdateTransactionGasFees).not.toHaveBeenCalled();
    });
  });

  describe('updateTransactionUsingEstimate', () => {
    it('dispatches with gasPrice from EthGasPriceEstimate (single gasPrice field)', () => {
      const tx = createLegacyTx();
      const estimates = { gasPrice: '10' };

      const { result } = renderHook(() =>
        useLegacyCancelSpeedupFlow({
          transaction: tx,
          gasFeeEstimates: estimates,
        }),
      );

      act(() => {
        result.current.updateTransactionUsingEstimate('medium');
      });

      expect(mockUpdateTransactionGasFees).toHaveBeenCalledWith(
        'legacy-tx-1',
        expect.objectContaining({
          userFeeLevel: 'medium',
        }),
      );
      expect(
        mockUpdateTransactionGasFees.mock.calls[0][1].gasPrice,
      ).toBeDefined();
    });

    it('dispatches with gasPrice from legacy per-level estimate (string value)', () => {
      const tx = createLegacyTx();
      const estimates = { low: '5', medium: '10', high: '20' };

      const { result } = renderHook(() =>
        useLegacyCancelSpeedupFlow({
          transaction: tx,
          gasFeeEstimates: estimates,
        }),
      );

      act(() => {
        result.current.updateTransactionUsingEstimate('medium');
      });

      expect(mockUpdateTransactionGasFees).toHaveBeenCalledWith(
        'legacy-tx-1',
        expect.objectContaining({
          userFeeLevel: 'medium',
        }),
      );
    });

    it('falls back to suggestedMaxFeePerGas from fee-market-style estimates', () => {
      const tx = createLegacyTx();
      const estimates = {
        medium: { suggestedMaxFeePerGas: '50' },
      };

      const { result } = renderHook(() =>
        useLegacyCancelSpeedupFlow({
          transaction: tx,
          gasFeeEstimates: estimates as unknown as Record<string, never>,
        }),
      );

      act(() => {
        result.current.updateTransactionUsingEstimate('medium');
      });

      expect(mockUpdateTransactionGasFees).toHaveBeenCalledWith(
        'legacy-tx-1',
        expect.objectContaining({
          userFeeLevel: 'medium',
        }),
      );
    });

    it('does nothing when gasFeeEstimates is undefined', () => {
      const tx = createLegacyTx();

      const { result } = renderHook(() =>
        useLegacyCancelSpeedupFlow({ transaction: tx }),
      );

      act(() => {
        result.current.updateTransactionUsingEstimate('medium');
      });

      expect(mockUpdateTransactionGasFees).not.toHaveBeenCalled();
    });

    it('does nothing when estimate level has no usable gasPrice', () => {
      const tx = createLegacyTx();
      const estimates = { medium: { someOtherField: 'value' } };

      const { result } = renderHook(() =>
        useLegacyCancelSpeedupFlow({
          transaction: tx,
          gasFeeEstimates: estimates as unknown as Record<string, never>,
        }),
      );

      act(() => {
        result.current.updateTransactionUsingEstimate('medium');
      });

      expect(mockUpdateTransactionGasFees).not.toHaveBeenCalled();
    });
  });
});
