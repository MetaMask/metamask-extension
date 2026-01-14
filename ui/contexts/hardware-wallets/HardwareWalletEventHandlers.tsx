import { useCallback } from 'react';
import { type HardwareWalletError } from '@metamask/hw-wallet-sdk';
import {
  DeviceEvent,
  ConnectionStatus,
  type DeviceEventPayload,
  type HardwareWalletConnectionState,
} from './types';
import { ConnectionState } from './connectionState';
import { type HardwareWalletRefs } from './HardwareWalletStateManager';
import { getConnectionStateFromError } from './errors';

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
  };
  onDeviceEvent?: (payload: DeviceEventPayload) => void;
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
      if (refs.abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.log('[HardwareWalletEventHandlers] Device event:', payload.event);

      switch (payload.event) {
        case DeviceEvent.Disconnected:
          if (!refs.isConnectingRef.current) {
            updateConnectionState(ConnectionState.disconnected());
          }
          break;

        case DeviceEvent.DeviceLocked:
          updateConnectionState(
            ConnectionState.error('locked', payload.error as Error),
          );
          break;

        case DeviceEvent.AppNotOpen:
          // When called during ensureDeviceReady, this is an error condition
          // that should show a modal to the user
          if (payload.error) {
            updateConnectionState(
              ConnectionState.error('app_not_open', payload.error),
            );
          } else {
            updateConnectionState(ConnectionState.awaitingApp('not_open'));
          }
          break;

        case DeviceEvent.ConnectionFailed:
          if (payload.error) {
            updateConnectionState(
              ConnectionState.error('connection_failed', payload.error),
            );
          }
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
      if (refs.abortControllerRef.current?.signal.aborted) {
        return;
      }

      if (refs.isConnectingRef.current) {
        return;
      }

      refs.adapterRef.current = null;
      refs.isConnectingRef.current = false;
      refs.currentConnectionIdRef.current = null;

      if (
        disconnectError &&
        typeof disconnectError === 'object' &&
        'code' in disconnectError
      ) {
        // Handle structured hardware wallet errors
        updateConnectionState(
          getConnectionStateFromError(
            disconnectError as unknown as HardwareWalletError,
          ),
        );
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
