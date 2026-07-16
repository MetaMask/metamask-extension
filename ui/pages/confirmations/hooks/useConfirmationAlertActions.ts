import { useCallback } from 'react';
import type { Hex } from '@metamask/utils';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import {
  TransactionEnvelopeType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { AlertActionKey } from '../../../components/app/confirm/info/row/constants';
import useRampsNavigation from '../../../hooks/ramps/useRampsNavigation/useRampsNavigation';
import { useGasFeeModalContext } from '../context/gas-fee-modal';
import { useConfirmContext } from '../context/confirm';
import { GasModalType } from '../constants/gas';

/**
 * Resolve the chain's native gas token as a CAIP-19 asset id, or `undefined`
 * for custom/unsupported networks (`getNativeAssetForChainId` throws on those).
 *
 * @param chainId - The confirmation's chain id.
 */
function getNativeGasAssetId(chainId?: Hex) {
  if (!chainId) {
    return undefined;
  }
  try {
    return getNativeAssetForChainId(chainId).assetId;
  } catch {
    return undefined;
  }
}

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
          goToBuy({ assetId: getNativeGasAssetId(chainId), chainId });
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
