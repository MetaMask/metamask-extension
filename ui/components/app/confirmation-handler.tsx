import React, { useEffect, useMemo } from 'react';
import {
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom-v5-compat';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import {
  AWAITING_SWAP_ROUTE,
  PREPARE_SWAP_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
  CONNECT_ROUTE,
} from '../../helpers/constants/routes';
import {
  selectPendingApprovalsForNavigation,
  getApprovalFlows,
} from '../../selectors';
import { getIsUnlocked } from '../../ducks/metamask/metamask';
import {
  getBackgroundSwapRouteState,
  getFetchParams,
  getQuotes,
} from '../../ducks/swaps/swaps';
import { navigateToConfirmation } from '../../pages/confirmations/hooks/useConfirmationNavigation';
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../shared/constants/app';
import { useNavState } from '../../contexts/navigation-state';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../app/scripts/lib/util';

export const ConfirmationHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const navState = useNavState();
  const isUnlocked = useSelector(getIsUnlocked);
  const pendingApprovals = useSelector(selectPendingApprovalsForNavigation);
  const approvalFlows = useSelector(getApprovalFlows);
  const swapsRouteState = useSelector(getBackgroundSwapRouteState);
  const swapsFetchParams = useSelector(getFetchParams);
  const swapsQuotes = useSelector(getQuotes, isEqual);
  const bridgeQuotes = useSelector(
    (state: { metamask: { quotes?: Record<string, unknown> } }) =>
      state.metamask.quotes,
    isEqual,
  );

  const windowType = getEnvironmentType();
  const isNotification = windowType === ENVIRONMENT_TYPE_NOTIFICATION;

  // Memoize derived values to prevent unnecessary effect runs
  const haveSwapsQuotes = useMemo(
    () => Boolean(swapsQuotes && Object.values(swapsQuotes).length > 0),
    [swapsQuotes],
  );
  const haveBridgeQuotes = useMemo(
    () => Boolean(bridgeQuotes && Object.values(bridgeQuotes).length > 0),
    [bridgeQuotes],
  );
  const showAwaitingSwapScreen = swapsRouteState === 'awaiting';
  const hasPendingConfirmations =
    pendingApprovals.length > 0 || approvalFlows?.length > 0;

  // Extracted from home.component.js checkStatusAndNavigate
  // Read stayOnHomePage from both v5 location.state and v5-compat navState
  const stayOnHomePage = useMemo(
    () =>
      Boolean(
        (location.state as { stayOnHomePage?: boolean })?.stayOnHomePage,
      ) || Boolean(navState?.stayOnHomePage),
    [location.state, navState],
  );

  const canRedirect = useMemo(
    () => !isNotification && !stayOnHomePage,
    [isNotification, stayOnHomePage],
  );

  const isOnConfirmationRoute = useMemo(
    () =>
      location.pathname.startsWith(CONFIRM_TRANSACTION_ROUTE) ||
      location.pathname.startsWith(CONFIRMATION_V_NEXT_ROUTE) ||
      location.pathname.startsWith(CONNECT_ROUTE),
    [location.pathname],
  );

  const currentConfirmationId = params.id;
  const targetConfirmationId = pendingApprovals?.[0]?.id;
  const isViewingPendingConfirmation = useMemo(
    () =>
      Boolean(
        currentConfirmationId &&
          targetConfirmationId &&
          pendingApprovals.some(
            (approval) => approval.id === currentConfirmationId,
          ),
      ),
    [currentConfirmationId, targetConfirmationId, pendingApprovals],
  );

  useEffect(() => {
    if (!isUnlocked) {
      return;
    }

    // Extracted from home.component.js checkStatusAndNavigate
    // Handle swap/bridge redirects first
    if (canRedirect && showAwaitingSwapScreen) {
      navigate(AWAITING_SWAP_ROUTE);
      return;
    }
    if (canRedirect && (haveSwapsQuotes || swapsFetchParams)) {
      navigate(PREPARE_SWAP_ROUTE);
      return;
    }
    if (canRedirect && haveBridgeQuotes) {
      navigate(`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`);
      return;
    }

    // Only navigate to confirmations if we're not already on a confirmation route
    // or viewing a pending confirmation
    if (
      hasPendingConfirmations &&
      !isOnConfirmationRoute &&
      !isViewingPendingConfirmation
    ) {
      navigateToConfirmation(
        targetConfirmationId,
        pendingApprovals,
        Boolean(approvalFlows?.length),
        navigate,
        '', // queryString
        location.pathname, // currentPathname for skip-navigation optimization
      );
    }
  }, [
    isUnlocked,
    canRedirect,
    showAwaitingSwapScreen,
    haveSwapsQuotes,
    swapsFetchParams,
    haveBridgeQuotes,
    hasPendingConfirmations,
    isOnConfirmationRoute,
    isViewingPendingConfirmation,
    targetConfirmationId,
    pendingApprovals,
    approvalFlows,
    navigate,
  ]);

  return null;
};
