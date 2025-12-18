import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useConfirmContext } from '../context/confirm';
import { PREVIOUS_ROUTE } from '../../../helpers/constants/routes';
import { useRedesignedSendFlow } from './useRedesignedSendFlow';
import { useConfirmationNavigation } from './useConfirmationNavigation';

const SendTransactionTypes = [
  TransactionType.simpleSend,
  TransactionType.tokenMethodTransfer,
  TransactionType.tokenMethodTransferFrom,
  TransactionType.tokenMethodSafeTransferFrom,
];

export const useConfirmSendNavigation = () => {
  const navigate = useNavigate();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { enabled: isSendRedesignEnabled } = useRedesignedSendFlow();
  const { navigateNext } = useConfirmationNavigation();

  const navigateBackIfSend = useCallback(async () => {
    if (!isSendRedesignEnabled) {
      return;
    }
    const { origin, type } = currentConfirmation;
    if (origin === 'metamask' && type && SendTransactionTypes.includes(type)) {
      navigate(PREVIOUS_ROUTE);
    } else {
      await navigateNext(currentConfirmation.id);
    }
  }, [currentConfirmation, navigate, isSendRedesignEnabled, navigateNext]);

  return { navigateBackIfSend };
};
