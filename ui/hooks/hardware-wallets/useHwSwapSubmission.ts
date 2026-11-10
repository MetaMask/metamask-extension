import { useCallback, useRef, useEffect, useState } from 'react';

import {
  useHardwareWalletActions,
  useHardwareWalletState,
} from '../../contexts/hardware-wallets';
import { HardwareWalletSignatureEvent } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import { getHardwareWalletSignatureErrorEvent } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils';
import { isInE2eTest } from '../../../shared/lib/environment';
import type { UseHwSwapSubmissionOptions } from './useHwSwapSubmission.types';

const RETRY_RPC_TIMEOUT_MS = 120_000;

/**
 * Manages automatic submission and retry logic for hardware wallet swap/bridge transactions.
 *
 * When a locked quote first appears, dispatches a `Reset` event to the
 * signature state machine and automatically submits the transaction. On
 * subsequent renders the submission is guarded by `hasStartedSubmission` to
 * prevent duplicate calls. The `retrySubmission` callback re-submits with an
 * extended RPC timeout for retry scenarios.
 *
 * A submission that dies without a signature event (e.g.
 * `DeviceStateEthAppClosed`) is re-armed only after `ensureDeviceReady()`
 * confirms the device has recovered.
 *
 * The "first signature done" signal is owned by the caller and passed in as a
 * primitive (`firstSignatureDone`) plus an `onResetFirstSignature` callback.
 * The hook invokes the callback whenever the locked quote's `requestId`
 * changes so the caller can reset its own tracking.
 *
 * @param options - Configuration for the submission hook.
 * @param options.lockedQuote - The latched quote to submit.
 * @param options.needsTwoConfirmations - Whether the transaction requires two separate hardware wallet confirmations.
 * @param options.signatureState - The current hardware-wallet signature state-machine state.
 * @param options.dispatchSignatureEvent - Dispatcher for signature state-machine events.
 * @param options.submitBridgeTransaction - Function that submits a bridge transaction given a quote and optional RPC timeout.
 * @param options.firstSignatureDone - Whether the first of two hardware-wallet confirmations has completed; when true, retry skips re-submitting the approval.
 * @param options.onResetFirstSignature - Called when the locked quote's `requestId` changes, so the caller can reset its "first signature done" tracking.
 * @returns An object containing:
 * - `submitActiveQuote` — callback to submit the current locked quote.
 * - `retrySubmission` — callback to retry submission with an extended timeout.
 * - `hasStartedSubmission` — ref tracking whether submission has begun for the current quote.
 */
export function useHwSwapSubmission({
  lockedQuote,
  needsTwoConfirmations,
  signatureState,
  dispatchSignatureEvent,
  submitBridgeTransaction,
  firstSignatureDone,
  onResetFirstSignature,
}: UseHwSwapSubmissionOptions) {
  const { connectionState } = useHardwareWalletState();
  const { ensureDeviceReady } = useHardwareWalletActions();
  const inE2e = isInE2eTest();

  const submitActiveQuote = useCallback(async () => {
    if (!lockedQuote) {
      return;
    }

    await submitBridgeTransaction(lockedQuote);
  }, [lockedQuote, submitBridgeTransaction]);

  const hasStartedSubmission = useRef(false);
  /** Last-seen locked-quote requestId; used to detect quote changes/retries. */
  const quoteRequestIdRef = useRef<string | undefined>();
  // Set when a submission fails without a signature event (e.g.
  // DeviceStateEthAppClosed); cleared by the recovery effect below once the
  // device is ready.
  const [needsResubmitOnRecovery, setNeedsResubmitOnRecovery] = useState(false);

  /**
   * Detects when the locked quote changes (a new quote, or a retry that
   * produced a new requestId) and resets per-quote submission state.
   *
   * For each new requestId it:
   * - bails out early if there is no quote or the requestId was already seen;
   * - resets `hasStartedSubmission` so the auto-submit effect fires;
   * - asks the caller to reset its "first signature done" tracking;
   * - dispatches `Reset` so stale signature state does not leak across quotes.
   *
   * The `quoteRequestIdRef` ref memoizes the last-seen requestId so this effect
   * runs exactly once per new quote.
   */
  useEffect(() => {
    const requestId = lockedQuote?.quote.requestId;

    if (!requestId || quoteRequestIdRef.current === requestId) {
      return;
    }

    quoteRequestIdRef.current = requestId;
    hasStartedSubmission.current = false;
    setNeedsResubmitOnRecovery(false);
    onResetFirstSignature?.();
    dispatchSignatureEvent({
      type: HardwareWalletSignatureEvent.Reset,
      needsTwoConfirmations,
    });
  }, [
    lockedQuote?.quote.requestId,
    needsTwoConfirmations,
    dispatchSignatureEvent,
    onResetFirstSignature,
  ]);

  useEffect(() => {
    if (hasStartedSubmission.current || !lockedQuote) {
      return;
    }

    hasStartedSubmission.current = true;
    submitActiveQuote().catch((error) => {
      // Terminal signature errors (rejected/failed/disconnected) keep the
      // flag set: `submitActiveQuote` changes identity every render, so
      // resetting would resubmit after every failure. Those retry via
      // `retrySubmission`. No-event errors (e.g. DeviceStateEthAppClosed)
      // flag a recovery instead — resetting here would resubmit while the
      // device is still closed.
      if (getHardwareWalletSignatureErrorEvent(error) === null) {
        setNeedsResubmitOnRecovery(true);
      }
    });
  }, [lockedQuote, submitActiveQuote]);

  // Re-arm auto-submit only after the device recovers (same pattern as the
  // sendBundle restart in `useHardwareWalletSignatures`). A failed readiness
  // check updates connectionState, so the effect re-runs on every connection
  // change until the device is ready.
  useEffect(() => {
    if (!needsResubmitOnRecovery) {
      return;
    }

    let cancelled = false;

    const recover = async () => {
      // E2E has no physical device; skip the readiness check.
      const isDeviceReady = inE2e || (await ensureDeviceReady());

      if (cancelled) {
        return;
      }

      if (!isDeviceReady) {
        // Not ready yet; retry on the next connection-state change.
        return;
      }

      setNeedsResubmitOnRecovery(false);
      hasStartedSubmission.current = false;
    };

    recover().catch(() => {
      // Readiness check failed; leave the flag set to retry later.
    });

    return () => {
      cancelled = true;
    };
  }, [needsResubmitOnRecovery, connectionState, ensureDeviceReady, inE2e]);

  const retrySubmission = useCallback(async () => {
    hasStartedSubmission.current = true;
    if (!lockedQuote) {
      return;
    }

    const shouldSkipApproval =
      firstSignatureDone === true && Boolean(lockedQuote.approval);

    const quoteToSubmit = shouldSkipApproval
      ? { ...lockedQuote, approval: undefined }
      : lockedQuote;

    try {
      await submitBridgeTransaction(quoteToSubmit, {
        rpcTimeoutMs: RETRY_RPC_TIMEOUT_MS,
      });
    } catch (error) {
      console.warn('[useHwSwapSubmission] Retry submission failed:', error);
    }
  }, [lockedQuote, submitBridgeTransaction, firstSignatureDone]);

  return {
    submitActiveQuote,
    retrySubmission,
    hasStartedSubmission,
  };
}
