import { renderHook, act } from '@testing-library/react-hooks';
import { useDispatch } from 'react-redux';
import { providerErrors, serializeError } from '@metamask/rpc-errors';
import { TransactionType } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { replaceMusdConversionTransactionForPayToken } from '../../components/app/musd/utils/transaction-utils';
import { useConfirmContext } from '../../pages/confirmations/context/confirm';
import { useTransactionPayToken } from '../../pages/confirmations/hooks/pay/useTransactionPayToken';
import { rejectPendingApproval } from '../../store/actions';
import { useMusdPaymentToken } from './useMusdPaymentToken';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(() => jest.fn()),
  useLocation: jest.fn(() => ({ search: '' })),
}));

jest.mock('@metamask/rpc-errors', () => ({
  providerErrors: {
    userRejectedRequest: jest.fn(() => ({
      code: 4001,
      message: 'User rejected the request.',
    })),
  },
  serializeError: jest.fn((err) => ({ ...err, serialized: true })),
}));

jest.mock('../../pages/confirmations/context/confirm', () => ({
  useConfirmContext: jest.fn(),
}));

jest.mock('../../pages/confirmations/hooks/pay/useTransactionPayToken', () => ({
  useTransactionPayToken: jest.fn(),
}));

jest.mock('../../components/app/musd/utils/transaction-utils', () => ({
  replaceMusdConversionTransactionForPayToken: jest.fn(),
}));

jest.mock('../../store/actions', () => ({
  addTransaction: jest.fn(),
  findNetworkClientIdByChainId: jest.fn(),
  rejectPendingApproval: jest.fn(),
}));

jest.mock('../../store/controller-actions/transaction-pay-controller', () => ({
  updateTransactionPaymentToken: jest.fn(),
}));

const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>;
const mockUseConfirmContext = useConfirmContext as jest.Mock;
const mockUseTransactionPayToken = useTransactionPayToken as jest.Mock;
const mockReplaceTransaction =
  replaceMusdConversionTransactionForPayToken as jest.Mock;
const mockRejectPendingApproval = rejectPendingApproval as jest.Mock;
const mockSerializeError = serializeError as jest.Mock;
const mockProviderErrors = providerErrors as jest.Mocked<typeof providerErrors>;
const mockUseNavigate = useNavigate as jest.Mock;
const mockUseLocation = useLocation as jest.Mock;

