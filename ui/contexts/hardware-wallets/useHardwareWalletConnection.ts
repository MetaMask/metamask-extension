import { useCallback, useEffect } from 'react';
import { ErrorCode, type HardwareWalletError } from '@metamask/hw-wallet-sdk';
import {
  getConnectionStateFromError,
  createHardwareWalletError,
} from './errors';
import { ConnectionState } from './connectionState';
import { createAdapterForHardwareWalletType } from './adapters/factory';
import {
  HardwareWalletType,
  type HardwareWalletConnectionState,
  type HardwareWalletAdapterOptions,
  type DeviceEventPayload,
} from './types';
import {
  getHardwareWalletDeviceId,
  requestHardwareWalletPermission,
} from './webConnectionUtils';
import { type HardwareWalletRefs } from './HardwareWalletStateManager';

type IsLatestAttempt = () => boolean;

type UseHardwareWalletConnectionParams = {
  refs: HardwareWalletRefs;
  setters: {
    setDeviceId: (deviceId: string | null) => void;
    setConnectionState: (
      updater:
        | HardwareWalletConnectionState
        | ((
            prev: HardwareWalletConnectionState,
          ) => HardwareWalletConnectionState),
    ) => void;
  };
  updateConnectionState: (newState: HardwareWalletConnectionState) => void;
  handleDeviceEvent: (payload: DeviceEventPayload) => void;
  handleDisconnect: (error?: unknown) => void;
};

