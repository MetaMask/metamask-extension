import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { getActiveQrCodeScanRequest } from '../../../selectors/selectors';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';

/**
 * Navigates away from awaiting signatures page when QR scan is completed.
 * For QR wallets (Keystone): listens to activeQrCodeScanRequest becoming null (scan completed).
 * For USB wallets (Ledger): navigation is handled by useSubmitBridgeTransaction after transaction submission.
 */
export function useNavigateOnQrScanComplete(): void {
  const navigate = useNavigate();
  const activeQrCodeScanRequest = useSelector(getActiveQrCodeScanRequest);
  const prevQrScanRequestRef = useRef(activeQrCodeScanRequest);

  useEffect(() => {
    // Track previous value to detect when QR scan completes (active → cleared)
    // Use Boolean(...) so undefined / null / false are all treated as \"not active\"
    const wasQrScanActive = Boolean(prevQrScanRequestRef.current);
    const isQrScanCleared = !activeQrCodeScanRequest;

    // Navigate when QR scan completes (was active, now cleared)
    if (wasQrScanActive && isQrScanCleared) {
      navigate(`${DEFAULT_ROUTE}?tab=activity`, {
        replace: true,
        state: { stayOnHomePage: true },
      });
    }

    // Update ref for next render
    prevQrScanRequestRef.current = activeQrCodeScanRequest;
  }, [activeQrCodeScanRequest, navigate]);
}
