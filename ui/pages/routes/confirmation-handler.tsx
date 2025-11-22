import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom-v5-compat';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';

import {
  AWAITING_SWAP_ROUTE,
  PREPARE_SWAP_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';
import { getConfirmationRoute } from '../confirmations/hooks/useConfirmationNavigation';
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
} from '../../../shared/constants/app';
import {
  getApprovalFlows,
  selectPendingApprovalsForNavigation,
} from '../../selectors';
import {
  getBackgroundSwapRouteState,
  getFetchParams,
  getQuotes,
} from '../../ducks/swaps/swaps';
import { useNavState } from '../../contexts/navigation-state';

export const ConfirmationHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  const navState = useNavState();

  const envType = getEnvironmentType();
  const isPopup = envType === ENVIRONMENT_TYPE_POPUP;
  const isNotification = envType === ENVIRONMENT_TYPE_NOTIFICATION;
  // const isSidepanel = envType === ENVIRONMENT_TYPE_SIDEPANEL;

  const swapsRouteState = useSelector(getBackgroundSwapRouteState);
  const swapsQuotes = useSelector(getQuotes, isEqual);
  const bridgeQuotes = useSelector(
    (state: { metamask: { quotes?: Record<string, unknown> } }) =>
      state.metamask.quotes,
    isEqual,
  );
  const showAwaitingSwapScreen = swapsRouteState === 'awaiting';
  const haveSwapsQuotes = useMemo(
    () => Boolean(Object.values(swapsQuotes || {}).length),
    [swapsQuotes],
  );

  // const swapsFetchParams = swapsState.fetchParams;
  const swapsFetchParams = useSelector(getFetchParams);
  const haveBridgeQuotes = useMemo(
    () => Boolean(Object.values(bridgeQuotes || {}).length),
    [bridgeQuotes],
  );

  // const pendingApprovals = selectPendingApprovalsForNavigation(state);
  const pendingApprovals = useSelector(selectPendingApprovalsForNavigation);
  const approvalFlows = useSelector(getApprovalFlows);
  const hasApprovalFlows = approvalFlows?.length > 0;

  // Read stayOnHomePage from both v5 location.state and v5-compat navState
  const stayOnHomePage = useMemo(
    () =>
      Boolean(location.state?.stayOnHomePage) ||
      Boolean(navState?.stayOnHomePage),
    [location.state, navState],
  );

  const canRedirect = !isNotification && !stayOnHomePage;

  // Ported from home.component - componentDidMount/componentDidUpdate
  useEffect(() => {
    // Only run this navigation logic in popup or notification windows.
    // In fullscreen, dapp confirmations open in Dialog windows - don't navigate to them.
    if (!isPopup && !isNotification) {
      return;
    }

    // Only run when on home/default page (for now)
    if (pathname !== DEFAULT_ROUTE) {
      return;
    }

    if (canRedirect && showAwaitingSwapScreen) {
      navigate(AWAITING_SWAP_ROUTE);
    } else if (canRedirect && (haveSwapsQuotes || swapsFetchParams)) {
      navigate(PREPARE_SWAP_ROUTE);
    } else if (canRedirect && haveBridgeQuotes) {
      navigate(CROSS_CHAIN_SWAP_ROUTE + PREPARE_SWAP_ROUTE);
    } else if (pendingApprovals.length || hasApprovalFlows) {
      const url = getConfirmationRoute(
        pendingApprovals?.[0]?.id,
        pendingApprovals,
        hasApprovalFlows,
        '', // queryString
      );

      if (url) {
        navigate(url, { replace: true });
      }
    }
  }, [
    pathname,
    isNotification,
    isPopup,
    canRedirect,
    showAwaitingSwapScreen,
    haveSwapsQuotes,
    swapsFetchParams,
    haveBridgeQuotes,
    pendingApprovals,
    hasApprovalFlows,
    navigate,
  ]);

  return null;
};