export const useHardwareWalletConnection = ({
  refs,
  setters,
  updateConnectionState,
  handleDeviceEvent,
  handleDisconnect,
}: UseHardwareWalletConnectionParams) => {
  const { setDeviceId } = setters;

  const resetAdapterForFreshConnection = useCallback(() => {
    if (refs.isConnectingRef.current || refs.adapterRef.current) {
      // eslint-disable-next-line no-console
      console.log('[HardwareWalletConnection] Resetting existing adapter');
      refs.adapterRef.current?.destroy();
      refs.adapterRef.current = null;
    }
  }, [refs]);

  const beginConnectionAttempt = useCallback(() => {
    const connectionId = Date.now();
    refs.currentConnectionIdRef.current = connectionId;
    refs.isConnectingRef.current = true;

    const isLatestAttempt: IsLatestAttempt = () =>
      refs.currentConnectionIdRef.current === connectionId;

    return { connectionId, isLatestAttempt };
  }, [refs]);

  const resolveOrDiscoverDeviceId = useCallback(
    async (targetWalletType: HardwareWalletType): Promise<string | null> => {
      const existingDeviceId = refs.deviceIdRef.current;
      if (existingDeviceId) {
        return existingDeviceId;
      }

      // eslint-disable-next-line no-console
      console.log(
        '[HardwareWalletConnection]',
        `Attempting to discover ${targetWalletType} device`,
      );

      try {
        const discoveredId = await getHardwareWalletDeviceId(targetWalletType);
        if (!discoveredId) {
          const error = createHardwareWalletError(
            ErrorCode.DeviceDisconnected,
            targetWalletType,
            `No ${targetWalletType} device found. Please ensure your device is connected and unlocked.`,
          );
          updateConnectionState(getConnectionStateFromError(error));
          refs.isConnectingRef.current = false;
          return null;
        }

        return discoveredId;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[HardwareWalletConnection] Discovery failed:', error);
        updateConnectionState(
          getConnectionStateFromError(
            createHardwareWalletError(
              ErrorCode.ConnectionClosed,
              targetWalletType,
              `Failed to discover ${targetWalletType} device: ${error instanceof Error ? error.message : String(error)}`,
              { cause: error instanceof Error ? error : undefined },
            ),
          ),
        );
        refs.isConnectingRef.current = false;
        return null;
      }
    },
    [updateConnectionState, refs],
  );

  const setConnectingStateForDevice = useCallback(
    ({
      abortSignal,
      deviceId: targetDeviceId,
    }: {
      abortSignal?: AbortSignal;
      deviceId: string;
    }) => {
      if (!abortSignal?.aborted) {
        setDeviceId(targetDeviceId);
        updateConnectionState(ConnectionState.connecting());
      }
    },
    [setDeviceId, updateConnectionState],
  );

  const connectWithAdapter = useCallback(
    async ({
      walletType: targetWalletType,
      deviceId: targetDeviceId,
      abortSignal,
      isLatestAttempt,
    }: {
      walletType: HardwareWalletType;
      deviceId: string;
      abortSignal?: AbortSignal;
      isLatestAttempt: IsLatestAttempt;
    }): Promise<void> => {
      if (!isLatestAttempt()) {
        return;
      }

      const adapterOptions: HardwareWalletAdapterOptions = {
        onDisconnect: handleDisconnect,
        onAwaitingConfirmation: () => {
          if (!abortSignal?.aborted && isLatestAttempt()) {
            updateConnectionState(ConnectionState.awaitingConfirmation());
          }
        },
        onDeviceLocked: () => {
          if (!abortSignal?.aborted && isLatestAttempt()) {
            updateConnectionState(
              ConnectionState.error('locked', new Error('Device is locked')),
            );
          }
        },
        onAppNotOpen: () => {
          if (!abortSignal?.aborted && isLatestAttempt()) {
            updateConnectionState(ConnectionState.awaitingApp('not_open'));
          }
        },
        onDeviceEvent: handleDeviceEvent,
      };

      const adapter = createAdapterForHardwareWalletType(
        targetWalletType,
        adapterOptions,
      );

      if (!isLatestAttempt()) {
        adapter.destroy();
        return;
      }

      refs.adapterRef.current = adapter;
      await adapter.connect(targetDeviceId);

      if (!isLatestAttempt()) {
        adapter.destroy();
        refs.adapterRef.current = null;
        return;
      }

      if (!abortSignal?.aborted) {
        updateConnectionState(ConnectionState.connected());
      }
    },
    [handleDeviceEvent, handleDisconnect, updateConnectionState, refs],
  );

  const handleConnectError = useCallback(
    ({
      error,
      abortSignal,
      isLatestAttempt,
    }: {
      error: unknown;
      abortSignal?: AbortSignal;
      isLatestAttempt: IsLatestAttempt;
    }) => {
      // eslint-disable-next-line no-console
      console.error('[HardwareWalletConnection] error:', error);

      if (!isLatestAttempt()) {
        return;
      }

      if (!abortSignal?.aborted) {
        if (isHardwareWalletErrorWithCode(error)) {
          updateConnectionState(getConnectionStateFromError(error));
        } else {
          const fallbackError =
            error instanceof Error
              ? error
              : new Error('Failed to connect to hardware wallet');
          updateConnectionState(
            ConnectionState.error('connection_failed', fallbackError),
          );
        }
      }

      refs.adapterRef.current?.destroy();
      refs.adapterRef.current = null;
    },
    [updateConnectionState, refs],
  );

  const finalizeConnectionAttempt = useCallback(
    (isLatestAttempt: IsLatestAttempt) => {
      if (isLatestAttempt()) {
        refs.isConnectingRef.current = false;
      }
    },
    [refs],
  );

  const connect = useCallback(async (): Promise<void> => {
    const abortSignal = refs.abortControllerRef.current?.signal;

    const effectiveType = refs.walletTypeRef.current;
    if (!effectiveType) {
      updateConnectionState(
        ConnectionState.error(
          'connection_failed',
          new Error('Hardware wallet type is unknown'),
        ),
      );
      refs.isConnectingRef.current = false;
      return;
    }

    resetAdapterForFreshConnection();
    const { connectionId, isLatestAttempt } = beginConnectionAttempt();

    const discoveredDeviceId = await resolveOrDiscoverDeviceId(effectiveType);
    if (!discoveredDeviceId) {
      return;
    }

    // eslint-disable-next-line no-console
    console.log(
      '[HardwareWalletConnection]',
      `Connecting to ${effectiveType} device: ${discoveredDeviceId} (ID: ${connectionId})`,
    );
    setConnectingStateForDevice({ abortSignal, deviceId: discoveredDeviceId });

    try {
      await connectWithAdapter({
        walletType: effectiveType,
        deviceId: discoveredDeviceId,
        abortSignal,
        isLatestAttempt,
      });
    } catch (error) {
      handleConnectError({ error, abortSignal, isLatestAttempt });
    } finally {
      finalizeConnectionAttempt(isLatestAttempt);
    }
  }, [
    beginConnectionAttempt,
    connectWithAdapter,
    finalizeConnectionAttempt,
    handleConnectError,
    resetAdapterForFreshConnection,
    resolveOrDiscoverDeviceId,
    setConnectingStateForDevice,
    updateConnectionState,
    refs,
  ]);

  useEffect(() => {
    refs.connectRef.current = connect;
  }, [connect, refs]);

  const disconnect = useCallback(async (): Promise<void> => {
    const abortSignal = refs.abortControllerRef.current?.signal;

    if (abortSignal?.aborted) {
      return;
    }

    try {
      await refs.adapterRef.current?.disconnect();
    } finally {
      refs.adapterRef.current?.destroy();
      refs.adapterRef.current = null;
      refs.currentConnectionIdRef.current = null;
      refs.isConnectingRef.current = false;
      if (!abortSignal?.aborted) {
        updateConnectionState(ConnectionState.disconnected());
        setDeviceId(null);
      }
    }
  }, [updateConnectionState, refs, setDeviceId]);

  const clearError = useCallback(() => {
    if (refs.abortControllerRef.current?.signal.aborted) {
      return;
    }

    if (refs.adapterRef.current?.isConnected()) {
      updateConnectionState(ConnectionState.connected());
    } else {
      updateConnectionState(ConnectionState.disconnected());
    }
  }, [updateConnectionState, refs]);

  const ensureDeviceReady = useCallback(
    async (targetDeviceId?: string): Promise<boolean> => {
      const effectiveDeviceId = targetDeviceId || refs.deviceIdRef.current;
      const abortSignal = refs.abortControllerRef.current?.signal;
      const currentWalletType = refs.walletTypeRef.current;
      const isAlreadyConnected = refs.adapterRef.current?.isConnected();

      // CRITICAL: If not connected, request permission FIRST before any other
      // async operations. This must be the first await to preserve the user
      // gesture chain. WebHID/WebUSB requestDevice() requires an active user gesture.
      if (!isAlreadyConnected && currentWalletType) {
        // eslint-disable-next-line no-console
        console.log(
          '[HardwareWalletConnection] Requesting permission for',
          currentWalletType,
        );
        const permissionGranted =
          await requestHardwareWalletPermission(currentWalletType);
        if (!permissionGranted) {
          // eslint-disable-next-line no-console
          console.log(
            '[HardwareWalletConnection] Permission denied or user cancelled',
          );
          return false;
        }
      }

      if (abortSignal?.aborted) {
        // eslint-disable-next-line no-console
        console.log('[HardwareWalletConnection] ensureDeviceReady aborted');
        return false;
      }

      if (!isAlreadyConnected) {
        // eslint-disable-next-line no-console
        console.log('[HardwareWalletConnection] Not connected, connecting');

        if (!currentWalletType) {
          return false;
        }

        try {
          if (effectiveDeviceId) {
            refs.deviceIdRef.current = effectiveDeviceId;
            setDeviceId(effectiveDeviceId);
          }
          await connect();
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(
            '[HardwareWalletConnection] connect failed in ensureDeviceReady',
            error,
          );
          return false;
        }
      }

      if (!abortSignal?.aborted) {
        const adapter = refs.adapterRef.current;
        if (adapter?.ensureDeviceReady && effectiveDeviceId) {
          try {
            const result = await adapter.ensureDeviceReady(effectiveDeviceId);
            // eslint-disable-next-line no-console
            console.log(
              '[HardwareWalletConnection] ensureDeviceReady:',
              result,
            );
            if (result) {
              updateConnectionState(ConnectionState.ready());
            }
            return result;
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error(
              '[HardwareWalletConnection] verifyDeviceReady',
              error,
            );
            if (error && typeof error === 'object' && 'code' in error) {
              updateConnectionState(
                getConnectionStateFromError(error as HardwareWalletError),
              );
            } else {
              const fallbackError =
                error instanceof Error
                  ? error
                  : new Error('Device verification failed');
              updateConnectionState(
                ConnectionState.error('connection_failed', fallbackError),
              );
            }
            return false;
          }
        }
      }

      return false;
    },
    [connect, updateConnectionState, refs, setDeviceId],
  );

  return {
    connect,
    disconnect,
    clearError,
    ensureDeviceReady,
  };
};

function isHardwareWalletErrorWithCode(
  error: unknown,
): error is HardwareWalletError {
  if (!error || typeof error !== 'object') {
    return false;
  }

  return Object.prototype.hasOwnProperty.call(error, 'code');
}
