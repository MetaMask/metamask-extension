import { useCallback, useEffect } from 'react';
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
  SMART_TRANSACTION_CONFIRMATION_TYPES,
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
  const stayOnHomePage =
    Boolean(location.state?.stayOnHomePage) ||
    Boolean(navState?.stayOnHomePage);

  const canRedirect = !isNotification && !stayOnHomePage;

  // Ported from home.component - checkStatusAndNavigate()
  const checkStatusAndNavigate = useCallback(() => {
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
    hasApprovalFlows,
    hasBridgeQuotes,
    hasSwapsQuotes,
    navigate,
    pendingApprovals,
    showAwaitingSwapScreen,
    swapsFetchParams,
  ]);

  // Flows that *should* navigate in fullscreen, based on E2E specs
  const hasSnapApproval = pendingApprovals.some((approval) =>
    SNAP_APPROVAL_TYPES.includes(approval.type),
  );

  // Flows that *should not* navigate in fullscreen, based on E2E specs
  const hasSmartTransactionStatus = pendingApprovals.some(
    (approval) =>
      approval.type ===
        SMART_TRANSACTION_CONFIRMATION_TYPES.showSmartTransactionStatusPage &&
      approval.origin?.toLowerCase() !== ORIGIN_METAMASK,
  );

  const skipHandler =
    isFullscreen && (hasSmartTransactionStatus || !hasSnapApproval);

  useEffect(() => {
    // Only run when on home/default page (for now)
    if (pathname !== DEFAULT_ROUTE) {
      return;
    }

    if (skipHandler) {
      return;
    }

    checkStatusAndNavigate();
  }, [checkStatusAndNavigate, pathname, skipHandler]);

  return null;
};
