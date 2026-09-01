import { TransactionMeta } from '@metamask/transaction-controller';
import { useCallback } from 'react';

import { ORIGIN_METAMASK } from '../../../../shared/constants/app';
import { useConfirmContext } from '../context/confirm';
import { SEND_TRANSACTION_TYPES } from '../constants/send';

export const useConfirmSendNavigation = () => {
  const { currentConfirmation, backTo, setExitTarget } =
    useConfirmContext<TransactionMeta>();

  const returnToSendDraftIfSend = useCallback(() => {
    const { id, origin, type } = currentConfirmation;
    const isWalletInitiatedSend =
      origin === ORIGIN_METAMASK &&
      type &&
      SEND_TRANSACTION_TYPES.includes(type);

    if (!isWalletInitiatedSend || !backTo) {
      return false;
    }

    setExitTarget({ confirmationId: id, route: backTo });
    return true;
  }, [backTo, currentConfirmation, setExitTarget]);

  return { returnToSendDraftIfSend };
};
