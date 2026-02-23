import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { shallowEqual } from 'react-redux';

import { getActiveQrCodeScanRequest } from '../../../selectors/selectors';
import { getBridgeQuotes } from '../../../ducks/bridge/selectors';
import { selectBridgeHistoryForAccountGroup } from '../../../ducks/bridge-status/selectors';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';

/**
 * Hook to handle navigation logic for bridge transaction awaiting signatures page.
 * Encapsulates refs and detection logic for transaction success, cancellation, and failure.
 * The refs are tightly coupled with the navigation logic, so they're kept together.
 *
 * @returns void - Navigation is handled internally via useEffect
 */
export function useBridgeTransactionNavigation(): void {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeQuote } = useSelector(getBridgeQuotes, shallowEqual);
  const bridgeHistory = useSelector(selectBridgeHistoryForAccountGroup);
  const activeQrCodeScanRequest = useSelector(getActiveQrCodeScanRequest);

  // Refs to track state transitions for navigation logic
  const prevQrScanRequestRef = useRef<typeof activeQrCodeScanRequest>(null);
  const hasSeenQrScanActiveRef = useRef<boolean>(false);
  const hasSeenRequestIdRef = useRef<boolean>(false);
  const hasSeenActiveQuoteRef = useRef<boolean>(false);

  // Extract requestId from URL params (used when popup state is lost in QR fullscreen flow)
  const requestIdFromLocation = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('requestId') || undefined;
  }, [location.search]);

  // Resolve requestId from activeQuote (popup mode) or URL params (fullscreen mode)
  const requestId = useMemo(
    () => activeQuote?.quote?.requestId ?? requestIdFromLocation ?? undefined,
    [activeQuote?.quote?.requestId, requestIdFromLocation],
  );

  // Find bridge history item for this requestId
  const historyItem = useMemo(() => {
    if (!requestId) {
      return undefined;
    }

    return Object.values(bridgeHistory).find(
      (item) => item?.quote?.requestId === requestId,
    );
  }, [bridgeHistory, requestId]);

  // Check if the bridge transaction has been submitted to the network
  // In two-step flows, a history item with approvalTxId means we're between steps
  const hasSubmittedBridgeTx = useMemo(() => {
    if (!historyItem) {
      return false;
    }

    // History item with approvalTxId means approval is done but bridge tx not submitted yet
    if (historyItem.approvalTxId !== undefined) {
      return false;
    }

    // No approvalTxId means this is the final bridge transaction
    return true;
  }, [historyItem]);

  // Check if we're between approval and bridge steps in a two-step flow
  const isBetweenApprovalAndBridgeSteps = useMemo(() => {
    return historyItem?.approvalTxId !== undefined && !hasSubmittedBridgeTx;
  }, [historyItem, hasSubmittedBridgeTx]);

  // Navigate to activity tab with consistent options
  const navigateToActivity = useCallback(() => {
    navigate(`${DEFAULT_ROUTE}?tab=activity`, {
      replace: true,
      state: { stayOnHomePage: true },
    });
  }, [navigate]);

  // Navigate away when transaction completes (success or cancellation/failure)
  useEffect(() => {
    // Success: Transaction is in bridge history
    if (hasSubmittedBridgeTx) {
      navigateToActivity();
      return;
    }

    // Don't navigate if we're between approval and bridge steps in two-step flow
    if (isBetweenApprovalAndBridgeSteps) {
      return;
    }

    // Track if we've seen a requestId (indicates transaction was initiated)
    if (requestId) {
      hasSeenRequestIdRef.current = true;
    }

    // Track if we've seen activeQuote (indicates transaction was actually started)
    if (activeQuote !== null && activeQuote !== undefined) {
      hasSeenActiveQuoteRef.current = true;
    }

    // Track QR scan state transitions
    const prevQrScanRequest = prevQrScanRequestRef.current;

    // Mark QR scan as seen when it becomes active (truthy object)
    if (activeQrCodeScanRequest !== null && activeQrCodeScanRequest !== false) {
      hasSeenQrScanActiveRef.current = true;
    }

    prevQrScanRequestRef.current = activeQrCodeScanRequest;

    // Detect cancellation/failure scenarios:
    // 1. QR scan cancellation: QR scan was active, then cleared, and no activeQuote
    //    (handles popup-initiated cancellations where activeQuote gets cleared)
    const qrScanWasCancelled =
      prevQrScanRequest !== null &&
      activeQrCodeScanRequest === null &&
      requestId &&
      !activeQuote;

    // 2. Fullscreen-initiated failure: QR scan was active then cleared, but activeQuote
    //    doesn't get cleared in fullscreen mode (fallback when error handler doesn't fire)
    const qrScanWasActiveThenCleared =
      hasSeenQrScanActiveRef.current && activeQrCodeScanRequest === null;
    const fullscreenInitiatedFailure =
      requestIdFromLocation !== undefined &&
      hasSeenRequestIdRef.current &&
      !hasSubmittedBridgeTx &&
      qrScanWasActiveThenCleared &&
      !isBetweenApprovalAndBridgeSteps;

    // 3. Popup-initiated failure: Transaction was initiated (we saw activeQuote) but now cleared
    //    (activeQuote gets cleared in popup mode when transaction fails)
    //    Only trigger if we've actually seen the transaction start (activeQuote was present)
    const transactionFailed =
      hasSeenActiveQuoteRef.current &&
      requestId &&
      !activeQuote &&
      !historyItem &&
      !activeQrCodeScanRequest;

    // Navigate on any failure/cancellation scenario
    if (qrScanWasCancelled || fullscreenInitiatedFailure || transactionFailed) {
      navigateToActivity();
    }
  }, [
    hasSubmittedBridgeTx,
    activeQrCodeScanRequest,
    requestId,
    requestIdFromLocation,
    activeQuote,
    historyItem,
    isBetweenApprovalAndBridgeSteps,
    navigateToActivity,
    location.pathname,
  ]);
}
