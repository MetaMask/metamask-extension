import { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom-v5-compat';

import {
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
} from '../../../helpers/constants/routes';
import { Confirmation } from '../types/confirm';
import { useConfirmationNavigation } from './useConfirmationNavigation';

const useSyncConfirmPath = (
  currentConfirmation?: Confirmation,
  routeParamId?: string,
) => {
  const { navigateToId, confirmations } = useConfirmationNavigation();
  const location = useLocation();

  // Use routeParamId from props if available (passed from v5 Route),
  // otherwise fall back to useParams() for v5-compat Routes
  const urlParams = useParams<{ id: string }>();
  const paramId = routeParamId || urlParams.id;

  useEffect(() => {
    // Only sync path if we're on a confirmation route
    // Don't sync if user is navigating to other pages like /send
    const isOnConfirmationRoute =
      location.pathname.startsWith(CONFIRM_TRANSACTION_ROUTE) ||
      location.pathname.startsWith(CONFIRMATION_V_NEXT_ROUTE);

    if (!isOnConfirmationRoute) {
      return;
    }

    // Sync the path if URL doesn't have the confirmation ID AND no confirmation is currently loaded
    // Navigate to the first confirmation in the queue to fix "2 of 3" navigation issue
    // Check !currentConfirmation to prevent infinite navigation loops
    if (!paramId && !currentConfirmation && confirmations?.length > 0) {
      const firstConfirmationId = confirmations[0]?.id;
      navigateToId(firstConfirmationId);
    }
  }, [
    paramId,
    currentConfirmation,
    navigateToId,
    location.pathname,
    confirmations,
  ]);
};

export default useSyncConfirmPath;
