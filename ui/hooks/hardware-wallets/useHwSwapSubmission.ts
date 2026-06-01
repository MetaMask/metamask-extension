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
 * @param options - Configuration for the submission hook.
 * @param options.lockedQuote - The latched quote to submit.
 * @param options.needsTwoConfirmations - Whether the transaction requires two separate hardware wallet confirmations.
 * @param options.signatureState - The current hardware-wallet signature state-machine state.
 * @param options.dispatchSignatureEvent - Dispatcher for signature state-machine events.
 * @param options.submitBridgeTransaction - Function that submits a bridge transaction given a quote and optional RPC timeout.
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
}: UseHwSwapSubmissionOptions) {
  const submitActiveQuote = useCallback(async () => {
    if (!lockedQuote) {
      return;
    }

    await submitBridgeTransaction(lockedQuote);
  }, [lockedQuote, submitBridgeTransaction]);

  const hasStartedSubmission = useRef(false);
  const quoteRequestIdRef = useRef<string | undefined>();
  const submitActiveQuoteRef = useRef(submitActiveQuote);
  submitActiveQuoteRef.current = submitActiveQuote;

  useEffect(() => {
    const requestId = lockedQuote?.quote.requestId;

    if (!requestId || quoteRequestIdRef.current === requestId) {
      return;
    }

    quoteRequestIdRef.current = requestId;
    hasStartedSubmission.current = false;
    dispatchSignatureEvent({
      type: HardwareWalletSignatureEvent.Reset,
      needsTwoConfirmations,
    });
  }, [
    lockedQuote?.quote.requestId,
    needsTwoConfirmations,
    dispatchSignatureEvent,
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

    try {
      await submitBridgeTransaction(lockedQuote, {
        rpcTimeoutMs: RETRY_RPC_TIMEOUT_MS,
      });
    } catch (error) {
      console.warn(
        '[useHwSwapSubmission] Retry submission failed:',
        error,
      );
    }
  }, [lockedQuote, submitBridgeTransaction]);

  return {
    submitActiveQuote,
    retrySubmission,
    hasStartedSubmission,
  };
}
