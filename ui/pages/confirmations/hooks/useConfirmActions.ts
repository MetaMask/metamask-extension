import { TransactionMeta } from '@metamask/transaction-controller';
import { providerErrors, serializeError } from '@metamask/rpc-errors';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import { useHistory } from 'react-router-dom';
import { MetaMetricsEventLocation } from '../../../../shared/constants/metametrics';
import { clearConfirmTransaction } from '../../../ducks/confirm-transaction/confirm-transaction.duck';
import {
  rejectPendingApproval,
  setNextNonce,
  updateCustomNonce,
} from '../../../store/actions';
import { useConfirmContext } from '../context/confirm';
import { useConfirmSendNavigation } from './useConfirmSendNavigation';

export const useConfirmActions = () => {
  const dispatch = useDispatch();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { navigateBackIfSend } = useConfirmSendNavigation();
  const { id: currentConfirmationId, origin } = currentConfirmation || {};
  const history = useHistory();

  const rejectApproval = useCallback(
    ({ location }: { location?: MetaMetricsEventLocation } = {}) => {
      if (!currentConfirmationId) {
        return;
      }

      const error = providerErrors.userRejectedRequest();
      error.data = { location };

      const serializedError = serializeError(error);
      dispatch(rejectPendingApproval(currentConfirmationId, serializedError));
    },
    [currentConfirmationId, dispatch],
  );

  const resetTransactionState = useCallback(() => {
    dispatch(updateCustomNonce(''));
    dispatch(setNextNonce(''));
    dispatch(clearConfirmTransaction());
  }, [dispatch]);

  const onCancel = useCallback(
    ({
      location,
      navigateBackForSend = false,
    }: {
      location?: MetaMetricsEventLocation;
      navigateBackForSend?: boolean;
    }) => {
      if (!currentConfirmation) {
        return;
      }

      if (navigateBackForSend) {
        navigateBackIfSend();
      }

      if (origin === ORIGIN_METAMASK) {
        history.goBack();
      }

      rejectApproval({ location });
      resetTransactionState();
    },
    [
      currentConfirmation,
      history,
      navigateBackIfSend,
      origin,
      rejectApproval,
      resetTransactionState,
    ],
  );

  return { onCancel, resetTransactionState };
};
