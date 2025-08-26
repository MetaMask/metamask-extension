import { TransactionMeta } from '@metamask/transaction-controller';
import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { useConfirmContext } from '../context/confirm';

export const useConfirmSendNavigation = () => {
  const history = useHistory();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const navigateBackIfSend = useCallback(() => {
    const { origin, type } = currentConfirmation;
    if (origin === 'metamask' && type === 'simpleSend') {
      history.goBack();
    }
  }, [currentConfirmation, history]);

  return { navigateBackIfSend };
};
