import { useCallback, useEffect } from 'react';
import { ErrorCode, HardwareWalletError } from '@metamask/hw-wallet-sdk';
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
import { getHardwareWalletDeviceId } from './webConnectionUtils';
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
    async ({
      walletType,
      abortSignal,
    }: {
      walletType: HardwareWalletType;
      abortSignal?: AbortSignal;
    }): Promise<string | null> => {
      const existingDeviceId = refs.deviceIdRef.current;
      if (existingDeviceId) {
        return existingDeviceId;
      }

      try {
        const discoveredId = await getHardwareWalletDeviceId(walletType);
        if (!discoveredId) {
          if (!abortSignal?.aborted) {
            const error = createHardwareWalletError(
              ErrorCode.DeviceDisconnected,
              walletType,
              `No ${walletType} device found. Please ensure your device is connected and unlocked.`,
            );
            updateConnectionState(getConnectionStateFromError(error));
          }
          refs.isConnectingRef.current = false;
          return null;
        }

        return discoveredId;
      } catch (error) {
        if (!abortSignal?.aborted) {
          updateConnectionState(
            getConnectionStateFromError(
              createHardwareWalletError(
                ErrorCode.ConnectionClosed,
                walletType,
                `Failed to discover ${walletType} device: ${error instanceof Error ? error.message : String(error)}`,
                { cause: error instanceof Error ? error : undefined },
              ),
            ),
          );
        }
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
      if (abortSignal?.aborted) {
        return;
      }

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
              ConnectionState.error(
                createHardwareWalletError(
                  ErrorCode.AuthenticationDeviceLocked,
                  targetWalletType,
                  'Device is locked',
                ),
              ),
            );
          }
        },
        onAppNotOpen: () => {
          if (!abortSignal?.aborted && isLatestAttempt()) {
            updateConnectionState(ConnectionState.awaitingApp());
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
      walletType,
    }: {
      error: unknown;
      abortSignal?: AbortSignal;
      isLatestAttempt: IsLatestAttempt;
      walletType: HardwareWalletType;
    }) => {
      if (!isLatestAttempt()) {
        return;
      }

      if (!abortSignal?.aborted) {
        if (isHardwareWalletErrorWithCode(error)) {
          updateConnectionState(getConnectionStateFromError(error));
        } else {
          const fallbackError = createHardwareWalletError(
            ErrorCode.ConnectionClosed,
            walletType,
            error instanceof Error
              ? error.message
              : 'Failed to connect to hardware wallet',
            { cause: error instanceof Error ? error : undefined },
          );
          updateConnectionState(ConnectionState.error(fallbackError));
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
        ConnectionState.error(new Error('Hardware wallet type is unknown')),
      );
      refs.isConnectingRef.current = false;
      return;
    }

    resetAdapterForFreshConnection();
    const { isLatestAttempt } = beginConnectionAttempt();

    const discoveredDeviceId = await resolveOrDiscoverDeviceId({
      walletType: effectiveType,
      abortSignal,
    });
    if (!discoveredDeviceId) {
      return;
    }

    setConnectingStateForDevice({ abortSignal, deviceId: discoveredDeviceId });

    try {
      await connectWithAdapter({
        walletType: effectiveType,
        deviceId: discoveredDeviceId,
        abortSignal,
        isLatestAttempt,
      });
    } catch (error) {
      handleConnectError({
        error,
        abortSignal,
        isLatestAttempt,
        walletType: effectiveType,
      });
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
      let effectiveDeviceId = targetDeviceId || refs.deviceIdRef.current;
      const abortSignal = refs.abortControllerRef.current?.signal;

      if (abortSignal?.aborted) {
        return false;
      }

      if (!refs.adapterRef.current?.isConnected()) {
        const currentWalletType = refs.walletTypeRef.current;

        if (!currentWalletType) {
          return false;
        }

        try {
          if (effectiveDeviceId) {
            refs.deviceIdRef.current = effectiveDeviceId;
            setDeviceId(effectiveDeviceId);
          }
          await connect();
          // Update effectiveDeviceId to use newly discovered device ID if connect() found one
          effectiveDeviceId = refs.deviceIdRef.current;
        } catch (error) {
          return false;
        }
      }

      if (!abortSignal?.aborted) {
        const adapter = refs.adapterRef.current;
        if (adapter?.ensureDeviceReady && effectiveDeviceId) {
          try {
            const result = await adapter.ensureDeviceReady(effectiveDeviceId);
            if (result) {
              updateConnectionState(ConnectionState.ready());
            }
            return result;
          } catch (error) {
            if (isHardwareWalletError(error)) {
              updateConnectionState(getConnectionStateFromError(error));
            } else {
              const fallbackError =
                error instanceof Error
                  ? error
                  : new Error('Device verification failed');
              updateConnectionState(ConnectionState.error(fallbackError));
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

function isHardwareWalletError(error: unknown): error is HardwareWalletError {
  return error instanceof HardwareWalletError;
}

function isHardwareWalletErrorWithCode(
  error: unknown,
): error is HardwareWalletError {
  if (!error || typeof error !== 'object') {
    return false;
  }

  return Object.prototype.hasOwnProperty.call(error, 'code');
}
