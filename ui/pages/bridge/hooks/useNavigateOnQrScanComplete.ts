import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import {
  getActiveQrCodeScanRequest,
  getLastQrScanCompletedSuccessfully,
} from '../../../selectors/selectors';
import {
  CROSS_CHAIN_SWAP_ROUTE,
  DEFAULT_ROUTE,
  PREPARE_SWAP_ROUTE,
} from '../../../helpers/constants/routes';
import { setWasTxDeclined } from '../../../ducks/bridge/actions';

/**
 * Navigates away from awaiting signatures page when QR scan completes successfully.
 * Only navigates when activeQrCodeScanRequest goes from truthy to null AND the scan
 * completed successfully (not cancelled/rejected). Rejection is handled by
 * useSubmitBridgeTransaction, which navigates back to the prepare page.
 * For USB wallets (Ledger): navigation is handled by useSubmitBridgeTransaction after transaction submission.
 */
export function useNavigateOnQrScanComplete(): void {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const activeQrCodeScanRequest = useSelector(getActiveQrCodeScanRequest);
  const lastQrScanCompletedSuccessfully = useSelector(
    getLastQrScanCompletedSuccessfully,
  );
  const prevQrScanRequestRef = useRef(activeQrCodeScanRequest);

  useEffect(() => {
    // Track previous value to detect when QR scan completes (active → cleared)
    const wasQrScanActive = Boolean(prevQrScanRequestRef.current);
    const isQrScanCleared = !activeQrCodeScanRequest;

    // Always update ref before any early branching so the next effect run
    // sees the current value (prevents duplicate navigation if the effect
    // re-runs after a successful navigate but before unmount).
    prevQrScanRequestRef.current = activeQrCodeScanRequest;

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
      return;
    }

    if (
      wasQrScanActive &&
      isQrScanCleared &&
      lastQrScanCompletedSuccessfully === false
    ) {
      dispatch(setWasTxDeclined(true));
      navigate(`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`, {
        replace: true,
      });
    }
  }, [
    activeQrCodeScanRequest,
    dispatch,
    lastQrScanCompletedSuccessfully,
    navigate,
  ]);
}
