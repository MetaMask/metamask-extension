import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { PREVIOUS_ROUTE } from '../../../../helpers/constants/routes';
import { useShieldConfirm } from './useShieldConfirm';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockCaptureShieldCryptoConfirmationEvent = jest.fn();

jest.mock('../../../../hooks/shield/metrics/useSubscriptionMetrics', () => ({
  useSubscriptionMetrics: () => ({
    captureShieldCryptoConfirmationEvent:
      mockCaptureShieldCryptoConfirmationEvent,
  }),
}));

describe('useShieldConfirm', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    const { useNavigate } = jest.requireMock('react-router-dom');
    useNavigate.mockReturnValue(mockNavigate);
  });

  describe('handleShieldSubscriptionApprovalTransactionAfterConfirm', () => {
    it('navigates to shield route when transaction type is shieldSubscriptionApprove', () => {
      const { result } = renderHookWithProvider(() => useShieldConfirm());

      const txMeta = {
        type: TransactionType.shieldSubscriptionApprove,
      } as unknown as TransactionMeta;

      result.current.handleShieldSubscriptionApprovalTransactionAfterConfirm(
        txMeta,
      );

      expect(mockNavigate).toHaveBeenCalledWith(
        '/settings/transaction-shield?waitForSubscriptionCreation=true',
      );
    });

    it('does not navigate when transaction type is not shieldSubscriptionApprove', () => {
      const { result } = renderHookWithProvider(() => useShieldConfirm());

      const txMeta = {
        type: TransactionType.contractInteraction,
      } as unknown as TransactionMeta;

      result.current.handleShieldSubscriptionApprovalTransactionAfterConfirm(
        txMeta,
      );

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('handleShieldSubscriptionApprovalTransactionAfterConfirmErr', () => {
    it('navigates back when transaction type is shieldSubscriptionApprove', () => {
      const { result } = renderHookWithProvider(() => useShieldConfirm());

      const txMeta = {
        type: TransactionType.shieldSubscriptionApprove,
      } as TransactionMeta;

      result.current.handleShieldSubscriptionApprovalTransactionAfterConfirmErr(
        txMeta,
      );

      expect(mockNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
      expect(mockCaptureShieldCryptoConfirmationEvent).not.toHaveBeenCalled();
    });

    it('does not navigate when transaction type is not shieldSubscriptionApprove', () => {
      const { result } = renderHookWithProvider(() => useShieldConfirm());

      const txMeta = {
        type: TransactionType.contractInteraction,
      } as TransactionMeta;

      result.current.handleShieldSubscriptionApprovalTransactionAfterConfirmErr(
        txMeta,
      );

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('crypto confirmation metrics', () => {
    it('tracks when the user rejects the Shield crypto confirmation', () => {
      const txMeta = {
        id: 'shield-approval-transaction',
        type: TransactionType.shieldSubscriptionApprove,
        chainId: '0x1',
        isGasFeeSponsored: false,
      } as unknown as TransactionMeta;
      const { result } = renderHookWithProvider(() => useShieldConfirm());
      mockCaptureShieldCryptoConfirmationEvent.mockClear();

      result.current.handleShieldSubscriptionApprovalTransactionRejected(
        txMeta,
      );

      expect(mockCaptureShieldCryptoConfirmationEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          confirmationScreenStatus: 'rejected',
          hasInsufficientGas: false,
        }),
      );
    });
  });
});
