import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { AlertActionKey } from '../../../components/app/confirm/info/row/constants';
import useRamps from '../../../hooks/ramps/useRamps/useRamps';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';
import { dismissAndDisableAlert } from '../../../ducks/alerts/unconnected-account';

const useConfirmationAlertActions = () => {
  const { openBuyCryptoInPdapp } = useRamps();
  const { openModal } = useTransactionModalContext();
  const dispatch = useDispatch();

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

        case AlertActionKey.OnCloseSmartTransactionsDismissBanner:
          dispatch(dismissAndDisableAlert());
          break;

        default:
          console.error('Unknown alert action key:', actionKey);
          break;
      }
    },
    [openBuyCryptoInPdapp, openModal, dispatch],
  );

  return processAction;
};

export default useConfirmationAlertActions;
