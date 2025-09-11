import { TransactionMeta } from '@metamask/transaction-controller';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';

import { useConfirmContext } from '../context/confirm';
import { useRedesignedSendFlow } from './useRedesignedSendFlow';

export const useConfirmSendNavigation = () => {
  const navigate = useNavigate();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { enabled: isSendRedesignEnabled } = useRedesignedSendFlow();

  const navigateBackIfSend = useCallback(() => {
    if (!isSendRedesignEnabled) {
      return;
    }
    const { origin, type } = currentConfirmation;
    if (origin === 'metamask' && type === 'simpleSend') {
      navigate(-1);
    }
  }, [currentConfirmation, navigate, isSendRedesignEnabled]);

  return { navigateBackIfSend };
};
