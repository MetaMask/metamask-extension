import { useCallback } from 'react';
import { AlertActionKey } from '../../../components/app/confirm/info/row/constants';
import useRamps from '../../../hooks/experiences/useRamps';

const useConfirmationAlertActions = () => {
  const { openBuyCryptoInPdapp } = useRamps();

  const processAction = useCallback(
    (actionKey: string) => {
      switch (actionKey) {
        case AlertActionKey.Buy:
          openBuyCryptoInPdapp();
          break;
        default:
          console.error('Unknown alert action key:', actionKey);
          break;
      }
    },
    [openBuyCryptoInPdapp],
  );

  return processAction;
};

export default useConfirmationAlertActions;
