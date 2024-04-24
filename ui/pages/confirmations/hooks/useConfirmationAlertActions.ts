import { useCallback } from 'react';
import { usePersonalSignAlertActions } from './alerts/PersonalSignAlertAction';

const useConfirmationAlertActions = () => {
  const processPersonalSignAction = usePersonalSignAlertActions();

  const processAction = useCallback(
    (actionKey: string) => {
      processPersonalSignAction(actionKey);
    },
    [processPersonalSignAction],
  );

  return processAction;
};

export default useConfirmationAlertActions;
