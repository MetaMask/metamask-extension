import { TransactionMeta } from '@metamask/transaction-controller';
import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { useConfirmContext } from '../context/confirm';
import { useRedesignedSendFlow } from './useRedesignedSendFlow';

export const useConfirmSendNavigation = () => {
  const history = useHistory();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { enabled: isSendRedesignEnabled } = useRedesignedSendFlow();

  const navigateBackIfSend = useCallback(() => {
    if (!isSendRedesignEnabled) {
      return;
    }
    const { origin, type } = currentConfirmation;
    if (origin === 'metamask' && type === 'simpleSend') {
      history.goBack();
    }
  }, [currentConfirmation, history, isSendRedesignEnabled]);

  return { navigateBackIfSend };
};
