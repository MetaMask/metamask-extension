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
  const { navigateToId } = useConfirmationNavigation();
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

    // Sync the path if URL doesn't have the confirmation ID but we have a current confirmation
    // This ensures /confirm-transaction always becomes /confirm-transaction/<id>
    // which is critical for popup/notification windows and "X of Y" navigation
    if (!paramId && currentConfirmation) {
      navigateToId(currentConfirmation.id);
    }
    // Note: confirmations is intentionally excluded from dependencies
    // navigateToId is memoized with useCallback and is sufficient for tracking changes
  }, [paramId, currentConfirmation, navigateToId, location.pathname]);
};

export default useSyncConfirmPath;
