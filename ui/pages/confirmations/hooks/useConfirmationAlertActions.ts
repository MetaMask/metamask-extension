import { useCallback } from 'react';
import {
  TransactionEnvelopeType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { AlertActionKey } from '../../../components/app/confirm/info/row/constants';
import { getNativeAssetId } from '../../../../shared/lib/asset-utils';
import useRampsNavigation from '../../../hooks/ramps/useRampsNavigation/useRampsNavigation';
import { useGasFeeModalContext } from '../context/gas-fee-modal';
import { useConfirmContext } from '../context/confirm';
import { GasModalType } from '../constants/gas';

const useConfirmationAlertActions = () => {
  const { goToBuy } = useRampsNavigation();
  const { openGasFeeModal } = useGasFeeModalContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const processAction = useCallback(
    (actionKey: string) => {
      switch (actionKey) {
        case AlertActionKey.Buy: {
          const chainId = currentConfirmation?.chainId;
          // Pre-select the native gas token so the buy flow lands on
          // build-quote for it; chainId also drives the flag-off Portfolio
          // fallback.
          goToBuy({ assetId: getNativeAssetId(chainId), chainId });
          break;
        }

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
    [goToBuy, openGasFeeModal, currentConfirmation],
  );

  return processAction;
};

export default useConfirmationAlertActions;
