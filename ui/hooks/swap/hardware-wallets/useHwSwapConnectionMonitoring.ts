import { useCallback, useEffect, useRef } from 'react';

import { ErrorCode } from '@metamask/hw-wallet-sdk';
import {
  ConnectionStatus,
  getHardwareWalletErrorCode,
  isUserRejectedHardwareWalletError,
  useHardwareWalletState,
} from '../../../contexts/hardware-wallets';
import {
  HardwareWalletSignatureEvent,
  HardwareWalletSignatureStatus,
} from '../../../pages/bridge/hardware-wallet-signatures/hardware-wallet-signatures-state-machine';
import type { HardwareWalletSignaturesState } from '../../../pages/bridge/hardware-wallet-signatures/hardware-wallet-signatures-state-machine';

type UseHardwareWalletConnectionMonitoringOptions = {
  signatureState: HardwareWalletSignaturesState;
  dispatchSignatureEvent: React.Dispatch<HardwareWalletConnectionAction>;
};

type HardwareWalletConnectionAction =
  | { type: HardwareWalletSignatureEvent.TransactionRejected }
  | { type: HardwareWalletSignatureEvent.TransactionFailed }
  | { type: HardwareWalletSignatureEvent.DeviceDisconnected };

export function useHwSwapConnectionMonitoring({
  signatureState,
  dispatchSignatureEvent,
}: UseHardwareWalletConnectionMonitoringOptions) {
  const { connectionState } = useHardwareWalletState();
  const handledConnectionErrorRef = useRef<unknown>(null);
  const isDeviceDisconnectedRef = useRef(false);

  useEffect(() => {
    const connectionError =
      connectionState.status === ConnectionStatus.ErrorState
        ? String(connectionState.error)
        : undefined;
    console.log(
      '[HW-Batch] connectionState changed',
      JSON.stringify({
        status: connectionState.status,
        error: connectionError,
      }),
      'signatureState:',
      signatureState.status,
    );

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
      console.log(
        '[HW-Batch] device disconnected (status) → DeviceDisconnected',
      );
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
    console.log(
      '[HW-Batch] connection error',
      JSON.stringify({
        errorCode,
        errorMessage:
          connectionState.error instanceof Error
            ? connectionState.error.message
            : String(connectionState.error),
        connectionStatus: connectionState.status,
      }),
    );

    if (
      errorCode === ErrorCode.ConnectionClosed ||
      errorCode === ErrorCode.DeviceDisconnected
    ) {
      isDeviceDisconnectedRef.current = true;
      console.log(
        '[HW-Batch] device disconnected (error) → DeviceDisconnected',
      );
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
    console.log(
      '[HW-Batch] connection error result',
      isUserRejectedHardwareWalletError(connectionState.error)
        ? 'TransactionRejected'
        : 'TransactionFailed',
    );
  }, [connectionState, signatureState.status, dispatchSignatureEvent]);

  const resetConnectionError = useCallback(() => {
    handledConnectionErrorRef.current = null;
    isDeviceDisconnectedRef.current = false;
  }, []);

  return {
    isDeviceDisconnectedRef,
    resetConnectionError,
  };
}
