import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useConfirmContext } from '../context/confirm';
import { PREVIOUS_ROUTE } from '../../../helpers/constants/routes';

const SendTransactionTypes = [
  TransactionType.simpleSend,
  TransactionType.tokenMethodTransfer,
  TransactionType.tokenMethodTransferFrom,
  TransactionType.tokenMethodSafeTransferFrom,
];

export const useConfirmSendNavigation = () => {
  const navigate = useNavigate();
  const { currentConfirmation, suppressAutoExit } =
    useConfirmContext<TransactionMeta>();

  const navigateBackIfSend = useCallback(() => {
    const { origin, type } = currentConfirmation;
    if (origin === 'metamask' && type && SendTransactionTypes.includes(type)) {
      suppressAutoExit();
      navigate(PREVIOUS_ROUTE);
    }
  }, [currentConfirmation, navigate, suppressAutoExit]);

  return { navigateBackIfSend };
};
