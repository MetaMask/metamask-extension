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
import { toHardwareWalletError } from './rpcErrorUtils';

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

  const resetAdapterForFreshConnection = useCallback(
    () => {
      if (refs.adapterRef.current) {
        refs.adapterRef.current.destroy();
        refs.adapterRef.current = null;
      }
    },
    // eslint-disable-next-line react-compiler/react-compiler, react-hooks/exhaustive-deps
    [],
  );

  /**
   * Begins a new connection attempt by aborting any previous attempt
   * and creating a fresh AbortController.
   *
   * @returns The AbortSignal for this attempt - use to check if aborted
   */
  const beginConnectionAttempt = useCallback(
    () => {
      // Abort any previous connection attempt
      refs.abortControllerRef.current?.abort();

      // Create a new AbortController for this attempt
      const abortController = new AbortController();
      refs.abortControllerRef.current = abortController;

      // Increment connection ID to track this attempt
      refs.currentConnectionIdRef.current =
        (refs.currentConnectionIdRef.current ?? 0) + 1;

      return abortController.signal;
    },
    // eslint-disable-next-line react-compiler/react-compiler, react-hooks/exhaustive-deps
    [],
  );

  const resolveOrDiscoverDeviceId = useCallback(
    async ({
      walletType,
      abortSignal,
    }: {
      walletType: HardwareWalletType;
      abortSignal?: AbortSignal;
    }): Promise<string | null> => {
      if (abortSignal?.aborted) {
        return null;
      }

      const existingDeviceId = refs.deviceIdRef.current;
      if (existingDeviceId) {
        return existingDeviceId;
      }

      try {
        const discoveredId = await getHardwareWalletDeviceId(walletType);
        if (abortSignal?.aborted) {
          return null;
        }

        const deviceIdAfterDiscovery = refs.deviceIdRef.current;
        if (deviceIdAfterDiscovery && deviceIdAfterDiscovery !== discoveredId) {
          return deviceIdAfterDiscovery;
        }

        if (!discoveredId) {
          if (!abortSignal?.aborted) {
            const error = createHardwareWalletError(
              ErrorCode.DeviceDisconnected,
              walletType,
              `No ${walletType} device found. Please ensure your device is connected and unlocked.`,
            );
            updateConnectionState(getConnectionStateFromError(error));
          }
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
        return null;
      }
    },
    // eslint-disable-next-line react-compiler/react-compiler, react-hooks/exhaustive-deps
    [updateConnectionState],
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
        if (
          refs.deviceIdRef.current === null ||
          refs.deviceIdRef.current === targetDeviceId
        ) {
          refs.deviceIdRef.current = targetDeviceId;
          setDeviceId(targetDeviceId);
          updateConnectionState(ConnectionState.connecting());
        }
      }
    },
    // eslint-disable-next-line react-compiler/react-compiler, react-hooks/exhaustive-deps
    [setDeviceId, updateConnectionState],
  );

  const connectWithAdapter = useCallback(
    async ({
      walletType: targetWalletType,
      deviceId: targetDeviceId,
      abortSignal,
    }: {
      walletType: HardwareWalletType;
      deviceId: string;
      abortSignal: AbortSignal;
    }): Promise<void> => {
      if (abortSignal.aborted) {
        return;
      }

      const adapterOptions: HardwareWalletAdapterOptions = {
        onDisconnect: handleDisconnect,
        onAwaitingConfirmation: () => {
          if (!abortSignal.aborted) {
            updateConnectionState(ConnectionState.awaitingConfirmation());
          }
        },
        onDeviceLocked: () => {
          if (!abortSignal.aborted) {
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
          if (!abortSignal.aborted) {
            updateConnectionState(ConnectionState.awaitingApp());
          }
        },
        onDeviceEvent: handleDeviceEvent,
      };

      const adapter = createAdapterForHardwareWalletType(
        targetWalletType,
        adapterOptions,
      );

      if (abortSignal.aborted) {
        adapter.destroy();
        return;
      }

      refs.adapterRef.current = adapter;
      await adapter.connect(targetDeviceId);

      if (abortSignal.aborted) {
        adapter.destroy();
        // Only null out the adapter if it's still the one we created.
        // Between setting refs.adapterRef.current = adapter (line 189) and this check,
        // there's an await (line 190) during which a new connection could replace it.
        if (refs.adapterRef.current === adapter) {
          refs.adapterRef.current = null;
        }
        return;
      }

      updateConnectionState(ConnectionState.connected());
    },
    // eslint-disable-next-line react-compiler/react-compiler, react-hooks/exhaustive-deps
    [handleDeviceEvent, handleDisconnect, updateConnectionState],
  );

  const handleConnectError = useCallback(
    ({
      error,
      abortSignal,
      walletType,
    }: {
      error: unknown;
      abortSignal: AbortSignal;
      walletType: HardwareWalletType;
    }) => {
      if (!abortSignal.aborted) {
        if (isHardwareWalletError(error)) {
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

        refs.adapterRef.current?.destroy();
        refs.adapterRef.current = null;
      }
    },
    // eslint-disable-next-line react-compiler/react-compiler, react-hooks/exhaustive-deps
    [updateConnectionState],
  );

  const connect = useCallback(
    (): Promise<void> => {
      // If there's already a connection in progress, return the pending promise
      // so all callers wait for the same connection to complete
      if (refs.connectingPromiseRef.current) {
        return refs.connectingPromiseRef.current;
      }

      // Set flag to prevent auto-connect race conditions
      // This must happen synchronously before any async work
      refs.isConnectingRef.current = true;

      const connectionPromise = (async (): Promise<void> => {
        const effectiveType = refs.walletTypeRef.current;
        if (!effectiveType) {
          updateConnectionState(
            ConnectionState.error(
              createHardwareWalletError(
                ErrorCode.Unknown,
                HardwareWalletType.Unknown,
                'Hardware wallet type is unknown',
              ),
            ),
          );
          return;
        }

        resetAdapterForFreshConnection();
        const abortSignal = beginConnectionAttempt();

        const discoveredDeviceId = await resolveOrDiscoverDeviceId({
          walletType: effectiveType,
          abortSignal,
        });
        if (!discoveredDeviceId || abortSignal.aborted) {
          return;
        }

        setConnectingStateForDevice({
          abortSignal,
          deviceId: discoveredDeviceId,
        });

        try {
          await connectWithAdapter({
            walletType: effectiveType,
            deviceId: discoveredDeviceId,
            abortSignal,
          });
        } catch (error) {
          handleConnectError({
            error,
            abortSignal,
            walletType: effectiveType,
          });
        }
      })();

      // Store the promise so concurrent callers can await it
      refs.connectingPromiseRef.current = connectionPromise;

      // Clear when the connection completes (success or failure)
      // Only clear if still holding this promise (not a newer one from a disconnect + reconnect)
      connectionPromise.finally(() => {
        if (refs.connectingPromiseRef.current === connectionPromise) {
          refs.connectingPromiseRef.current = null;
        }
        // Reset flag to allow new connection attempts
        refs.isConnectingRef.current = false;
      });

      return connectionPromise;
    },
    // eslint-disable-next-line react-compiler/react-compiler, react-hooks/exhaustive-deps
    [
      beginConnectionAttempt,
      connectWithAdapter,
      handleConnectError,
      resetAdapterForFreshConnection,
      resolveOrDiscoverDeviceId,
      setConnectingStateForDevice,
      updateConnectionState,
    ],
  );

  useEffect(
    () => {
      refs.connectRef.current = connect;
    },
    // eslint-disable-next-line react-compiler/react-compiler, react-hooks/exhaustive-deps
    [connect],
  );

  const disconnect = useCallback(
    async (): Promise<void> => {
      // Abort any in-progress connection attempt first.
      // This ensures that if connect() is awaiting and fails due to adapter destruction,
      // the error handlers will see abortSignal.aborted=true and skip state updates.
      refs.abortControllerRef.current?.abort();

      // Capture references at the start to prevent race conditions
      // where connect() creates new ones while disconnect() is awaiting
      const adapterToDisconnect = refs.adapterRef.current;
      const promiseToCancel = refs.connectingPromiseRef.current;
      // Capture the abort controller to detect if a new connect() started during our await.
      // A new connect() will create a new abort controller.
      const controllerAtStart = refs.abortControllerRef.current;

      try {
        await adapterToDisconnect?.disconnect();
      } finally {
        // Only destroy the adapter we captured at the start, not any new adapter
        // that may have been created by a concurrent connect() call
        adapterToDisconnect?.destroy();
        // Only null out references if they still hold the same values
        // (i.e., no concurrent connect() replaced them)
        if (refs.adapterRef.current === adapterToDisconnect) {
          refs.adapterRef.current = null;
        }
        if (refs.connectingPromiseRef.current === promiseToCancel) {
          refs.connectingPromiseRef.current = null;
        }
        // Only update state if no new connection started during our await.
        // A new connection would have created a new abort controller.
        if (refs.abortControllerRef.current === controllerAtStart) {
          updateConnectionState(ConnectionState.disconnected());
          setDeviceId(null);
        }
      }
    },
    // eslint-disable-next-line react-compiler/react-compiler, react-hooks/exhaustive-deps
    [updateConnectionState, setDeviceId],
  );

  const clearError = useCallback(
    () => {
      if (refs.abortControllerRef.current?.signal.aborted) {
        return;
      }

      if (refs.adapterRef.current?.isConnected()) {
        updateConnectionState(ConnectionState.connected());
      } else {
        updateConnectionState(ConnectionState.disconnected());
      }
    },
    // eslint-disable-next-line react-compiler/react-compiler, react-hooks/exhaustive-deps
    [updateConnectionState],
  );

  const ensureDeviceReady = useCallback(
    async (targetDeviceId?: string): Promise<boolean> => {
      const initialDeviceId = targetDeviceId ?? refs.deviceIdRef.current;
      const inFlightPromise = refs.ensureDeviceReadyPromiseRef.current;
      if (inFlightPromise) {
        const inFlightDeviceId = refs.ensureDeviceReadyDeviceIdRef.current;
        if (
          targetDeviceId &&
          (!inFlightDeviceId || targetDeviceId !== inFlightDeviceId)
        ) {
          return false;
        }
        return inFlightPromise;
      }

      const ensurePromise = (async (): Promise<boolean> => {
        const abortSignalAtStart = refs.abortControllerRef.current?.signal;
        if (abortSignalAtStart?.aborted) {
          return false;
        }

        let expectedConnectionId = refs.currentConnectionIdRef.current ?? 0;
        let effectiveDeviceId = initialDeviceId;

        if (!refs.adapterRef.current?.isConnected()) {
          const currentWalletType = refs.walletTypeRef.current;

          if (!currentWalletType) {
            return false;
          }

          const hasPendingConnection = Boolean(
            refs.connectingPromiseRef.current,
          );
          const abortSignalBeforeConnect =
            refs.abortControllerRef.current?.signal;
          if (abortSignalBeforeConnect?.aborted) {
            return false;
          }

          if (
            hasPendingConnection &&
            targetDeviceId &&
            (!refs.deviceIdRef.current ||
              refs.deviceIdRef.current !== targetDeviceId)
          ) {
            return false;
          }

          if (effectiveDeviceId && !hasPendingConnection) {
            refs.deviceIdRef.current = effectiveDeviceId;
            setDeviceId(effectiveDeviceId);
          }

          if (!refs.adapterRef.current?.isConnected()) {
            const connectPromise = connect();
            expectedConnectionId = refs.currentConnectionIdRef.current ?? 0;
            await connectPromise;
          }
          // Update effectiveDeviceId to use newly discovered device ID if connect() found one
          effectiveDeviceId = refs.deviceIdRef.current;
        }

        if (
          targetDeviceId &&
          (!effectiveDeviceId || targetDeviceId !== effectiveDeviceId)
        ) {
          return false;
        }

        // Check if this is still the latest connection attempt
        const currentId = refs.currentConnectionIdRef.current ?? 0;
        if (currentId !== expectedConnectionId) {
          return false;
        }

        // Get abort signal after connect() - it may have created a new one
        const abortSignal = refs.abortControllerRef.current?.signal;

        if (abortSignal?.aborted) {
          return false;
        }

        const adapter = refs.adapterRef.current;
        if (adapter?.ensureDeviceReady && effectiveDeviceId) {
          const connectionIdBeforeEnsure = expectedConnectionId;
          const isEnsureStale = () =>
            (refs.currentConnectionIdRef.current ?? 0) !==
              connectionIdBeforeEnsure || refs.adapterRef.current !== adapter;

          if (abortSignal?.aborted || isEnsureStale()) {
            return false;
          }

          try {
            const result = await adapter.ensureDeviceReady(effectiveDeviceId);
            if (abortSignal?.aborted || isEnsureStale()) {
              return false;
            }
            if (result) {
              updateConnectionState(ConnectionState.ready());
            }
            return result;
          } catch (error) {
            if (abortSignal?.aborted || isEnsureStale()) {
              return false;
            }
            if (isHardwareWalletError(error)) {
              updateConnectionState(getConnectionStateFromError(error));
            } else {
              const fallbackError = toHardwareWalletError(
                error,
                refs.walletTypeRef.current ?? HardwareWalletType.Unknown,
              );
              updateConnectionState(ConnectionState.error(fallbackError));
            }
            return false;
          }
        }

        return false;
      })();

      refs.ensureDeviceReadyPromiseRef.current = ensurePromise;
      refs.ensureDeviceReadyDeviceIdRef.current = initialDeviceId;

      ensurePromise.finally(() => {
        if (refs.ensureDeviceReadyPromiseRef.current === ensurePromise) {
          refs.ensureDeviceReadyPromiseRef.current = null;
          refs.ensureDeviceReadyDeviceIdRef.current = null;
        }
      });

      return ensurePromise;
    },
    // eslint-disable-next-line react-compiler/react-compiler, react-hooks/exhaustive-deps
    [connect, updateConnectionState, setDeviceId],
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
