import { TransactionMeta } from '@metamask/transaction-controller';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfirmContext } from '../context/confirm';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import {
  CONFIRM_RETURN_TO_KEY,
  RETURN_TO_PREVIOUS_TYPES,
} from './confirmPreviousNavigation';

export {
  CONFIRM_RETURN_TO_KEY,
  RETURN_TO_PREVIOUS_TYPES,
  setConfirmReturnTo,
} from './confirmPreviousNavigation';

export const useConfirmPreviousNavigation = () => {
  const navigate = useNavigate();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const navigateBackToPrevious = useCallback(() => {
    const { type } = currentConfirmation;
    if (type && RETURN_TO_PREVIOUS_TYPES.includes(type)) {
      const returnTo = sessionStorage.getItem(CONFIRM_RETURN_TO_KEY);
      sessionStorage.removeItem(CONFIRM_RETURN_TO_KEY);
      navigate(returnTo || DEFAULT_ROUTE);
    }
  }, [currentConfirmation, navigate]);

  return { navigateBackToPrevious };
};
