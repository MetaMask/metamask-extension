import { useCallback, useEffect, useRef } from 'react';

import { ErrorCode } from '@metamask/hw-wallet-sdk';
import {
  ConnectionStatus,
  getHardwareWalletErrorCode,
  isInE2eTest,
  isUserRejectedHardwareWalletError,
  useHardwareWalletState,
} from '../../contexts/hardware-wallets';
import {
  HardwareWalletSignatureEvent,
  HardwareWalletSignatureStatus,
} from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import type { HardwareWalletSignaturesState } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';

type UseHardwareWalletConnectionMonitoringOptions = {
  signatureState: HardwareWalletSignaturesState;
  dispatchSignatureEvent: React.Dispatch<HardwareWalletConnectionAction>;
};

type HardwareWalletConnectionAction =
  | { type: typeof HardwareWalletSignatureEvent.TransactionRejected }
  | { type: typeof HardwareWalletSignatureEvent.TransactionFailed }
  | { type: typeof HardwareWalletSignatureEvent.DeviceDisconnected };

/**
 * Monitors the hardware wallet connection during a swap/bridge signature flow.
 *
 * Watches the hardware wallet connection state and, while the signature state
 * machine is awaiting a signature, reacts to disconnections and errors by
 * dispatching the appropriate event (`DeviceDisconnected`,
 * `TransactionRejected`, or `TransactionFailed`). Each error is handled only
 * once to avoid duplicate dispatches.
 *
 * @param options - Configuration for the connection monitoring hook.
 * @param options.signatureState - The current hardware-wallet signature state-machine state.
 * @param options.dispatchSignatureEvent - Dispatcher for signature state-machine events.
 * @returns An object containing:
 * - `isDeviceDisconnectedRef` — a ref indicating whether the device is currently disconnected.
 * - `resetConnectionError` — a callback to reset the handled-error tracking, optionally preserving a specific error.
 */
export function useHwSwapConnectionMonitoring({
  signatureState,
  dispatchSignatureEvent,
}: UseHardwareWalletConnectionMonitoringOptions) {
  const { connectionState } = useHardwareWalletState();
  const inE2e = isInE2eTest();
  const handledConnectionErrorRef = useRef<unknown>(null);
  const isDeviceDisconnectedRef = useRef(false);

  useEffect(() => {
    // E2E has no physical device, so the connection always looks disconnected.
    // Treating that as a signing failure would strand the signing page in a
    // terminal state instead of following the transaction to Submitted.
    if (inE2e) {
      return;
    }

    if (
      signatureState.status !==
        HardwareWalletSignatureStatus.AwaitingFirstSignature &&
      signatureState.status !==
        HardwareWalletSignatureStatus.AwaitingFinalSignature
    ) {
      return;
    }

    if (connectionState.status === ConnectionStatus.Disconnected) {
      if (handledConnectionErrorRef.current === 'disconnected') {
        return;
      }
      handledConnectionErrorRef.current = 'disconnected';
      isDeviceDisconnectedRef.current = true;
      dispatchSignatureEvent({
        type: HardwareWalletSignatureEvent.DeviceDisconnected,
      });
      return;
    }

    if (connectionState.status !== ConnectionStatus.ErrorState) {
      handledConnectionErrorRef.current = null;
      return;
    }

    if (handledConnectionErrorRef.current === connectionState.error) {
      return;
    }

    handledConnectionErrorRef.current = connectionState.error;

    const errorCode = getHardwareWalletErrorCode(connectionState.error);

    if (
      errorCode === ErrorCode.ConnectionClosed ||
      errorCode === ErrorCode.DeviceDisconnected
    ) {
      isDeviceDisconnectedRef.current = true;
      dispatchSignatureEvent({
        type: HardwareWalletSignatureEvent.DeviceDisconnected,
      });
      return;
    }

    dispatchSignatureEvent({
      type: isUserRejectedHardwareWalletError(connectionState.error)
        ? HardwareWalletSignatureEvent.TransactionRejected
        : HardwareWalletSignatureEvent.TransactionFailed,
    });
  }, [connectionState, inE2e, signatureState.status, dispatchSignatureEvent]);

  const resetConnectionError = useCallback((preserveError?: unknown) => {
    handledConnectionErrorRef.current = preserveError ?? null;
    isDeviceDisconnectedRef.current = false;
  }, []);

  return {
    isDeviceDisconnectedRef,
    resetConnectionError,
  };
}
