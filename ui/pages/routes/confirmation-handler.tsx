import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom-v5-compat';
import { useSelector } from 'react-redux';

// import { ApprovalType } from '@metamask/controller-utils';
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
  // ENVIRONMENT_TYPE_FULLSCREEN,
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

const APPROVAL_TYPES = [
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation,
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval,
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showNameSnapAccount,
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect,
  ///: END:ONLY_INCLUDE_IF
  // 'wallet_installSnap',
  // 'wallet_updateSnap',
  // 'wallet_installSnapResult',
];

export const ConfirmationHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  const navState = useNavState();

  const envType = getEnvironmentType();
  const isNotification = envType === ENVIRONMENT_TYPE_NOTIFICATION;
  // const isFullscreen = envType === ENVIRONMENT_TYPE_FULLSCREEN;

  const showAwaitingSwapScreen = useSelector(getShowAwaitingSwapScreen);
  const hasSwapsQuotes = useSelector(getHasSwapsQuotes);
  const hasBridgeQuotes = useSelector(getHasBridgeQuotes);
  const swapsFetchParams = useSelector(getFetchParams);
  const pendingApprovals = useSelector(selectPendingApprovalsForNavigation);
  const hasApprovalFlows = useSelector(getHasApprovalFlows);

  const isFirst = useRef(true);

  // Read stayOnHomePage from both v5 location.state and v5-compat navState
  const stayOnHomePage = useMemo(
    () =>
      Boolean(location.state?.stayOnHomePage) ||
      Boolean(navState?.stayOnHomePage),
    [location.state, navState],
  );

  const canRedirect = !isNotification && !stayOnHomePage;

  const checkStatusAndNavigate = useCallback(() => {
    // Only run when on home/default page (for now)
    if (pathname !== DEFAULT_ROUTE) {
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
    hasApprovalFlows,
    hasBridgeQuotes,
    hasSwapsQuotes,
    navigate,
    pendingApprovals,
    pathname,
    showAwaitingSwapScreen,
    swapsFetchParams,
  ]);

  // Flows that *should* navigate in fullscreen, based on E2E specs
  const hasAllowedPopupRedirectApprovals = pendingApprovals.some((approval) =>
    APPROVAL_TYPES.includes(approval.type),
  );

  // Flows that *should not* navigate in fullscreen, based on E2E specs
  // const hasSmartTransactionStatus = pendingApprovals.some(
  //   (approval) =>
  //     approval.type === 'smartTransaction:showSmartTransactionStatusPage' &&
  //     approval.origin !== 'metamask' &&
  //     approval.origin !== 'MetaMask',
  // );

  // const ignored = useMemo(() => {
  //   return (
  //     isFullscreen &&
  //     (hasSmartTransactionStatus || (!hasSnapApproval && !hasApprovalFlows))
  //   );
  // }, [
  //   isFullscreen,
  //   hasSmartTransactionStatus,
  //   hasSnapApproval,
  //   hasApprovalFlows,
  // ]);

  // Ported from home.component - componentDidMount()
  useEffect(() => {
    checkStatusAndNavigate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Ported from home.component - componendDidUpdate()
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return; // prevent running on first render
    }

    if (isNotification || hasAllowedPopupRedirectApprovals) {
      checkStatusAndNavigate();
    }
  }, [
    isNotification,
    hasAllowedPopupRedirectApprovals,
    checkStatusAndNavigate,
  ]);

  return null;
};
