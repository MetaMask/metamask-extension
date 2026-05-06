import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import {
  HardwareWalletSignatureEvent,
  HardwareWalletSignatureStatus,
} from '../../../pages/bridge/hardware-wallet-signatures/hardware-wallet-signatures-state-machine';
import type { HardwareWalletSignaturesState } from '../../../pages/bridge/hardware-wallet-signatures/hardware-wallet-signatures-state-machine';
import type { BridgeStatusState } from '../../../pages/bridge/hardware-wallet-signatures/types';

type UseHardwareWalletConfirmationMonitoringOptions = {
  hardwareWalletUsed: boolean;
  signatureState: HardwareWalletSignaturesState;
  dispatchSignatureEvent: React.Dispatch<HardwareWalletConfirmationAction>;
  retryGenerationRef?: React.RefObject<number>;
  isDeviceDisconnectedRef?: React.RefObject<boolean>;
};

type HardwareWalletConfirmationAction = {
  type: HardwareWalletSignatureEvent.TransactionRejected;
};

/**
 * Monitors hardware wallet transaction confirmations during a swap/bridge flow.
 *
 * Detects when a previously-seen confirmation transaction disappears (i.e. the
 * user rejected it on the device) while the state machine is still awaiting a
 * signature, and dispatches a `TransactionRejected` event accordingly. Also
 * tracks retry generations so that a new retry cycle resets the tracking state.
 *
 * @param options - Configuration for the monitoring hook.
 * @param options.hardwareWalletUsed - Whether a hardware wallet is being used for this swap.
 * @param options.signatureState - The current hardware-wallet signature state-machine state.
 * @param options.dispatchSignatureEvent - Dispatcher for signature state-machine events.
 * @param options.retryGenerationRef - Optional ref whose value changes when a retry is triggered; resets internal tracking.
 * @param options.isDeviceDisconnectedRef - Optional ref indicating whether the device has been disconnected.
 * @returns An object containing the current `confirmationTxData` from Redux.
 */
export function useHwSwapConfirmationMonitoring({
  hardwareWalletUsed,
  signatureState,
  dispatchSignatureEvent,
  retryGenerationRef,
  isDeviceDisconnectedRef,
}: UseHardwareWalletConfirmationMonitoringOptions) {
  const confirmationTxData = useSelector(
    (state: BridgeStatusState) => state.confirmTransaction?.txData,
  );

  const previousTxIdRef = useRef<string | undefined>();
  const lastSeenGenerationRef = useRef(retryGenerationRef?.current ?? 0);

  useEffect(() => {
    if (
      retryGenerationRef &&
      retryGenerationRef.current !== lastSeenGenerationRef.current
    ) {
      lastSeenGenerationRef.current = retryGenerationRef.current ?? 0;
      previousTxIdRef.current = undefined;
    }

    const currentId = confirmationTxData?.id;
    const previousId = previousTxIdRef.current;

    console.log(
      '[HW-Batch] useHwSwapConfirmationMonitoring effect',
      JSON.stringify({
        currentId: currentId ?? null,
        previousId: previousId ?? null,
        hardwareWalletUsed,
        signatureState: signatureState.status,
        isDeviceDisconnected: isDeviceDisconnectedRef?.current ?? false,
      }),
    );

    if (
      hardwareWalletUsed &&
      (signatureState.status ===
        HardwareWalletSignatureStatus.AwaitingFirstSignature ||
        signatureState.status ===
          HardwareWalletSignatureStatus.AwaitingFinalSignature) &&
      previousId &&
      !currentId &&
      !isDeviceDisconnectedRef?.current
    ) {
      console.log(
        '[HW-Batch] useHwSwapConfirmationMonitoring → TransactionRejected',
        JSON.stringify({
          previousId,
          currentId: currentId ?? null,
        }),
      );
      dispatchSignatureEvent({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    }

    previousTxIdRef.current = currentId;
  }, [
    hardwareWalletUsed,
    confirmationTxData?.id,
    signatureState.status,
    dispatchSignatureEvent,
    retryGenerationRef,
    isDeviceDisconnectedRef,
  ]);

  return {
    confirmationTxData,
  };
}
