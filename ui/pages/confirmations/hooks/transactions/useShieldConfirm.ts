import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import {
  TRANSACTION_SHIELD_ROUTE,
  PREVIOUS_ROUTE,
} from '../../../../helpers/constants/routes';

/**
 * Handlers for shield subscription approval transaction after confirm in UI
 *
 * @returns
 */
export const useShieldConfirm = () => {
  const navigate = useNavigate();
  /**
   * Handle shield subscription approval transaction after confirm in UI
   * (navigation)
   *
   * @param txMeta - The transaction meta
   */
  const handleShieldSubscriptionApprovalTransactionAfterConfirm = useCallback(
    (txMeta: TransactionMeta) => {
      if (txMeta.type !== TransactionType.shieldSubscriptionApprove) {
        return;
      }

      navigate(`${TRANSACTION_SHIELD_ROUTE}?waitForSubscriptionCreation=true`);
    },
    [navigate],
  );

  /**
   * Handle shield subscription approval transaction approval error
   * (navigation)
   *
   * @param txMeta - The transaction meta
   */
  const handleShieldSubscriptionApprovalTransactionAfterConfirmErr =
    useCallback(
      (txMeta: TransactionMeta) => {
        if (txMeta.type !== TransactionType.shieldSubscriptionApprove) {
          return;
        }

        // go back to previous screen from navigate in `handleShieldSubscriptionApprovalTransactionAfterConfirm`
        navigate(PREVIOUS_ROUTE);
      },
      [navigate],
    );

  return {
    handleShieldSubscriptionApprovalTransactionAfterConfirm,
    handleShieldSubscriptionApprovalTransactionAfterConfirmErr,
  };
};
