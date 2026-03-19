import { useCallback } from 'react';
import {
  TransactionEnvelopeType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { AlertActionKey } from '../../../components/app/confirm/info/row/constants';
import useRamps from '../../../hooks/ramps/useRamps/useRamps';
import { useGasFeeModalContext } from '../context/gas-fee-modal';
import { GasModalType } from '../constants/gas';
import { useTransactionMetadataRequest } from './useTransactionMetadataRequest';

const useConfirmationAlertActions = () => {
  const { openBuyCryptoInPdapp } = useRamps();
  const { openGasFeeModal } = useGasFeeModalContext();
  const currentConfirmation = useTransactionMetadataRequest();

  const processAction = useCallback(
    (actionKey: string) => {
      switch (actionKey) {
        case AlertActionKey.Buy:
          openBuyCryptoInPdapp();
          break;

        case AlertActionKey.ShowAdvancedGasFeeModal: {
          const advancedModalType =
            currentConfirmation?.txParams?.type ===
            TransactionEnvelopeType.legacy
              ? GasModalType.AdvancedGasPriceModal
              : GasModalType.AdvancedEIP1559Modal;
          openGasFeeModal(advancedModalType);
          break;
        }

        case AlertActionKey.ShowGasFeeModal:
          openGasFeeModal(GasModalType.EstimatesModal);
          break;

        default:
          console.error('Unknown alert action key:', actionKey);
          break;
      }
    },
    [openBuyCryptoInPdapp, openGasFeeModal, currentConfirmation],
  );

  return processAction;
};

export default useConfirmationAlertActions;
