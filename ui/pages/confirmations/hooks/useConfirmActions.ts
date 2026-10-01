import { TransactionMeta } from '@metamask/transaction-controller';
import { providerErrors, serializeError } from '@metamask/rpc-errors';
import { useCallback } from 'react';

import { MetaMetricsEventLocation } from '../../../../shared/constants/metametrics';
import { clearConfirmTransaction } from '../../../ducks/confirm-transaction/confirm-transaction.duck';
import {
  rejectPendingApproval,
  setNextNonce,
  updateCustomNonce,
} from '../../../store/actions';
import { useConfirmContext } from '../context/confirm';
import { useDispatch } from '../../../store/hooks';
import { useConfirmSendNavigation } from './useConfirmSendNavigation';

export const useConfirmActions = () => {
  const dispatch = useDispatch();
  const { currentConfirmation, suppressAutoExit, exitConfirmation } =
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
        suppressAutoExit();
        navigateBackIfSend();
      }
      await rejectApproval({ location });
      resetTransactionState();
      if (navigateBackToPreviousPage) {
        // Shares the confirm context's exit so the confirmation never lingers
        // in history (TAT-3131) and the origin is not duplicated when the
        // confirmation was pushed from it.
        exitConfirmation();
      }
    },
    [
      currentConfirmation,
      navigateBackIfSend,
      rejectApproval,
      resetTransactionState,
      suppressAutoExit,
      exitConfirmation,
    ],
  );

  return { onCancel, resetTransactionState };
};
