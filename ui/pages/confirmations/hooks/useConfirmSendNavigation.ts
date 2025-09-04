import { TransactionMeta } from '@metamask/transaction-controller';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';

import { useConfirmContext } from '../context/confirm';

export const useConfirmSendNavigation = () => {
  const navigate = useNavigate();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const navigateBackIfSend = useCallback(() => {
    if (!process.env.SEND_REDESIGN_ENABLED) {
      return;
    }
    const { origin, type } = currentConfirmation;
    if (origin === 'metamask' && type === 'simpleSend') {
      navigate(-1);
    }
  }, [currentConfirmation, navigate]);

  return { navigateBackIfSend };
};
