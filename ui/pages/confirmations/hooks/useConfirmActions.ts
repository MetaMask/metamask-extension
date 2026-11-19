import { TransactionMeta } from '@metamask/transaction-controller';
import { providerErrors, serializeError } from '@metamask/rpc-errors';
import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { MetaMetricsEventLocation } from '../../../../shared/constants/metametrics';
import { clearConfirmTransaction } from '../../../ducks/confirm-transaction/confirm-transaction.duck';
import {
  rejectPendingApproval,
  setNextNonce,
  updateCustomNonce,
} from '../../../store/actions';
import { useConfirmContext } from '../context/confirm';
import { useDispatch } from '../../../store/hooks';
import { navigateConfirmationExit } from './useConfirmationNavigation';
import { useConfirmSendNavigation } from './useConfirmSendNavigation';

export const useConfirmActions = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { key: locationKey } = useLocation();
  const { currentConfirmation, goBackTo, goBackAction, suppressAutoExit } =
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
      if (navigateBackToPreviousPage) {
        // The auto-exit effect navigates again once the confirmation is
        // rejected. Suppress it first so only this navigation runs.
        suppressAutoExit();
      }
      await rejectApproval({ location });
      resetTransactionState();
      if (navigateBackToPreviousPage) {
        // Perps deposit and mUSD conversion open the confirmation with
        // replace, so back replaces this entry with goBackTo (TAT-3131).
        // Money deposit and withdraw push it, so back pops. Replacing a
        // pushed confirmation with goBackTo duplicates that page and the
        // next in-app back press does nothing.
        navigateConfirmationExit(navigate, {
          goBackTo,
          goBackAction,
          locationKey,
        });
      }
    },
    [
      currentConfirmation,
      navigate,
      navigateBackIfSend,
      rejectApproval,
      resetTransactionState,
      goBackTo,
      goBackAction,
      locationKey,
      suppressAutoExit,
    ],
  );

  return { onCancel, resetTransactionState };
};