describe('useMusdPaymentToken', () => {
  const mockDispatch = jest.fn((x) => x);
  const mockSetPayToken = jest.fn();
  const mockNavigate = jest.fn();

  const mockTransactionMeta = {
    id: 'tx-123',
    chainId: '0x1' as Hex,
    type: TransactionType.musdConversion,
    txParams: {
      from: '0xabc123' as Hex,
      to: '0xdef456' as Hex,
      data: '0x...',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseDispatch.mockReturnValue(mockDispatch);

    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: mockTransactionMeta,
    });

    mockUseTransactionPayToken.mockReturnValue({
      payToken: { address: '0xtoken1' as Hex, chainId: '0x1' as Hex },
      setPayToken: mockSetPayToken,
    });

    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseLocation.mockReturnValue({ search: '' });
  });

  describe('same-chain token selection', () => {
    it('calls setPayToken directly when token is on the same chain', async () => {
      const { result } = renderHook(() => useMusdPaymentToken());

      const sameChainToken = {
        address: '0xnewtoken' as Hex,
        chainId: '0x1' as Hex,
      };

      await act(async () => {
        await result.current.onPaymentTokenChange(sameChainToken);
      });

      expect(mockSetPayToken).toHaveBeenCalledWith(sameChainToken);
      expect(mockReplaceTransaction).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('handles case-insensitive chain comparison', async () => {
      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: {
          ...mockTransactionMeta,
          chainId: '0xE708' as Hex,
        },
      });

      const { result } = renderHook(() => useMusdPaymentToken());

      const sameChainToken = {
        address: '0xnewtoken' as Hex,
        chainId: '0xe708' as Hex,
      };

      await act(async () => {
        await result.current.onPaymentTokenChange(sameChainToken);
      });

      expect(mockSetPayToken).toHaveBeenCalledWith(sameChainToken);
      expect(mockReplaceTransaction).not.toHaveBeenCalled();
    });
  });

  describe('cross-chain token selection', () => {
    it('calls replaceMusdConversionTransactionForPayToken when chains differ', async () => {
      mockReplaceTransaction.mockResolvedValue('new-tx-456');

      const { result } = renderHook(() => useMusdPaymentToken());

      const crossChainToken = {
        address: '0xlineaToken' as Hex,
        chainId: '0xe708' as Hex,
      };

      await act(async () => {
        await result.current.onPaymentTokenChange(crossChainToken);
      });

      expect(mockSetPayToken).not.toHaveBeenCalled();

      expect(mockReplaceTransaction).toHaveBeenCalledWith(
        mockTransactionMeta,
        crossChainToken,
        expect.objectContaining({
          addTransaction: expect.any(Function),
          findNetworkClientIdByChainId: expect.any(Function),
          updatePaymentToken: expect.any(Function),
          rejectApproval: expect.any(Function),
        }),
      );
    });

    it('navigates to new transaction after successful replacement', async () => {
      const newTransactionId = 'new-tx-789';
      mockReplaceTransaction.mockResolvedValue(newTransactionId);

      const { result } = renderHook(() => useMusdPaymentToken());

      const crossChainToken = {
        address: '0xlineaToken' as Hex,
        chainId: '0xe708' as Hex,
      };

      await act(async () => {
        await result.current.onPaymentTokenChange(crossChainToken);
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        `/confirm-transaction/${newTransactionId}`,
        { replace: true },
      );
    });

    it('preserves query params when navigating after replacement', async () => {
      const newTransactionId = 'new-tx-789';
      mockReplaceTransaction.mockResolvedValue(newTransactionId);
      mockUseLocation.mockReturnValue({ search: '?bypass_education=true' });

      const { result } = renderHook(() => useMusdPaymentToken());

      const crossChainToken = {
        address: '0xlineaToken' as Hex,
        chainId: '0xe708' as Hex,
      };

      await act(async () => {
        await result.current.onPaymentTokenChange(crossChainToken);
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        `/confirm-transaction/${newTransactionId}?bypass_education=true`,
        { replace: true },
      );
    });
  });

  describe('rejectApproval callback', () => {
    it('serializes the error and awaits dispatch', async () => {
      const mockThunk = jest.fn();
      mockRejectPendingApproval.mockReturnValue(mockThunk);
      mockDispatch.mockResolvedValue(undefined);

      mockReplaceTransaction.mockImplementation(
        async (_tx, _token, callbacks) => {
          await callbacks.rejectApproval?.('tx-123');
          return 'new-tx-id';
        },
      );

      const { result } = renderHook(() => useMusdPaymentToken());

      await act(async () => {
        await result.current.onPaymentTokenChange({
          address: '0xtoken' as Hex,
          chainId: '0xe708' as Hex,
        });
      });

      expect(mockProviderErrors.userRejectedRequest).toHaveBeenCalled();
      expect(mockSerializeError).toHaveBeenCalled();
      expect(mockRejectPendingApproval).toHaveBeenCalledWith(
        'tx-123',
        expect.objectContaining({ serialized: true }),
      );
      expect(mockDispatch).toHaveBeenCalledWith(mockThunk);
    });
  });

  describe('error handling', () => {
    it('logs error and does not navigate when replacement fails', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      mockReplaceTransaction.mockRejectedValue(new Error('Replacement failed'));

      const { result } = renderHook(() => useMusdPaymentToken());

      const crossChainToken = {
        address: '0xlineaToken' as Hex,
        chainId: '0xe708' as Hex,
      };

      await act(async () => {
        await result.current.onPaymentTokenChange(crossChainToken);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[mUSD Conversion] Failed to replace transaction from PayWithModal',
        expect.any(Error),
      );
      expect(mockNavigate).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('does not navigate when replacement returns undefined', async () => {
      mockReplaceTransaction.mockResolvedValue(undefined);

      const { result } = renderHook(() => useMusdPaymentToken());

      const crossChainToken = {
        address: '0xlineaToken' as Hex,
        chainId: '0xe708' as Hex,
      };

      await act(async () => {
        await result.current.onPaymentTokenChange(crossChainToken);
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('rapid token switching prevention', () => {
    it('prevents duplicate replacement attempts', async () => {
      mockReplaceTransaction.mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve('new-tx'), 100)),
      );

      const { result } = renderHook(() => useMusdPaymentToken());

      const crossChainToken = {
        address: '0xlineaToken' as Hex,
        chainId: '0xe708' as Hex,
      };

      const promise1 = act(async () => {
        await result.current.onPaymentTokenChange(crossChainToken);
      });

      const promise2 = act(async () => {
        await result.current.onPaymentTokenChange(crossChainToken);
      });

      await Promise.all([promise1, promise2]);

      expect(mockReplaceTransaction).toHaveBeenCalledTimes(1);
    });

    it('tracks isReplacing state during replacement', async () => {
      const resolver: { resolve?: (value: string) => void } = {};
      mockReplaceTransaction.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolver.resolve = resolve;
          }),
      );

      const { result } = renderHook(() => useMusdPaymentToken());

      expect(result.current.isReplacing).toBe(false);

      const crossChainToken = {
        address: '0xlineaToken' as Hex,
        chainId: '0xe708' as Hex,
      };

      let replacementPromise: Promise<void>;
      act(() => {
        replacementPromise =
          result.current.onPaymentTokenChange(crossChainToken);
      });

      expect(result.current.isReplacing).toBe(true);

      await act(async () => {
        if (resolver.resolve) {
          resolver.resolve('new-tx');
        }
        await replacementPromise;
      });

      // isReplacing stays true after navigation (didNavigate flag skips setState)
      expect(result.current.isReplacing).toBe(true);
    });

    it('resets isReplacing when replacement returns no transaction ID', async () => {
      mockReplaceTransaction.mockResolvedValue(undefined);

      const { result } = renderHook(() => useMusdPaymentToken());

      await act(async () => {
        await result.current.onPaymentTokenChange({
          address: '0xlineaToken' as Hex,
          chainId: '0xe708' as Hex,
        });
      });

      expect(result.current.isReplacing).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('calls setPayToken when currentConfirmation is null', async () => {
      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: null,
      });

      const { result } = renderHook(() => useMusdPaymentToken());

      const token = {
        address: '0xtoken' as Hex,
        chainId: '0x1' as Hex,
      };

      await act(async () => {
        await result.current.onPaymentTokenChange(token);
      });

      expect(mockSetPayToken).toHaveBeenCalledWith(token);
      expect(mockReplaceTransaction).not.toHaveBeenCalled();
    });

    it('calls setPayToken when transaction chainId is undefined', async () => {
      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: {
          ...mockTransactionMeta,
          chainId: undefined,
        },
      });

      const { result } = renderHook(() => useMusdPaymentToken());

      const token = {
        address: '0xtoken' as Hex,
        chainId: '0x1' as Hex,
      };

      await act(async () => {
        await result.current.onPaymentTokenChange(token);
      });

      expect(mockSetPayToken).toHaveBeenCalledWith(token);
      expect(mockReplaceTransaction).not.toHaveBeenCalled();
    });
  });
});
