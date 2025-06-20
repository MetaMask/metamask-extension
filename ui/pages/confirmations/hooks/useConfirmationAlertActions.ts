import { useCallback } from 'react';
import { AlertActionKey } from '../../../components/app/confirm/info/row/constants';
import useRamps from '../../../hooks/ramps/useRamps/useRamps';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';

const useConfirmationAlertActions = () => {
  const { openBuyCryptoInPdapp } = useRamps();
  const { openModal } = useTransactionModalContext();

  const processAction = useCallback(
    (actionKey: string) => {
      switch (actionKey) {
        case AlertActionKey.Buy:
          openBuyCryptoInPdapp();
          break;

        case AlertActionKey.ShowAdvancedGasFeeModal:
          openModal('advancedGasFee');
          break;

        case AlertActionKey.ShowGasFeeModal:
          openModal('editGasFee');
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
