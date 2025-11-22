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
  ENVIRONMENT_TYPE_FULLSCREEN,
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
  const isFullscreen = envType === ENVIRONMENT_TYPE_FULLSCREEN;
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

  const hasWalletInitiatedSnapApproval = pendingApprovals.some(
    (approval) =>
      approval.type === 'wallet_installSnap' ||
      approval.type === 'wallet_updateSnap' ||
      approval.type === 'wallet_installSnapResult' ||
      approval.type === 'snap_manageAccounts:showSnapAccountRedirect' ||
      approval.type === 'snap_manageAccounts:confirmAccountCreation' ||
      approval.type === 'snap_manageAccounts:confirmAccountRemoval' ||
      approval.type === 'snap_manageAccounts:showNameSnapAccount',
  );

  // Ported from home.component - componentDidMount/componentDidUpdate
  useEffect(() => {
    // In fullscreen, skip navigation for dapp confirmations (they open in Dialog windows)
    // but allow wallet-initiated snap flows and approval flows (e.g., smart transactions)
    if (isFullscreen && !hasWalletInitiatedSnapApproval && !hasApprovalFlows) {
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
    hasWalletInitiatedSnapApproval,
    isNotification,
    isPopup,
    isFullscreen,
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
