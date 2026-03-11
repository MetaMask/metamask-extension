import { renderHook, act } from '@testing-library/react-hooks';
import { TransactionType } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { replaceMusdConversionTransactionForPayToken } from '../../components/app/musd/utils/transaction-utils';
import { useConfirmContext } from '../../pages/confirmations/context/confirm';
import { useTransactionPayToken } from '../../pages/confirmations/hooks/pay/useTransactionPayToken';
import { useMusdPaymentToken } from './useMusdPaymentToken';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(() => jest.fn()),
  useLocation: jest.fn(() => ({ search: '' })),
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

const mockUseConfirmContext = useConfirmContext as jest.Mock;
const mockUseTransactionPayToken = useTransactionPayToken as jest.Mock;
const mockReplaceTransaction =
  replaceMusdConversionTransactionForPayToken as jest.Mock;
const mockUseNavigate = useNavigate as jest.Mock;
const mockUseLocation = useLocation as jest.Mock;

describe('useMusdPaymentToken', () => {
  const mockSetPayToken = jest.fn();
  const mockNavigate = jest.fn();

  const mockTransactionMeta = {
    id: 'tx-123',
    chainId: '0x1' as Hex, // Ethereum mainnet
    type: TransactionType.musdConversion,
    txParams: {
      from: '0xabc123' as Hex,
      to: '0xdef456' as Hex,
      data: '0x...',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

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
    it('should call setPayToken directly when token is on the same chain', async () => {
      const { result } = renderHook(() => useMusdPaymentToken());

      const sameChainToken = {
        address: '0xnewtoken' as Hex,
        chainId: '0x1' as Hex, // Same as transaction chain
      };

      await act(async () => {
        await result.current.onPaymentTokenChange(sameChainToken);
      });

      expect(mockSetPayToken).toHaveBeenCalledWith(sameChainToken);
      expect(mockReplaceTransaction).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should handle case-insensitive chain comparison', async () => {
      // Transaction is on 0x1, token reports 0X1 (uppercase X)
      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: {
          ...mockTransactionMeta,
          chainId: '0xE708' as Hex, // Linea with uppercase
        },
      });

      const { result } = renderHook(() => useMusdPaymentToken());

      const sameChainToken = {
        address: '0xnewtoken' as Hex,
        chainId: '0xe708' as Hex, // Linea with lowercase
      };

      await act(async () => {
        await result.current.onPaymentTokenChange(sameChainToken);
      });

      // Should treat as same chain (case-insensitive)
      expect(mockSetPayToken).toHaveBeenCalledWith(sameChainToken);
      expect(mockReplaceTransaction).not.toHaveBeenCalled();
    });
  });

  describe('cross-chain token selection', () => {
    it('should call replaceMusdConversionTransactionForPayToken when chains differ', async () => {
      mockReplaceTransaction.mockResolvedValue('new-tx-456');

      const { result } = renderHook(() => useMusdPaymentToken());

      const crossChainToken = {
        address: '0xlineaToken' as Hex,
        chainId: '0xe708' as Hex, // Linea - different from transaction's 0x1
      };

      await act(async () => {
        await result.current.onPaymentTokenChange(crossChainToken);
      });

      // Should NOT call setPayToken
      expect(mockSetPayToken).not.toHaveBeenCalled();

      // Should call replacement function
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

    it('should navigate to new transaction after successful replacement', async () => {
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

    it('should preserve query params when navigating after replacement', async () => {
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

  describe('error handling', () => {
    it('should log error and not navigate when replacement fails', async () => {
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

    it('should not navigate when replacement returns undefined', async () => {
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
    it('should prevent duplicate replacement attempts', async () => {
      // Make replacement take some time
      mockReplaceTransaction.mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve('new-tx'), 100)),
      );

      const { result } = renderHook(() => useMusdPaymentToken());

      const crossChainToken = {
        address: '0xlineaToken' as Hex,
        chainId: '0xe708' as Hex,
      };

      // Start first replacement
      const promise1 = act(async () => {
        await result.current.onPaymentTokenChange(crossChainToken);
      });

      // Immediately try second replacement (should be ignored)
      const promise2 = act(async () => {
        await result.current.onPaymentTokenChange(crossChainToken);
      });

      await Promise.all([promise1, promise2]);

      // Should only have been called once
      expect(mockReplaceTransaction).toHaveBeenCalledTimes(1);
    });

    it('should track isReplacing state during replacement', async () => {
      // Use a wrapper object to avoid non-null assertion
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

      // Start replacement
      let replacementPromise: Promise<void>;
      act(() => {
        replacementPromise =
          result.current.onPaymentTokenChange(crossChainToken);
      });

      // isReplacing should be true during replacement
      expect(result.current.isReplacing).toBe(true);

      // Complete replacement
      await act(async () => {
        if (resolver.resolve) {
          resolver.resolve('new-tx');
        }
        await replacementPromise;
      });

      // isReplacing should be false after completion
      expect(result.current.isReplacing).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle missing currentConfirmation gracefully', async () => {
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

      // Should call setPayToken since we can't detect chain mismatch
      expect(mockSetPayToken).toHaveBeenCalledWith(token);
      expect(mockReplaceTransaction).not.toHaveBeenCalled();
    });

    it('should handle missing chainId in transaction gracefully', async () => {
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

      // Should call setPayToken since we can't detect chain mismatch
      expect(mockSetPayToken).toHaveBeenCalledWith(token);
      expect(mockReplaceTransaction).not.toHaveBeenCalled();
    });
  });
});
