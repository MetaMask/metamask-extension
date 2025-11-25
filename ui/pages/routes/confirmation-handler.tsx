import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom-v5-compat';
import { useSelector } from 'react-redux';

import {
  ACCOUNT_LIST_PAGE_ROUTE,
  AWAITING_SWAP_ROUTE,
  PREPARE_SWAP_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  SNAPS_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
  UNLOCK_ROUTE,
  CONNECT_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
  CONFIRM_ADD_SUGGESTED_NFT_ROUTE,
} from '../../helpers/constants/routes';
import { getConfirmationRoute } from '../confirmations/hooks/useConfirmationNavigation';
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_FULLSCREEN,
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES,
} from '../../../shared/constants/app';
import {
  getHasApprovalFlows,
  getHasBridgeQuotes,
  selectPendingApprovalsForNavigation,
} from '../../selectors';
import {
  getFetchParams,
  getHasSwapsQuotes,
  getShowAwaitingSwapScreen,
} from '../../ducks/swaps/swaps';
import { useNavState } from '../../contexts/navigation-state';

const EXEMPTED_ROUTES = [
  ACCOUNT_LIST_PAGE_ROUTE,
  SNAPS_ROUTE,
  UNLOCK_ROUTE,
  CONNECT_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
  CONFIRM_ADD_SUGGESTED_NFT_ROUTE,
];

const SNAP_APPROVAL_TYPES = [
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation,
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval,
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showNameSnapAccount,
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect,
  ///: END:ONLY_INCLUDE_IF
  'wallet_installSnap',
  'wallet_updateSnap',
  'wallet_installSnapResult',
];

export const ConfirmationHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  const navState = useNavState();

  const envType = getEnvironmentType();
  const isPopup = envType === ENVIRONMENT_TYPE_POPUP;
  const isNotification = envType === ENVIRONMENT_TYPE_NOTIFICATION;
  const isFullscreen = envType === ENVIRONMENT_TYPE_FULLSCREEN;

  const showAwaitingSwapScreen = useSelector(getShowAwaitingSwapScreen);
  const hasSwapsQuotes = useSelector(getHasSwapsQuotes);
  const hasBridgeQuotes = useSelector(getHasBridgeQuotes);
  const swapsFetchParams = useSelector(getFetchParams);
  const pendingApprovals = useSelector(selectPendingApprovalsForNavigation);
  const hasApprovalFlows = useSelector(getHasApprovalFlows);

  // Read stayOnHomePage from both v5 location.state and v5-compat navState
  const stayOnHomePage = useMemo(
    () =>
      Boolean(location.state?.stayOnHomePage) ||
      Boolean(navState?.stayOnHomePage),
    [location.state, navState],
  );

  const notApplicable = useMemo(() => {
    const isExemptedRoute = EXEMPTED_ROUTES.some(
      (route) => pathname.startsWith(route) || pathname === route,
    );

    // Flows that *should not* navigate in fullscreen, based on E2E specs
    const isExemptedApproval =
      isFullscreen &&
      pendingApprovals.some(
        (approval) =>
          approval.type === 'smartTransaction:showSmartTransactionStatusPage' &&
          approval.origin !== 'metamask' &&
          approval.origin !== 'MetaMask',
      );

    return isExemptedRoute || isExemptedApproval;
  }, [pathname, pendingApprovals, isFullscreen]);

  // Flows that *should* navigate in fullscreen, based on E2E specs
  const hasWalletInitiatedSnapApproval = pendingApprovals.some((approval) =>
    SNAP_APPROVAL_TYPES.includes(approval.type),
  );

  const canRedirect = !isNotification && !stayOnHomePage;

  // Ported from home.component - checkStatusAndNavigate()
  useEffect(() => {
    if (notApplicable) {
      return;
    }

    if (isFullscreen && !hasWalletInitiatedSnapApproval && !hasApprovalFlows) {
      return;
    }

    if (canRedirect && showAwaitingSwapScreen) {
      navigate(AWAITING_SWAP_ROUTE);
    } else if (canRedirect && (hasSwapsQuotes || swapsFetchParams)) {
      navigate(PREPARE_SWAP_ROUTE);
    } else if (canRedirect && hasBridgeQuotes) {
      navigate(CROSS_CHAIN_SWAP_ROUTE + PREPARE_SWAP_ROUTE);
    } else if (pendingApprovals.length || hasApprovalFlows) {
      const url = getConfirmationRoute(
        pendingApprovals?.[0]?.id,
        pendingApprovals,
        hasApprovalFlows,
        '',
      );

      if (url) {
        navigate(url, { replace: true });
      }
    }
  }, [
    canRedirect,
    hasBridgeQuotes,
    hasApprovalFlows,
    hasSwapsQuotes,
    hasWalletInitiatedSnapApproval,
    isFullscreen,
    isNotification,
    isPopup,
    navigate,
    notApplicable,
    pathname,
    pendingApprovals,
    showAwaitingSwapScreen,
    swapsFetchParams,
  ]);

  return null;
};
