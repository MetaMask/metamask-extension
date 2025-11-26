import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom-v5-compat';
import { useSelector } from 'react-redux';

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
  ENVIRONMENT_TYPE_FULLSCREEN,
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES,
  ORIGIN_METAMASK,
} from '../../../shared/constants/app';
import {
  selectHasApprovalFlows,
  selectHasBridgeQuotes,
  selectPendingApprovalsForNavigation,
} from '../../selectors';
import {
  getFetchParams,
  selectHasSwapsQuotes,
  selectShowAwaitingSwapScreen,
} from '../../ducks/swaps/swaps';
import { useNavState } from '../../contexts/navigation-state';

const SNAP_APPROVAL_TYPES = [
  'wallet_installSnap',
  'wallet_updateSnap',
  'wallet_installSnapResult',
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation,
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval,
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showNameSnapAccount,
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect,
  ///: END:ONLY_INCLUDE_IF
];

export const ConfirmationHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  const navState = useNavState();

  const envType = getEnvironmentType();
  const isNotification = envType === ENVIRONMENT_TYPE_NOTIFICATION;
  const isFullscreen = envType === ENVIRONMENT_TYPE_FULLSCREEN;

  const showAwaitingSwapScreen = useSelector(selectShowAwaitingSwapScreen);
  const hasSwapsQuotes = useSelector(selectHasSwapsQuotes);
  const hasBridgeQuotes = useSelector(selectHasBridgeQuotes);
  const swapsFetchParams = useSelector(getFetchParams);
  const pendingApprovals = useSelector(selectPendingApprovalsForNavigation);
  const hasApprovalFlows = useSelector(selectHasApprovalFlows);

  // Read stayOnHomePage from both v5 location.state and v5-compat navState
  const stayOnHomePage = useMemo(
    () =>
      Boolean(location.state?.stayOnHomePage) ||
      Boolean(navState?.stayOnHomePage),
    [location.state, navState],
  );

  const canRedirect = !isNotification && !stayOnHomePage;

  // Flows that *should* navigate in fullscreen, based on E2E specs
  const hasSnapApproval = pendingApprovals.some((approval) =>
    SNAP_APPROVAL_TYPES.includes(approval.type),
  );

  // Flows that *should not* navigate in fullscreen, based on E2E specs
  const hasSmartTransactionStatus = pendingApprovals.some(
    (approval) =>
      approval.type === 'smartTransaction:showSmartTransactionStatusPage' &&
      approval.origin?.toLowerCase() !== ORIGIN_METAMASK,
  );

  const skipHandler =
    isFullscreen &&
    (hasSmartTransactionStatus || (!hasSnapApproval && !hasApprovalFlows));

  // Ported from home.component - checkStatusAndNavigate()
  useEffect(() => {
    // Only run when on home/default page (for now)
    if (pathname !== DEFAULT_ROUTE) {
      return;
    }

    if (skipHandler) {
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
    isFullscreen,
    navigate,
    pathname,
    pendingApprovals,
    showAwaitingSwapScreen,
    swapsFetchParams,
    skipHandler,
  ]);

  return null;
};
