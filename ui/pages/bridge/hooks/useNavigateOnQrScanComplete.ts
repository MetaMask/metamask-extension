import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { QrScanRequestType } from '@metamask/eth-qr-keyring';

import { getExtensionSkipTransactionStatusPage } from '../../../../shared/lib/selectors/smart-transactions';
import {
  getActiveQrCodeScanRequest,
  getLastQrScanCompletedSuccessfully,
} from '../../../selectors/selectors';
import { setWasTxDeclined } from '../../../ducks/bridge/actions';
import { useBridgeNavigation } from '../../../hooks/bridge/useBridgeNavigation';

/**
 * Navigates to the activity tab when a QR hardware wallet SIGN request completes
 * successfully. Mounted globally so navigation works in sidebar, popup, and
 * fullscreen contexts (e.g. when the camera step opens a fullscreen tab).
 *
 * Only navigates when activeQrCodeScanRequest goes from a SIGN request to null
 * AND the scan completed successfully (not cancelled/rejected). PAIR requests
 * (wallet import) are ignored.
 *
 * On SIGN rejection/cancel, sets `wasTxDeclined` and returns to the bridge
 * prepare page. This state-driven path covers QR cancellations that do not
 * propagate through `useSubmitBridgeTransaction` (e.g. before submit resolves).
 *
 * For USB wallets (Ledger): navigation is handled by useSubmitBridgeTransaction
 * after transaction submission.
 */
export function useNavigateOnQrScanComplete(): void {
  const dispatch = useDispatch();
  const {
    navigateToActivityPage,
    navigateToBridgePage,
    navigateToDefaultRoute,
  } = useBridgeNavigation();
  const activeQrCodeScanRequest = useSelector(getActiveQrCodeScanRequest);
  const lastQrScanCompletedSuccessfully = useSelector(
    getLastQrScanCompletedSuccessfully,
  );
  const toastEnabled = useSelector(getExtensionSkipTransactionStatusPage);
  const prevQrScanRequestRef = useRef(activeQrCodeScanRequest);

  useEffect(() => {
    // Track previous value to detect when QR scan completes (active → cleared)
    const previousQrScanRequest = prevQrScanRequestRef.current;
    const wasSignRequestActive =
      previousQrScanRequest?.type === QrScanRequestType.SIGN;
    const isQrScanCleared = !activeQrCodeScanRequest;

    // Always update ref before any early branching so the next effect run
    // sees the current value (prevents duplicate navigation if the effect
    // re-runs after a successful navigate but before unmount).
    prevQrScanRequestRef.current = activeQrCodeScanRequest;

    // Navigate only when a transaction SIGN request completed successfully
    // (not on cancel/reject, and not for PAIR / wallet-import flows).
    if (
      wasSignRequestActive &&
      isQrScanCleared &&
      lastQrScanCompletedSuccessfully === true
    ) {
      if (toastEnabled) {
        navigateToDefaultRoute().catch(() => undefined);
      } else {
        navigateToActivityPage();
      }
      return;
    }

    if (
      wasSignRequestActive &&
      isQrScanCleared &&
      lastQrScanCompletedSuccessfully === false
    ) {
      dispatch(setWasTxDeclined(true));
      navigateToBridgePage();
    }
  }, [
    activeQrCodeScanRequest,
    dispatch,
    lastQrScanCompletedSuccessfully,
    navigateToActivityPage,
    navigateToBridgePage,
    navigateToDefaultRoute,
    toastEnabled,
  ]);
}
