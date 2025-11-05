import { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom-v5-compat';

import {
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
} from '../../../helpers/constants/routes';
import { Confirmation } from '../types/confirm';
import { useConfirmationNavigation } from './useConfirmationNavigation';

const useSyncConfirmPath = (currentConfirmation?: Confirmation) => {
  const { navigateToId } = useConfirmationNavigation();
  const { id: paramId } = useParams<{ id: string }>();
  const location = useLocation();
  const confirmationId = currentConfirmation?.id;

  useEffect(() => {
    if (!confirmationId) {
      return;
    }

    // Only sync path if we're on a confirmation route
    // Don't sync if user is navigating to other pages like /send
    const isOnConfirmationRoute =
      location.pathname.startsWith(CONFIRM_TRANSACTION_ROUTE) ||
      location.pathname.startsWith(CONFIRMATION_V_NEXT_ROUTE);

    if (!isOnConfirmationRoute) {
      return;
    }

    // Sync the path if URL doesn't have the confirmation ID
    if (!paramId) {
      navigateToId(confirmationId);
    }
  }, [confirmationId, paramId, navigateToId, location.pathname]);
};

export default useSyncConfirmPath;
