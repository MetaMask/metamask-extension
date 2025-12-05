import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import {
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
} from '../../../helpers/constants/routes';
import { Confirmation } from '../types/confirm';
import { useConfirmationNavigation } from './useConfirmationNavigation';

const useSyncConfirmPath = (currentConfirmation?: Confirmation) => {
  const { navigateToId } = useConfirmationNavigation();
  const { id: paramId } = useParams<{ id: string }>();
  const confirmationId = currentConfirmation?.id;

  useEffect(() => {
    // Only sync path if we're on a confirmation route
    // Don't sync if user is navigating to other pages like /send
    const isOnConfirmationRoute =
      location.pathname.startsWith(CONFIRM_TRANSACTION_ROUTE) ||
      location.pathname.startsWith(CONFIRMATION_V_NEXT_ROUTE);

    if (!isOnConfirmationRoute) {
      return;
    }

    // Sync the path if URL doesn't have the confirmation ID but we have a current confirmation
    // This ensures /confirm-transaction always becomes /confirm-transaction/<id>
    // which is critical for popup/notification windows and "X of Y" navigation
    if (!paramId && currentConfirmation) {
      navigateToId(confirmationId);
    }
    // Note: confirmations is intentionally excluded from dependencies
    // navigateToId is memoized with useCallback and is sufficient for tracking changes
  }, [paramId, currentConfirmation, navigateToId, confirmationId]);
};

export default useSyncConfirmPath;
