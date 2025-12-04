import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';

import { useConfirmContext } from '../context/confirm';
import { PREVIOUS_ROUTE } from '../../../helpers/constants/routes';
import { useRedesignedSendFlow } from './useRedesignedSendFlow';

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

  const navigateBackIfSend = useCallback(() => {
    if (!isSendRedesignEnabled) {
      return;
    }
    const { origin, type } = currentConfirmation;
    if (origin === 'metamask' && type && SendTransactionTypes.includes(type)) {
      navigate(PREVIOUS_ROUTE);
    }
  }, [currentConfirmation, navigate, isSendRedesignEnabled]);

  return { navigateBackIfSend };
};
