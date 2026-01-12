import { useCallback } from 'react';
import {
  DeviceEvent,
  ConnectionStatus,
  type DeviceEventPayload,
  type HardwareWalletConnectionState,
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

        case DeviceEvent.AppChanged:
          setters.setCurrentAppName(payload.currentAppName || null);
          if (payload.currentAppName) {
            updateConnectionState(
              ConnectionState.awaitingApp('wrong_app', payload.currentAppName),
            );
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

      // Clean up existing adapter resources before nullifying reference
      const adapter = refs.adapterRef.current;
      if (adapter) {
        adapter.destroy();
        refs.adapterRef.current = null;
      }

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

// TODO: Import these from the errors module when PR 2 is complete
// For now, these are placeholder functions that will be replaced
type HardwareWalletError = {
  code: string;
};

function getConnectionStateFromError(
  _error: HardwareWalletError,
): HardwareWalletConnectionState {
  // Placeholder implementation - will be replaced when errors module is available
  return ConnectionState.error('unknown_error', new Error('Unknown error'));
}
