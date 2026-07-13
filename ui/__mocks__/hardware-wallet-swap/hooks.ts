import { useEffect, useRef } from 'react';
import type {
  HardwareWalletSignatureEventWithoutPayload,
  HardwareWalletSignaturesAction,
  HardwareWalletSignaturesState,
} from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import {
  HardwareWalletSignatureEvent,
  HardwareWalletSignatureStatus,
} from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import { hwSwapStoryState } from './story-state';

const FROM_ADDRESS = '0x1234567890123456789012345678901234567890';
const TO_ADDRESS = '0x0987654321098765432109876543210987654321';
const SPENDER_ADDRESS = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
const FROM_TOKEN = { symbol: 'ETH' };
const TO_TOKEN = { symbol: 'USDC' };

type Dispatch = (action: HardwareWalletSignaturesAction) => void;

function buildLockedQuote(needsTwoConfirmations: boolean) {
  return {
    sentAmount: { amount: '1.5' },
    trade: { from: FROM_ADDRESS, to: TO_ADDRESS },
    approval: needsTwoConfirmations ? { to: SPENDER_ADDRESS } : undefined,
    quote: {
      srcTokenAmount: '1500000000000000000',
      destTokenAmount: '3000000000',
      requestId: 'story-request-id',
    },
  };
}

function isSigning(status: HardwareWalletSignatureStatus): boolean {
  return (
    status === HardwareWalletSignatureStatus.AwaitingFirstSignature ||
    status === HardwareWalletSignatureStatus.AwaitingFinalSignature
  );
}

const SIGNING_OUTCOME_EVENTS: Partial<
  Record<HardwareWalletSignatureStatus, HardwareWalletSignatureEventWithoutPayload>
> = {
  [HardwareWalletSignatureStatus.Submitted]:
    HardwareWalletSignatureEvent.TransactionSubmitted,
  [HardwareWalletSignatureStatus.Rejected]:
    HardwareWalletSignatureEvent.TransactionRejected,
  [HardwareWalletSignatureStatus.Failed]:
    HardwareWalletSignatureEvent.TransactionFailed,
  [HardwareWalletSignatureStatus.Disconnected]:
    HardwareWalletSignatureEvent.DeviceDisconnected,
};

function driveToStatus(
  target: HardwareWalletSignatureStatus,
  current: HardwareWalletSignatureStatus,
  needsTwoConfirmations: boolean,
  dispatch: Dispatch,
): void {
  if (target === current) {
    return;
  }

  const reset = (): void => {
    dispatch({
      type: HardwareWalletSignatureEvent.Reset,
      needsTwoConfirmations,
    });
  };

  const advanceFromFirst =
    needsTwoConfirmations &&
    current === HardwareWalletSignatureStatus.AwaitingFirstSignature;

  // Two-confirmation flows step through FirstSignatureSubmitted before a later
  // effect drives to the final target (AwaitingFinalSignature or Submitted).
  if (
    target === HardwareWalletSignatureStatus.AwaitingFinalSignature ||
    (target === HardwareWalletSignatureStatus.Submitted && advanceFromFirst)
  ) {
    if (advanceFromFirst) {
      dispatch({ type: HardwareWalletSignatureEvent.FirstSignatureSubmitted });
    } else {
      reset();
    }
    return;
  }

  if (target === HardwareWalletSignatureStatus.AwaitingFirstSignature) {
    reset();
    return;
  }

  const outcomeEvent = SIGNING_OUTCOME_EVENTS[target];
  if (!outcomeEvent) {
    return;
  }

  if (isSigning(current)) {
    dispatch({ type: outcomeEvent });
  } else {
    reset();
  }
}

export function useHwSwapQuoteData() {
  const { needsTwoConfirmations, hardwareWalletType } =
    hwSwapStoryState.current;
  const ref = useRef<{
    needsTwoConf: boolean;
    quote: ReturnType<typeof buildLockedQuote>;
  }>({
    needsTwoConf: needsTwoConfirmations,
    quote: buildLockedQuote(needsTwoConfirmations),
  });

  if (ref.current.needsTwoConf !== needsTwoConfirmations) {
    ref.current = {
      needsTwoConf: needsTwoConfirmations,
      quote: buildLockedQuote(needsTwoConfirmations),
    };
  }

  const lockedQuote = ref.current.quote;
  return {
    activeQuote: lockedQuote,
    lockedQuote,
    fromToken: FROM_TOKEN,
    toToken: TO_TOKEN,
    hardwareWalletType,
  };
}

export function useHwSwapSubmission({
  signatureState,
  dispatchSignatureEvent,
  needsTwoConfirmations,
}: {
  signatureState: HardwareWalletSignaturesState;
  dispatchSignatureEvent: Dispatch;
  needsTwoConfirmations: boolean;
}) {
  const hasStartedSubmission = useRef(true);
  const target = hwSwapStoryState.current.status;

  useEffect(() => {
    driveToStatus(
      target,
      signatureState.status,
      needsTwoConfirmations,
      dispatchSignatureEvent,
    );
  }, [
    target,
    signatureState.status,
    needsTwoConfirmations,
    dispatchSignatureEvent,
  ]);

  return {
    submitActiveQuote: async () => undefined,
    retrySubmission: async () => undefined,
    hasStartedSubmission,
  };
}

function useSubmitBridgeTransaction() {
  return {
    submitBridgeTransaction: async () => undefined,
  };
}

export default useSubmitBridgeTransaction;

export function useHwSwapConnectionMonitoring() {
  return {
    isDeviceDisconnectedRef: { current: false },
    resetConnectionError: () => undefined,
  };
}

export function useHwSwapConfirmationMonitoring() {
  return { confirmationTxData: null };
}

export function useHwSwapQrState({
  signatureState,
}: {
  signatureState: HardwareWalletSignaturesState;
}) {
  const { showInlineQrSigning, isReadingQrSignature } =
    hwSwapStoryState.current;
  const awaiting = isSigning(signatureState.status);
  return {
    isReadingQrSignature,
    setIsReadingQrSignature: () => undefined,
    qrSignRequest: null,
    showInlineQrSigning,
    activeQrStep:
      showInlineQrSigning && awaiting ? signatureState.status : null,
    handleQrScanSuccess: () => undefined,
    handleQrSignatureCancel: () => undefined,
  };
}

export function useHwSwapNavigation() {
  // Intentionally a no-op so the Submitted story stays mounted.
}

export function useHwSignTracker() {
  return {
    cancelCurrentBatch: async () => undefined,
  };
}

export function useBridgeNavigation() {
  return {
    navigateToBridgePage: () => undefined,
  };
}
