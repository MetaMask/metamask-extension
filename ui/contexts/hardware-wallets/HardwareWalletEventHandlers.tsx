import { useCallback } from 'react';
import { HardwareWalletError } from '@metamask/hw-wallet-sdk';
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
    setCurrentAppName: (name: string | null) => void;
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
      setters.setConnectionState((prev) => {
        if (prev.status !== newState.status) {
          return newState;
        }

        if (
          newState.status === ConnectionStatus.ErrorState &&
          prev.status === ConnectionStatus.ErrorState
        ) {
          if (
            prev.reason !== newState.reason ||
            prev.error?.message !== newState.error?.message
          ) {
            return newState;
          }
        }

        if (
          newState.status === ConnectionStatus.AwaitingApp &&
          prev.status === ConnectionStatus.AwaitingApp
        ) {
          if (
            prev.reason !== newState.reason ||
            prev.appName !== newState.appName
          ) {
            return newState;
          }
        }

        return prev;
      });
    },
    [setters],
  );

  const handleDeviceEvent = useCallback(
    (payload: DeviceEventPayload) => {
      const { abortControllerRef, isConnectingRef } = refs;

      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      switch (payload.event) {
        case DeviceEvent.Disconnected:
          if (!isConnectingRef.current) {
            updateConnectionState(ConnectionState.disconnected());
          }
          break;

        case DeviceEvent.DeviceLocked:
          updateConnectionState(
            ConnectionState.error(
              DeviceEvent.DeviceLocked,
              payload.error as Error,
            ),
          );
          break;

        case DeviceEvent.AppNotOpen:
          // When called during ensureDeviceReady, this is an error condition
          // that should show a modal to the user
          if (payload.error) {
            updateConnectionState(
              ConnectionState.error(DeviceEvent.AppNotOpen, payload.error),
            );
          } else {
            updateConnectionState(ConnectionState.awaitingApp('not_open'));
          }
          break;

        case DeviceEvent.AppChanged:
          setters.setCurrentAppName(payload.currentAppName || null);
          if (payload.currentAppName) {
            // Check if the app is correct for this wallet type
            if (
              isCorrectAppForWallet(
                payload.currentAppName,
                refs.walletTypeRef.current,
              )
            ) {
              // If correct app, clear any awaiting state since device is ready
              updateConnectionState(ConnectionState.ready());
            } else {
              // If wrong app, set awaiting state with wrong_app reason
              updateConnectionState(
                ConnectionState.awaitingApp(
                  DeviceEvent.AppNotOpen,
                  payload.currentAppName,
                ),
              );
            }
          }
          break;

        case DeviceEvent.ConnectionFailed:
          if (payload.error) {
            updateConnectionState(
              ConnectionState.error(
                DeviceEvent.ConnectionFailed,
                payload.error || new Error('Hardware wallet connection failed'),
              ),
            );
          }
          break;

        case DeviceEvent.OperationTimeout:
          updateConnectionState(
            ConnectionState.error(
              DeviceEvent.OperationTimeout,
              payload.error || new Error('Operation timed out'),
            ),
          );
          break;

        default:
          break;
      }

      // Forward event to adapter if callback provided
      onDeviceEvent?.(payload);
    },
    [refs, updateConnectionState, setters, onDeviceEvent],
  );

  const handleDisconnect = useCallback(
    (disconnectError?: unknown) => {
      // Extract refs to local variables to satisfy React Compiler
      const {
        abortControllerRef,
        adapterRef,
        isConnectingRef,
        currentConnectionIdRef,
      } = refs;

      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      if (isConnectingRef.current) {
        return;
      }

      // Clean up existing adapter resources before nullifying reference
      const adapter = adapterRef.current;
      if (adapter) {
        adapter.destroy();
        adapterRef.current = null;
      }

      isConnectingRef.current = false;
      currentConnectionIdRef.current = null;

      if (disconnectError instanceof HardwareWalletError) {
        // Handle structured hardware wallet errors
        updateConnectionState({
          status: ConnectionStatus.ErrorState,
          reason: disconnectError.message,
          error: disconnectError,
        });
      } else {
        updateConnectionState(ConnectionState.disconnected());
      }
    },
    [refs, updateConnectionState],
  );

  return {
    updateConnectionState,
    handleDeviceEvent,
    handleDisconnect,
  };
};
