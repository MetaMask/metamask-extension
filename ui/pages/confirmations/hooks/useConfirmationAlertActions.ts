import { useCallback } from 'react';
import { useTransactionAlertActions } from './alerts/useTransactionAlertActions';

const useConfirmationAlertActions = () => {
  const processTransactionActions = useTransactionAlertActions();

  const processAction = useCallback(
    (actionKey: string) => {
      processTransactionActions(actionKey);
    },
    [processTransactionActions],
  );

  return processAction;
};

export default useConfirmationAlertActions;
