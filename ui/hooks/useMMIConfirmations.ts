import { TransactionType } from '@metamask/transaction-controller';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { currentConfirmationSelector } from '../pages/confirmations/selectors';
import { getAccountType } from '../selectors';
import { completedTx, showModal } from '../store/actions';
import { mmiActionsFactory } from '../store/institutional/institution-background';

export function useMMIConfirmationInfo() {
  const dispatch = useDispatch();
  const currentConfirmation = useSelector(currentConfirmationSelector);
  const accountType = useSelector(getAccountType);

  const mmiOnSignCallback = useCallback(async () => {
    if (
      !currentConfirmation ||
      currentConfirmation.type !== TransactionType.personalSign
    ) {
      return;
    }
    try {
      dispatch(completedTx(currentConfirmation.id));
    } catch (err: any) {
      dispatch(
        showModal({
          name: 'TRANSACTION_FAILED',
          errorMessage: err.message,
          closeNotification: true,
          operationFailed: true,
        }),
      );
    } finally {
      if (accountType === 'custody') {
        const mmiActions = mmiActionsFactory();
        dispatch(mmiActions.setWaitForConfirmDeepLinkDialog(true));
      }
    }
  }, []);

  return {
    mmiSubmitDisabled:
      currentConfirmation &&
      currentConfirmation.type === TransactionType.personalSign &&
      Boolean(currentConfirmation?.custodyId),
    mmiOnSignCallback,
  };
}
