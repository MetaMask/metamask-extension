import { useEffect, useRef } from 'react';
import type {
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

function driveToStatus(
  target: HardwareWalletSignatureStatus,
  current: HardwareWalletSignatureStatus,
  needsTwoConfirmations: boolean,
  dispatch: Dispatch,
): void {
  if (target === current) {
    return;
  }

  const reset = (): void =>
    dispatch({
      type: HardwareWalletSignatureEvent.Reset,
      needsTwoConfirmations,
    });

  if (target === HardwareWalletSignatureStatus.AwaitingFirstSignature) {
    reset();
    return;
  }

  if (target === HardwareWalletSignatureStatus.AwaitingFinalSignature) {
    if (
      current === HardwareWalletSignatureStatus.AwaitingFirstSignature &&
      needsTwoConfirmations
    ) {
      dispatch({ type: HardwareWalletSignatureEvent.FirstSignatureSubmitted });
    } else {
      reset();
    }
    return;
  }

  if (target === HardwareWalletSignatureStatus.Submitted) {
    if (
      needsTwoConfirmations &&
      current === HardwareWalletSignatureStatus.AwaitingFirstSignature
    ) {
      dispatch({ type: HardwareWalletSignatureEvent.FirstSignatureSubmitted });
    } else if (isSigning(current)) {
      dispatch({ type: HardwareWalletSignatureEvent.TransactionSubmitted });
    } else {
      reset();
    }
    return;
  }

  if (target === HardwareWalletSignatureStatus.Rejected) {
    if (isSigning(current)) {
      dispatch({ type: HardwareWalletSignatureEvent.TransactionRejected });
    } else {
      reset();
    }
    return;
  }

  if (target === HardwareWalletSignatureStatus.Failed) {
    if (isSigning(current)) {
      dispatch({ type: HardwareWalletSignatureEvent.TransactionFailed });
    } else {
      reset();
    }
    return;
  }

  if (target === HardwareWalletSignatureStatus.Disconnected) {
    if (isSigning(current)) {
      dispatch({ type: HardwareWalletSignatureEvent.DeviceDisconnected });
    } else {
      reset();
    }
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
