import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, shallowEqual } from 'react-redux';

import { getActiveQrCodeScanRequest } from '../../../selectors/selectors';
import { getBridgeQuotes } from '../../../ducks/bridge/selectors';
import { selectBridgeHistoryForAccountGroup } from '../../../ducks/bridge-status/selectors';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';

/**
 * Hook to handle navigation logic for bridge transaction awaiting signatures page.
 * Encapsulates refs, detection logic, and navigation for transaction success, cancellation, and failure.
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
  // Use status.srcChain.txHash to detect submission, as approvalTxId can remain
  // present even after the bridge transaction is submitted/completed
  const hasSubmittedBridgeTx = useMemo(() => {
    if (!historyItem) {
      return false;
    }

    // status.srcChain.txHash indicates the bridge transaction has been submitted
    return Boolean(historyItem.status?.srcChain?.txHash);
  }, [historyItem]);

  // Check if we're between approval and bridge steps in a two-step flow
  // This is true when approvalTxId exists but bridge tx hasn't been submitted yet
  const isBetweenApprovalAndBridgeSteps = useMemo(() => {
    return historyItem?.approvalTxId !== undefined && !hasSubmittedBridgeTx;
  }, [historyItem, hasSubmittedBridgeTx]);

  // Track state transitions and detect navigation scenarios
  useEffect(() => {
    // Track if we've seen a requestId (indicates transaction was initiated)
    if (requestId) {
      hasSeenRequestIdRef.current = true;
    }

    // Track if we've seen activeQuote (indicates transaction was actually started)
    if (activeQuote !== null && activeQuote !== undefined) {
      hasSeenActiveQuoteRef.current = true;
    }

    // Mark QR scan as seen when it becomes active (truthy object)
    // Exclude null, undefined, and false to ensure we only mark actual active scans
    if (
      activeQrCodeScanRequest !== null &&
      activeQrCodeScanRequest !== undefined &&
      activeQrCodeScanRequest !== false
    ) {
      hasSeenQrScanActiveRef.current = true;
    }

    prevQrScanRequestRef.current = activeQrCodeScanRequest;
  }, [requestId, activeQuote, activeQrCodeScanRequest]);

  // Helper to check if QR scan request is cleared (null or undefined)
  const isQrScanCleared = (value: typeof activeQrCodeScanRequest): boolean => {
    return value === null || value === undefined;
  };

  // Helper to check if QR scan request was previously active (not null, undefined, or false)
  const wasQrScanActive = (value: typeof activeQrCodeScanRequest): boolean => {
    return value !== null && value !== undefined && value !== false;
  };

  // Detect cancellation/failure scenarios:
  // 1. QR scan cancellation: QR scan was active, then cleared (null or undefined), and no activeQuote
  //    (handles popup-initiated cancellations where activeQuote gets cleared)
  const qrScanWasCancelled = Boolean(
    wasQrScanActive(prevQrScanRequestRef.current) &&
      isQrScanCleared(activeQrCodeScanRequest) &&
      requestId &&
      !activeQuote,
  );

  // 2. Fullscreen-initiated failure: QR scan was active then cleared (null or undefined), but activeQuote
  //    doesn't get cleared in fullscreen mode (fallback when error handler doesn't fire)
  //    Note: We detect this even when between approval and bridge steps, as it indicates
  //    the user cancelled the bridge transaction QR scan (not the approval)
  const qrScanWasActiveThenCleared =
    hasSeenQrScanActiveRef.current && isQrScanCleared(activeQrCodeScanRequest);
  const fullscreenInitiatedFailure = Boolean(
    requestIdFromLocation !== undefined &&
      hasSeenRequestIdRef.current &&
      !hasSubmittedBridgeTx &&
      qrScanWasActiveThenCleared,
  );

  // 3. Popup-initiated failure: Transaction was initiated (we saw activeQuote) but now cleared
  //    (activeQuote gets cleared in popup mode when transaction fails)
  //    Only trigger if we've actually seen the transaction start (activeQuote was present)
  const transactionFailed = Boolean(
    hasSeenActiveQuoteRef.current &&
      requestId &&
      !activeQuote &&
      !historyItem &&
      isQrScanCleared(activeQrCodeScanRequest),
  );

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

    // Navigate on any failure/cancellation scenario
    // Even if we're between approval and bridge steps, we should navigate on cancellation
    if (qrScanWasCancelled || fullscreenInitiatedFailure || transactionFailed) {
      navigateToActivity();
      return;
    }

    // Don't navigate if we're between approval and bridge steps in two-step flow
    // (but only if we haven't detected a cancellation above)
    if (isBetweenApprovalAndBridgeSteps) {
      // Wait for bridge transaction to be submitted
    }
  }, [
    hasSubmittedBridgeTx,
    qrScanWasCancelled,
    fullscreenInitiatedFailure,
    transactionFailed,
    isBetweenApprovalAndBridgeSteps,
    navigateToActivity,
  ]);
}
