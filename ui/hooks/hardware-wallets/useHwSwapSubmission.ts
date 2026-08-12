import { useCallback, useRef, useEffect } from 'react';

import { HardwareWalletSignatureEvent } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
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
  const submitActiveQuote = useCallback(async () => {
    if (!lockedQuote) {
      return;
    }

    await submitBridgeTransaction(lockedQuote);
  }, [lockedQuote, submitBridgeTransaction]);

  const hasStartedSubmission = useRef(false);
  /** Last-seen locked-quote requestId; used to detect quote changes/retries. */
  const quoteRequestIdRef = useRef<string | undefined>();
  const submitActiveQuoteRef = useRef(submitActiveQuote);
  submitActiveQuoteRef.current = submitActiveQuote;

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
    submitActiveQuoteRef.current().catch(() => {
      hasStartedSubmission.current = false;
    });
  }, [lockedQuote]);

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
