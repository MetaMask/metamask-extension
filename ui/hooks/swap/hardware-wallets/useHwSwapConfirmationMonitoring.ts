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
