import { useCallback } from 'react';
import {
  Category,
  ErrorCode,
  HardwareWalletError,
  Severity,
} from '@metamask/hw-wallet-sdk';
import {
  DeviceEvent,
  ConnectionStatus,
  type DeviceEventPayload,
  type HardwareWalletConnectionState,
  HardwareWalletType,
} from './types';
import { ConnectionState } from './connectionState';
import { type HardwareWalletRefs } from './HardwareWalletStateManager';

/**
 * Props required by device event handlers
 */
export type DeviceEventHandlerProps = {
  refs: HardwareWalletRefs;
  setters: {
    setConnectionState: (
      state:
        | HardwareWalletConnectionState
        | ((
            prev: HardwareWalletConnectionState,
          ) => HardwareWalletConnectionState),
    ) => void;
    cleanupAdapter: () => void;
    abortAndCleanupController: () => void;
    resetConnectionRefs: () => void;
  };
  onDeviceEvent?: (payload: DeviceEventPayload) => void;
};

/**
 * Determines if the given app name is correct for the wallet type
 *
 * @param appName - The current app name
 * @param walletType - The hardware wallet type
 * @returns true if the app is correct, false otherwise
 */
const isCorrectAppForWallet = (
  appName: string,
  walletType: HardwareWalletType | null,
): boolean => {
  if (!walletType) {
    return false;
  }

  // For Ledger devices, the correct app is "Ethereum"
  if (walletType === HardwareWalletType.Ledger) {
    return appName.toLowerCase() === 'ethereum';
  }

  // For other wallet types (Trezor, QR-based), app validation is handled differently
  // or may not require specific app validation
  return true;
};

/**
 * Hook that provides device event handling functions
 *
 * @param options0
 * @param options0.refs
 * @param options0.setters
 * @param options0.onDeviceEvent
 */
export const useDeviceEventHandlers = ({
  refs,
  setters,
  onDeviceEvent,
}: Omit<DeviceEventHandlerProps, 'state'>) => {
  const updateConnectionState = useCallback(
    (newState: HardwareWalletConnectionState) => {
      setters.setConnectionState((oldState) => {
        if (oldState.status !== newState.status) {
          return newState;
        }

        if (
          newState.status === ConnectionStatus.ErrorState &&
          oldState.status === ConnectionStatus.ErrorState
        ) {
          if (
            oldState.reason !== newState.reason ||
            oldState.error?.message !== newState.error?.message
          ) {
            return newState;
          }
        }

        if (
          newState.status === ConnectionStatus.AwaitingApp &&
          oldState.status === ConnectionStatus.AwaitingApp
        ) {
          if (
            oldState.reason !== newState.reason ||
            oldState.appName !== newState.appName
          ) {
            return newState;
          }
        }

        // Nothing changed, keep using the same ref
        return oldState;
      });
    },
    [setters],
  );

  const handleDeviceEvent = useCallback(
    (payload: DeviceEventPayload) => {
      const { abortControllerRef } = refs;

      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      switch (payload.event) {
        case DeviceEvent.Disconnected:
          updateConnectionState(ConnectionState.disconnected());
          break;

        case DeviceEvent.DeviceLocked:
          if (payload.error) {
            updateConnectionState(
              ConnectionState.error(DeviceEvent.DeviceLocked, payload.error),
            );
          } else {
            updateConnectionState(
              ConnectionState.error(
                DeviceEvent.DeviceLocked,
                new HardwareWalletError('Device is locked', {
                  code: ErrorCode.AuthenticationDeviceLocked,
                  severity: Severity.Err,
                  category: Category.Authentication,
                  userMessage: 'Device is locked',
                }),
              ),
            );
          }
          break;

        case DeviceEvent.AppNotOpen:
          // When called during ensureDeviceReady, this is an error condition
          // that should show a modal to the user
          if (payload.error) {
            updateConnectionState(
              ConnectionState.error(DeviceEvent.AppNotOpen, payload.error),
            );
          } else {
            updateConnectionState(
              ConnectionState.awaitingApp(DeviceEvent.AppNotOpen),
            );
          }
          break;

        case DeviceEvent.AppChanged: {
          // BOLOS is the Ledger OS dashboard - means no app is open
          const currentAppName = payload.currentAppName ?? 'BOLOS';
          // Check if the app is correct for this wallet type
          if (
            isCorrectAppForWallet(currentAppName, refs.walletTypeRef.current)
          ) {
            // If correct app, clear any awaiting state since device is ready
            updateConnectionState(ConnectionState.ready());
            break;
          }
          // If wrong app, set awaiting state with wrong_app reason
          updateConnectionState(
            ConnectionState.awaitingApp(DeviceEvent.AppNotOpen, currentAppName),
          );
          break;
        }

        case DeviceEvent.ConnectionFailed:
          if (payload.error) {
            updateConnectionState(
              ConnectionState.error(
                DeviceEvent.ConnectionFailed,
                payload.error,
              ),
            );
          } else {
            updateConnectionState(
              ConnectionState.error(
                DeviceEvent.ConnectionFailed,
                new HardwareWalletError('Hardware wallet connection failed', {
                  code: ErrorCode.ConnectionTransportMissing,
                  severity: Severity.Err,
                  category: Category.Connection,
                  userMessage: 'Hardware wallet connection failed',
                }),
              ),
            );
          }
          break;

        case DeviceEvent.OperationTimeout:
          updateConnectionState(
            ConnectionState.error(
              DeviceEvent.OperationTimeout,
              payload.error ??
                new HardwareWalletError('Operation timed out', {
                  code: ErrorCode.ConnectionTimeout,
                  severity: Severity.Err,
                  category: Category.Protocol,
                  userMessage: 'Operation timed out',
                }),
            ),
          );
          break;

        default:
          break;
      }

      // Forward event to adapter if callback provided
      onDeviceEvent?.(payload);
    },
    // Adding ignore to exclude refs.
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateConnectionState, onDeviceEvent],
  );

  const handleDisconnect = useCallback(
    (disconnectError?: unknown) => {
      const { abortControllerRef } = refs;

      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // Abort any ongoing operations and cleanup all refs
      setters.abortAndCleanupController();
      setters.cleanupAdapter();
      setters.resetConnectionRefs();

      if (disconnectError instanceof HardwareWalletError) {
        // Handle structured hardware wallet errors
        updateConnectionState({
          status: ConnectionStatus.ErrorState,
          reason: disconnectError.message,
          error: disconnectError,
        });
      } else {
        // Error provider will handle all the other error cases
        updateConnectionState(ConnectionState.disconnected());
      }
    },
    // Adding ignore to exclude refs.
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setters, updateConnectionState],
  );

  return {
    updateConnectionState,
    handleDeviceEvent,
    handleDisconnect,
  };
};
