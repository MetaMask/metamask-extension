import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom-v5-compat';
import { useSelector } from 'react-redux';

import {
  AWAITING_SWAP_ROUTE,
  PREPARE_SWAP_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
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
  '/account-list',
  '/snaps',
  '/unlock',
  '/connect/',
  '/confirmation/',
  '/confirm/',
  '/confirm-transaction/',
  '/confirm-add-suggested-token',
  '/confirm-add-suggested-nft',
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

    return isExemptedRoute;
  }, [pathname]);

  const canRedirect = !isNotification && !stayOnHomePage;

  // Flows that *should* navigate in fullscreen, based on E2E specs
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

  // Flows that *should not* navigate in fullscreen, based on E2E specs
  const hasDappSmartTransactionStatus = pendingApprovals.some(
    (approval) =>
      approval.type === 'smartTransaction:showSmartTransactionStatusPage' &&
      approval.origin !== 'metamask' &&
      approval.origin !== 'MetaMask',
  );

  // Ported from home.component - checkStatusAndNavigate()
  useEffect(() => {
    if (isFullscreen && hasDappSmartTransactionStatus) {
      return;
    }

    if (isFullscreen && !hasWalletInitiatedSnapApproval && !hasApprovalFlows) {
      return;
    }

    if (notApplicable) {
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
    hasDappSmartTransactionStatus,
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
