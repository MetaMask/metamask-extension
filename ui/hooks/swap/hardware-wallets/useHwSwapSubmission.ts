import { useCallback, useRef, useEffect } from 'react';

import type { QuoteResponse, QuoteMetadata } from '@metamask/bridge-controller';
import { HardwareWalletSignatureEvent } from '../../../pages/bridge/hardware-wallet-signatures/hardware-wallet-signatures-state-machine';
import type { HardwareWalletSignaturesState } from '../../../pages/bridge/hardware-wallet-signatures/hardware-wallet-signatures-state-machine';

const RETRY_RPC_TIMEOUT_MS = 120_000;

type LockedQuote = (QuoteResponse & QuoteMetadata) | null | undefined;

type UseHwSwapSubmissionOptions = {
  lockedQuote: LockedQuote;
  needsTwoConfirmations: boolean;
  signatureState: HardwareWalletSignaturesState;
  dispatchSignatureEvent: React.Dispatch<HardwareWalletSignatureAction>;
  submitBridgeTransaction: (
    quote: QuoteResponse & QuoteMetadata,
    options?: { rpcTimeoutMs?: number },
  ) => Promise<void>;
};

type HardwareWalletSignatureAction = {
  type: HardwareWalletSignatureEvent.Reset;
  needsTwoConfirmations: boolean;
};

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

    console.log(
      '[HW-Batch] useHwSwapSubmission reset effect',
      JSON.stringify({
        requestId: requestId ?? null,
        prevRequestId: quoteRequestIdRef.current ?? null,
        hasStartedSubmission: hasStartedSubmission.current,
        needsTwoConfirmations,
      }),
    );

    if (!requestId || quoteRequestIdRef.current === requestId) {
      return;
    }

    quoteRequestIdRef.current = requestId;
    hasStartedSubmission.current = false;
    console.log(
      '[HW-Batch] useHwSwapSubmission dispatching Reset',
      JSON.stringify({ needsTwoConfirmations }),
    );
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
    console.log(
      '[HW-Batch] useHwSwapSubmission auto-submit effect',
      JSON.stringify({
        hasStartedSubmission: hasStartedSubmission.current,
        hasLockedQuote: Boolean(lockedQuote),
      }),
    );

    if (hasStartedSubmission.current || !lockedQuote) {
      return;
    }

    hasStartedSubmission.current = true;
    console.log('[HW-Batch] useHwSwapSubmission calling submitActiveQuote');
    submitActiveQuoteRef
      .current()
      .then(() => {
        console.log(
          '[HW-Batch] useHwSwapSubmission submitActiveQuote resolved',
        );
      })
      .catch((err) => {
        console.log(
          '[HW-Batch] useHwSwapSubmission submitActiveQuote rejected',
          err,
        );
        hasStartedSubmission.current = false;
      });
  }, [lockedQuote]);

  const retrySubmission = useCallback(async () => {
    hasStartedSubmission.current = true;
    if (!lockedQuote) {
      console.log('[HW-Batch] retrySubmission: no lockedQuote, returning');
      return;
    }
    console.log('[HW-Batch] retrySubmission: calling submitBridgeTransaction');
    try {
      await submitBridgeTransaction(lockedQuote, {
        rpcTimeoutMs: RETRY_RPC_TIMEOUT_MS,
      });
      console.log(
        '[HW-Batch] retrySubmission: submitBridgeTransaction resolved',
      );
    } catch (err) {
      console.log(
        '[HW-Batch] retrySubmission: submitBridgeTransaction threw',
        err,
      );
    }
  }, [lockedQuote, submitBridgeTransaction]);

  return {
    submitActiveQuote,
    retrySubmission,
    hasStartedSubmission,
  };
}
