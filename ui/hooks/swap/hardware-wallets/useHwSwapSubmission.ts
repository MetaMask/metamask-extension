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
    options?: { skipDeviceReady?: boolean; rpcTimeoutMs?: number },
  ) => Promise<void>;
};

type HardwareWalletSignatureAction = {
  type: HardwareWalletSignatureEvent.Reset;
  needsTwoConfirmations: boolean;
};

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
    submitActiveQuote().catch(() => {
      hasStartedSubmission.current = false;
    });
  }, [lockedQuote, submitActiveQuote]);

  const retrySubmission = useCallback(async () => {
    hasStartedSubmission.current = true;
    if (!lockedQuote) {
      console.log('[HW-Batch] retrySubmission: no lockedQuote, returning');
      return;
    }
    console.log(
      '[HW-Batch] retrySubmission: calling submitBridgeTransaction with skipDeviceReady + timeout',
    );
    try {
      await submitBridgeTransaction(lockedQuote, {
        skipDeviceReady: true,
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
