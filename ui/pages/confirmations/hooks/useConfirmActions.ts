import { TransactionMeta } from '@metamask/transaction-controller';
import { providerErrors, serializeError } from '@metamask/rpc-errors';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { MetaMetricsEventLocation } from '../../../../shared/constants/metametrics';
import { clearConfirmTransaction } from '../../../ducks/confirm-transaction/confirm-transaction.duck';
import {
  rejectPendingApproval,
  setNextNonce,
  updateCustomNonce,
} from '../../../store/actions';
import { useConfirmContext } from '../context/confirm';
import { useConfirmPreviousNavigation } from './useConfirmPreviousNavigation';
import { useConfirmSendNavigation } from './useConfirmSendNavigation';

export const useConfirmActions = () => {
  const dispatch = useDispatch();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { navigateBackIfSend } = useConfirmSendNavigation();
  const { navigateBackToPrevious } = useConfirmPreviousNavigation();
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
        navigateBackToPrevious();
      }
    },
    [
      currentConfirmation,
      navigateBackIfSend,
      navigateBackToPrevious,
      rejectApproval,
      resetTransactionState,
    ],
  );

  return { onCancel, resetTransactionState };
};
