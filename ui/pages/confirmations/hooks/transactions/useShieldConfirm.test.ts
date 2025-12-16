import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import { PREVIOUS_ROUTE } from '../../../../helpers/constants/routes';
import { useShieldConfirm } from './useShieldConfirm';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: jest.fn(),
}));

const mockNavigate = jest.fn();

describe('useShieldConfirm', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    const { useNavigate } = jest.requireMock('react-router-dom-v5-compat');
    useNavigate.mockReturnValue(mockNavigate);
  });

  describe('handleShieldSubscriptionApprovalTransactionAfterConfirm', () => {
    it('navigates to shield route when transaction type is shieldSubscriptionApprove', () => {
      const { result } = renderHookWithProvider(() => useShieldConfirm());

      const txMeta = {
        type: TransactionType.shieldSubscriptionApprove,
      } as TransactionMeta;

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
      } as TransactionMeta;

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
});
