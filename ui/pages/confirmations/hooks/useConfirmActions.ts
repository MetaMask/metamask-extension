import { TransactionMeta } from '@metamask/transaction-controller';
import { providerErrors, serializeError } from '@metamask/rpc-errors';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { MetaMetricsEventLocation } from '../../../../shared/constants/metametrics';
import { clearConfirmTransaction } from '../../../ducks/confirm-transaction/confirm-transaction.duck';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import {
  rejectPendingApproval,
  setNextNonce,
  updateCustomNonce,
} from '../../../store/actions';
import { useConfirmContext } from '../context/confirm';
import { useAppDispatch } from '../../../store/hooks';
import { useConfirmSendNavigation } from './useConfirmSendNavigation';

export const useConfirmActions = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentConfirmation, goBackTo } =
    useConfirmContext<TransactionMeta>();
  const { navigateBackIfSend } = useConfirmSendNavigation();
  const { id: currentConfirmationId } = currentConfirmation || {};

  const rejectApproval = useCallback(
    async ({ location }: { location?: MetaMetricsEventLocation } = {}) => {
      if (!currentConfirmationId) {
        return;
      }

      const error = providerErrors.userRejectedRequest();
      error.data = { location };

      const serializedError = serializeError(error);
      await dispatch(
        rejectPendingApproval(currentConfirmationId, serializedError),
      );
    },
    [currentConfirmationId, dispatch],
  );

  const resetTransactionState = useCallback(() => {
    dispatch(updateCustomNonce(''));
    dispatch(setNextNonce(''));
    dispatch(clearConfirmTransaction());
  }, [dispatch]);

  const onCancel = useCallback(
    async ({
      location,
      navigateBackForSend = false,
      navigateBackToPreviousPage = false,
    }: {
      location?: MetaMetricsEventLocation;
      navigateBackForSend?: boolean;
      navigateBackToPreviousPage?: boolean;
    }) => {
      if (!currentConfirmation) {
        return;
      }
      if (navigateBackForSend) {
        navigateBackIfSend();
      }
      await rejectApproval({ location });
      resetTransactionState();
      if (navigateBackToPreviousPage) {
        // Replace (not push) so the transient wallet-initiated confirmation
        // (perpsDeposit / perpsWithdraw / musdClaim) does not linger in history.
        // Pushing here left a phantom confirm-transaction entry between the
        // origin and the page returned to, which broke back navigation
        // (double-tap) and post-trade navigation on the Perps order screen
        // (TAT-3131). This matches the auto-exit path in the confirm context,
        // which already returns with { replace: true }.
        navigate(goBackTo ?? DEFAULT_ROUTE, { replace: true });
      }
    },
    [
      currentConfirmation,
      navigate,
      navigateBackIfSend,
      rejectApproval,
      resetTransactionState,
      goBackTo,
    ],
  );

  return { onCancel, resetTransactionState };
};
