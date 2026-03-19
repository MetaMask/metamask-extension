import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import {
  getActiveQrCodeScanRequest,
  getLastQrScanCompletedSuccessfully,
} from '../../../selectors/selectors';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';

/**
 * Navigates away from awaiting signatures page when QR scan completes successfully.
 * Only navigates when activeQrCodeScanRequest goes from truthy to null AND the scan
 * completed successfully (not cancelled/rejected). Rejection is handled by
 * useSubmitBridgeTransaction, which navigates back to the prepare page.
 * For USB wallets (Ledger): navigation is handled by useSubmitBridgeTransaction after transaction submission.
 */
export function useNavigateOnQrScanComplete(): void {
  const navigate = useNavigate();
  const activeQrCodeScanRequest = useSelector(getActiveQrCodeScanRequest);
  const lastQrScanCompletedSuccessfully = useSelector(
    getLastQrScanCompletedSuccessfully,
  );
  const prevQrScanRequestRef = useRef(activeQrCodeScanRequest);

  useEffect(() => {
    // Track previous value to detect when QR scan completes (active → cleared)
    const wasQrScanActive = Boolean(prevQrScanRequestRef.current);
    const isQrScanCleared = !activeQrCodeScanRequest;

    // Navigate only when QR scan completed successfully (not on cancel/reject)
    if (
      wasQrScanActive &&
      isQrScanCleared &&
      lastQrScanCompletedSuccessfully === true
    ) {
      navigate(`${DEFAULT_ROUTE}?tab=activity`, {
        replace: true,
        state: { stayOnHomePage: true },
      });
    }

    prevQrScanRequestRef.current = activeQrCodeScanRequest;
  }, [
    activeQrCodeScanRequest,
    lastQrScanCompletedSuccessfully,
    navigate,
  ]);
}
