import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useSelector } from 'react-redux';
import { KeyringTypes } from '@metamask/keyring-controller';
import { getSelectedInternalAccount } from '../../selectors/accounts';
import { ConnectionState } from './connectionState';
import { LedgerAdapter } from './adapters/LedgerAdapter';
import {
  getConnectionStateFromError,
  type HardwareWalletError,
} from './errors';
import {
  DeviceEvent,
  HardwareWalletType,
  WebHIDPermissionState,
  type HardwareWalletAdapter,
  type HardwareWalletAdapterOptions,
  type HardwareWalletConnectionState,
  type HardwareWalletContextType,
  type DeviceEventPayload,
} from './types';
import {
  checkWebHIDPermission,
  getDeviceId,
  requestWebHIDPermission,
  isWebHIDAvailable,
  subscribeToWebHIDEvents,
} from './webHIDUtils';

const LOG_TAG = '[HardwareWalletContext]';

/**
 * Type guard to check if an error is an Error instance
 *
 * @param error - The error to check
 * @returns True if the error is an Error instance
 */
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

// Default context value (for non-hardware wallet accounts)
const noopAsync = async (): Promise<void> => undefined;
const noop = (): void => undefined;

const defaultContextValue: HardwareWalletContextType = {
  isHardwareWalletAccount: false,
  detectedWalletType: null,
  walletType: null,
  connectionState: ConnectionState.disconnected(),
  deviceId: null,
  webHidPermissionState: WebHIDPermissionState.UNKNOWN,
  isWebHidAvailable: false,
  currentAppName: null,
  connect: noopAsync,
  disconnect: noopAsync,
  executeWithWallet: async () => {
    throw new Error('Cannot execute: not a hardware wallet account');
  },
  clearError: noop,
  retry: noopAsync,
  checkWebHidPermission: async () => WebHIDPermissionState.UNKNOWN,
  requestWebHidPermission: async () => false,
  ensureDeviceReady: async () => true, // Non-hardware wallets are always ready
};

export const HardwareWalletContext =
  createContext<HardwareWalletContextType>(defaultContextValue);

/**
 * Helper function to map keyring type to hardware wallet type
 *
 * @param keyringType - The keyring type to map
 * @returns The hardware wallet type or null
 */
function keyringTypeToHardwareWalletType(
  keyringType?: string,
): HardwareWalletType | null {
  if (!keyringType) {
    return null;
  }

  // Map keyring types to hardware wallet types
  switch (keyringType) {
    case KeyringTypes.ledger:
      return HardwareWalletType.LEDGER;
    default:
      return null;
  }
}

export const HardwareWalletProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // ============================================================================
  // SECTION 1: Account Detection
  // ============================================================================

  const selectedAccount = useSelector(getSelectedInternalAccount);
  const keyringType = selectedAccount?.metadata?.keyring?.type;
  const detectedWalletType = keyringTypeToHardwareWalletType(keyringType);
  const isHardwareWalletAccount = detectedWalletType !== null;
  const accountAddress = selectedAccount?.address;

  // ============================================================================
  // SECTION 2: State Management
  // ============================================================================

  const [walletType, setWalletType] = useState<HardwareWalletType | null>(null);
  const [connectionState, setConnectionState] =
    useState<HardwareWalletConnectionState>(ConnectionState.disconnected());
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [webHidPermissionState, setWebHidPermissionState] =
    useState<WebHIDPermissionState>(WebHIDPermissionState.UNKNOWN);
  const [currentAppName, setCurrentAppName] = useState<string | null>(null);

  const isWebHidAvailableState = isWebHIDAvailable();

  // ============================================================================
  // SECTION 3: Refs (Prevent Infinite Loops & Race Conditions)
  // ============================================================================

  // Core refs
  const adapterRef = useRef<HardwareWalletAdapter | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // State refs (synced via useEffect to access latest values in stable callbacks)
  // These allow callbacks to access current state without including state in dependencies
  const walletTypeRef = useRef<HardwareWalletType | null>(null);

  // Operation refs
  const pendingOperationRef = useRef<(() => Promise<unknown>) | null>(null);

  // Connection guards (prevent duplicate connections)
  const isConnectingRef = useRef(false);
  const hasAutoConnectedRef = useRef(false);
  const lastConnectedAccountRef = useRef<string | null>(null);

  // Stable function refs (prevent stale closures in effects)
  // These allow effects to call functions without triggering infinite loops
  const connectRef =
    useRef<(type: HardwareWalletType, id: string) => Promise<void>>();

  // ============================================================================
  // SECTION 4: Stable Callbacks (Minimal Dependencies)
  // ============================================================================

  /**
   * CRITICAL: Use functional state updates to avoid dependencies on state
   * This prevents infinite loops when callbacks trigger state changes
   */
  const handleDeviceEvent = useCallback((payload: DeviceEventPayload) => {
    if (abortControllerRef.current?.signal.aborted) {
      return;
    }

    console.log(LOG_TAG, 'Device event:', payload.event);
    console.log(LOG_TAG, 'Event payload:', payload);

    switch (payload.event) {
      case DeviceEvent.DISCONNECTED:
        console.log(LOG_TAG, 'Handling DISCONNECTED event');
        if (!isConnectingRef.current) {
          setConnectionState(ConnectionState.disconnected());
        }
        break;

      case DeviceEvent.DEVICE_LOCKED:
        console.log(LOG_TAG, 'Handling DEVICE_LOCKED event');
        console.log(LOG_TAG, 'Payload error:', payload.error);
        setConnectionState(
          ConnectionState.error('locked', payload.error as Error),
        );
        break;

      case DeviceEvent.APP_NOT_OPEN:
        console.log(LOG_TAG, 'Handling APP_NOT_OPEN event');
        setConnectionState(ConnectionState.awaitingApp('not_open'));
        break;

      case DeviceEvent.APP_CHANGED:
        console.log(LOG_TAG, 'Handling APP_CHANGED event');
        setCurrentAppName(payload.currentAppName || null);
        // If a specific app name is provided and it's being reported as changed,
        // it indicates the wrong app is open
        if (payload.currentAppName) {
          setConnectionState(
            ConnectionState.awaitingApp('wrong_app', payload.currentAppName),
          );
        }
        break;

      case DeviceEvent.CONNECTION_FAILED:
        console.log(LOG_TAG, 'Handling CONNECTION_FAILED event');
        if (payload.error) {
          setConnectionState(
            ConnectionState.error('connection_failed', payload.error),
          );
        }
        break;

      default:
        console.log(LOG_TAG, 'Unknown device event:', payload.event);
        break;
    }
  }, []);

  const handleDisconnect = useCallback((disconnectError?: unknown) => {
    if (abortControllerRef.current?.signal.aborted) {
      return;
    }

    console.log(LOG_TAG, 'Disconnect handler called');

    if (isConnectingRef.current) {
      console.log(LOG_TAG, 'Ignoring disconnect during connection');
      return;
    }

    adapterRef.current = null;
    isConnectingRef.current = false;

    // Errors from adapter are native HardwareWalletErrors from KeyringController
    if (
      disconnectError &&
      typeof disconnectError === 'object' &&
      'code' in disconnectError
    ) {
      setConnectionState(
        getConnectionStateFromError(
          disconnectError as unknown as HardwareWalletError,
        ),
      );
    } else {
      setConnectionState(ConnectionState.disconnected());
    }
  }, []);

  // ============================================================================
  // SECTION 5: Lifecycle Effects
  // ============================================================================

  // Initialize AbortController and cleanup on unmount
  useEffect(() => {
    abortControllerRef.current = new AbortController();
    return () => {
      abortControllerRef.current?.abort();
      adapterRef.current?.destroy();
    };
  }, []);

  // Sync refs with state (to avoid stale closures in callbacks)
  useEffect(() => {
    walletTypeRef.current = walletType;
  }, [walletType]);

  // Cleanup when switching away from hardware wallet account
  useEffect(() => {
    if (!isHardwareWalletAccount && adapterRef.current) {
      adapterRef.current.destroy();
      adapterRef.current = null;
      setConnectionState(ConnectionState.disconnected());
      setWalletType(null);
      setDeviceId(null);
      setCurrentAppName(null);
      pendingOperationRef.current = null;
      isConnectingRef.current = false;
      hasAutoConnectedRef.current = false;
      lastConnectedAccountRef.current = null;
    }
  }, [isHardwareWalletAccount]);

  // Check WebHID permission on mount and when account changes
  useEffect(() => {
    if (isHardwareWalletAccount && isWebHidAvailableState) {
      checkWebHIDPermission().then((state) => {
        if (!abortControllerRef.current?.signal.aborted) {
          setWebHidPermissionState(state);
        }
      });
    }
  }, [isHardwareWalletAccount, isWebHidAvailableState]);

  // Subscribe to native WebHID connect/disconnect events
  useEffect(() => {
    if (!isHardwareWalletAccount || !isWebHidAvailableState) {
      return undefined;
    }

    const abortSignal = abortControllerRef.current?.signal;

    const handleNativeConnect = (device: HIDDevice) => {
      if (abortSignal?.aborted) {
        return;
      }

      console.log(
        LOG_TAG,
        'Native connect event for device:',
        device.productId,
      );

      // Update device ID if changed
      const newDeviceId = device.productId.toString();
      setDeviceId((prevId) => {
        if (prevId !== newDeviceId) {
          console.log(LOG_TAG, 'Device ID updated:', newDeviceId);
          return newDeviceId;
        }
        return prevId;
      });

      // Auto-reconnect if we have a detected wallet type and permission
      if (
        detectedWalletType &&
        webHidPermissionState === WebHIDPermissionState.GRANTED &&
        !adapterRef.current?.isConnected() &&
        !isConnectingRef.current
      ) {
        console.log(LOG_TAG, 'Auto-reconnecting to newly connected device');
        connectRef.current?.(detectedWalletType, newDeviceId);
      }
    };

    const handleNativeDisconnect = (device: HIDDevice) => {
      if (abortSignal?.aborted) {
        return;
      }

      console.log(
        LOG_TAG,
        'Native disconnect event for device:',
        device.productId,
      );

      // Only handle disconnect if it's our current device
      const disconnectedDeviceId = device.productId.toString();
      if (deviceId === disconnectedDeviceId) {
        console.log(LOG_TAG, 'Current device disconnected');
        handleDisconnect();
      }
    };

    // Subscribe to events
    const unsubscribe = subscribeToWebHIDEvents(
      handleNativeConnect,
      handleNativeDisconnect,
    );

    // Cleanup on unmount or when dependencies change
    return unsubscribe;
  }, [
    isHardwareWalletAccount,
    isWebHidAvailableState,
    detectedWalletType,
    webHidPermissionState,
    deviceId,
    handleDisconnect,
  ]);

  // ============================================================================
  // SECTION 6: Connection Actions
  // ============================================================================

  const connect = useCallback(
    async (type: HardwareWalletType, id: string): Promise<void> => {
      const abortSignal = abortControllerRef.current?.signal;

      if (!isHardwareWalletAccount) {
        return;
      }
      if (abortSignal?.aborted) {
        return;
      }

      // Prevent duplicate connections
      if (isConnectingRef.current) {
        console.log(LOG_TAG, 'Connection already in progress');
        return;
      }

      isConnectingRef.current = true;
      console.log(LOG_TAG, `Connecting to ${type} device: ${id}`);

      setWalletType(type);
      setDeviceId(id);
      setConnectionState(ConnectionState.connecting());

      try {
        // Clean up existing adapter
        adapterRef.current?.destroy();

        // Create adapter options
        // Adapters now emit device events with native errors from KeyringController
        // The handleDeviceEvent callback will update connection state appropriately
        const adapterOptions: HardwareWalletAdapterOptions = {
          onDisconnect: handleDisconnect,
          onAwaitingConfirmation: () => {
            if (!abortSignal?.aborted) {
              setConnectionState(ConnectionState.awaitingConfirmation());
            }
          },
          onDeviceLocked: () => {
            // This callback is kept for backwards compatibility
            // but adapters should prefer emitting DEVICE_LOCKED event with error
            if (!abortSignal?.aborted) {
              setConnectionState(
                ConnectionState.error('locked', new Error('Device is locked')),
              );
            }
          },
          onAppNotOpen: () => {
            // This callback is kept for backwards compatibility
            // but adapters should prefer emitting APP_NOT_OPEN event
            if (!abortSignal?.aborted) {
              setConnectionState(ConnectionState.awaitingApp('not_open'));
            }
          },
          onDeviceEvent: handleDeviceEvent,
        };

        // Create adapter based on type
        let adapter: HardwareWalletAdapter;
        switch (type) {
          case HardwareWalletType.LEDGER:
            adapter = new LedgerAdapter(adapterOptions);
            break;
          default:
            throw new Error(
              `Unsupported hardware wallet type: ${String(type)}`,
            );
        }

        adapterRef.current = adapter;

        await adapter.connect(id);

        if (!abortSignal?.aborted) {
          console.log(LOG_TAG, 'Connected successfully');
          setConnectionState(ConnectionState.connected());
        }
        isConnectingRef.current = false;
      } catch (err) {
        console.error(LOG_TAG, 'Connection error:', err);

        if (!abortSignal?.aborted) {
          // Errors from adapter are already native HardwareWalletErrors from KeyringController
          // Just convert them to connection state using getConnectionStateFromError
          if (err && typeof err === 'object' && 'code' in err) {
            setConnectionState(
              getConnectionStateFromError(
                err as unknown as HardwareWalletError,
              ),
            );
          } else {
            // Fallback for non-hardware wallet errors
            const fallbackError = isError(err)
              ? err
              : new Error('Failed to connect to hardware wallet');
            setConnectionState(
              ConnectionState.error('connection_failed', fallbackError),
            );
          }
        }

        adapterRef.current?.destroy();
        adapterRef.current = null;
        isConnectingRef.current = false;
      }
    },
    [handleDeviceEvent, handleDisconnect, isHardwareWalletAccount],
  );

  // Sync connectRef to always have the latest connect function
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // ============================================================================
  // SECTION 7: Auto-Connection Effect
  // ============================================================================

  /**
   * Uses connectRef.current instead of connect directly to avoid infinite loops.
   * The connect function changes when its dependencies change, but we need a
   * stable reference to call it without triggering effect re-runs.
   */
  useEffect(() => {
    if (!isHardwareWalletAccount) {
      hasAutoConnectedRef.current = false;
      lastConnectedAccountRef.current = null;
      return;
    }

    const abortSignal = abortControllerRef.current?.signal;

    // Skip if already auto-connected for this account
    const shouldSkipAutoConnect =
      hasAutoConnectedRef.current &&
      lastConnectedAccountRef.current === accountAddress;
    if (shouldSkipAutoConnect) {
      return;
    }

    // Get device ID
    getDeviceId()
      .then((id) => {
        if (abortSignal?.aborted) {
          return;
        }

        setDeviceId((prevId) => (prevId === id ? prevId : id));

        // Auto-connect conditions
        if (
          detectedWalletType &&
          id &&
          !adapterRef.current?.isConnected() &&
          !isConnectingRef.current &&
          !hasAutoConnectedRef.current &&
          webHidPermissionState === WebHIDPermissionState.GRANTED
        ) {
          console.log(LOG_TAG, 'Auto-connecting for account:', accountAddress);
          hasAutoConnectedRef.current = true;
          lastConnectedAccountRef.current = accountAddress ?? null;
          // Use connectRef.current to avoid stale closure
          connectRef.current?.(detectedWalletType, id);
        }
      })
      .catch((error: unknown) => {
        const errorMessage = isError(error) ? error.message : String(error);
        console.error(LOG_TAG, 'Error getting device ID:', errorMessage);
      });
  }, [
    isHardwareWalletAccount,
    accountAddress,
    detectedWalletType,
    webHidPermissionState,
  ]);

  // ============================================================================
  // SECTION 8: Context Actions
  // ============================================================================

  const disconnect = useCallback(async (): Promise<void> => {
    const abortSignal = abortControllerRef.current?.signal;

    if (!isHardwareWalletAccount) {
      return;
    }
    if (abortSignal?.aborted) {
      return;
    }

    try {
      await adapterRef.current?.disconnect();
    } finally {
      adapterRef.current?.destroy();
      adapterRef.current = null;
      if (!abortSignal?.aborted) {
        setConnectionState(ConnectionState.disconnected());
        setWalletType(null);
        setDeviceId(null);
      }
      pendingOperationRef.current = null;
    }
  }, [isHardwareWalletAccount]);

  const executeWithWallet = useCallback(
    async <TResult,>(
      operation: (adapter: HardwareWalletAdapter) => Promise<TResult>,
    ): Promise<TResult> => {
      const abortSignal = abortControllerRef.current?.signal;

      if (!isHardwareWalletAccount) {
        throw new Error('Not a hardware wallet account');
      }

      const adapter = adapterRef.current;
      if (!adapter) {
        throw new Error('No hardware wallet connected');
      }

      const currentWalletType = walletType;
      if (!currentWalletType) {
        throw new Error('No wallet type set');
      }

      pendingOperationRef.current = () => operation(adapter);

      try {
        if (!abortSignal?.aborted) {
          setConnectionState(ConnectionState.awaitingConfirmation());
        }

        adapter.setPendingOperation?.(true);
        const result = await operation(adapter);
        adapter.setPendingOperation?.(false);

        if (!abortSignal?.aborted) {
          // Operation succeeded, device is ready
          setConnectionState(ConnectionState.ready());
        }
        pendingOperationRef.current = null;

        return result;
      } catch (err) {
        adapter.setPendingOperation?.(false);

        if (!abortSignal?.aborted) {
          // Errors from operations are native HardwareWalletErrors from KeyringController
          if (err && typeof err === 'object' && 'code' in err) {
            setConnectionState(
              getConnectionStateFromError(
                err as unknown as HardwareWalletError,
              ),
            );
          } else if (isError(err)) {
            setConnectionState(ConnectionState.error('connection_failed', err));
          } else {
            setConnectionState(
              ConnectionState.error(
                'connection_failed',
                new Error('Unknown error during operation'),
              ),
            );
          }
        }
        throw err;
      }
    },
    [isHardwareWalletAccount, walletType],
  );

  const clearError = useCallback(() => {
    if (!isHardwareWalletAccount) {
      return;
    }
    if (abortControllerRef.current?.signal.aborted) {
      return;
    }

    if (adapterRef.current?.isConnected()) {
      setConnectionState(ConnectionState.connected());
    } else {
      setConnectionState(ConnectionState.disconnected());
    }
  }, [isHardwareWalletAccount]);

  const retry = useCallback(async (): Promise<void> => {
    const abortSignal = abortControllerRef.current?.signal;

    if (!isHardwareWalletAccount) {
      return;
    }
    if (abortSignal?.aborted) {
      return;
    }

    console.log(LOG_TAG, 'Retry requested');

    const currentWalletType = walletType;

    // Retry pending operation if connected
    if (pendingOperationRef.current && adapterRef.current?.isConnected()) {
      try {
        if (!abortSignal?.aborted) {
          setConnectionState(ConnectionState.awaitingConfirmation());
        }
        await pendingOperationRef.current();
        if (!abortSignal?.aborted) {
          // Operation succeeded, device is ready
          setConnectionState(ConnectionState.ready());
        }
        pendingOperationRef.current = null;
      } catch (err) {
        if (!abortSignal?.aborted) {
          // Errors are native HardwareWalletErrors from KeyringController
          if (err && typeof err === 'object' && 'code' in err) {
            setConnectionState(
              getConnectionStateFromError(
                err as unknown as HardwareWalletError,
              ),
            );
          } else {
            setConnectionState(ConnectionState.disconnected());
          }
        }
      }
    } else if (deviceId && currentWalletType) {
      // Reconnect and verify device is ready
      await connect(currentWalletType, deviceId);

      // After reconnection, verify device is ready
      if (!abortSignal?.aborted && adapterRef.current?.isConnected()) {
        const adapter = adapterRef.current;
        if (adapter.verifyDeviceReady) {
          try {
            await adapter.verifyDeviceReady();
            setConnectionState(ConnectionState.ready());
          } catch (err) {
            // Verification failed, let error handler deal with it
            if (err && typeof err === 'object' && 'code' in err) {
              setConnectionState(
                getConnectionStateFromError(
                  err as unknown as HardwareWalletError,
                ),
              );
            }
          }
        }
        // Note: If no verifyDeviceReady method, stay in CONNECTED state
        // Don't assume READY without verification
      }
    }
  }, [connect, deviceId, isHardwareWalletAccount, walletType]);

  const checkWebHidPermissionAction =
    useCallback(async (): Promise<WebHIDPermissionState> => {
      if (!isHardwareWalletAccount || !isWebHidAvailableState) {
        return WebHIDPermissionState.DENIED;
      }

      const state = await checkWebHIDPermission();
      setWebHidPermissionState(state);
      return state;
    }, [isHardwareWalletAccount, isWebHidAvailableState]);

  const requestWebHidPermissionAction =
    useCallback(async (): Promise<boolean> => {
      if (!isHardwareWalletAccount || !isWebHidAvailableState) {
        return false;
      }

      const granted = await requestWebHIDPermission();
      if (granted) {
        setWebHidPermissionState(WebHIDPermissionState.GRANTED);
      } else {
        setWebHidPermissionState(WebHIDPermissionState.DENIED);
      }
      return granted;
    }, [isHardwareWalletAccount, isWebHidAvailableState]);

  const ensureDeviceReady = useCallback(async (): Promise<boolean> => {
    const abortSignal = abortControllerRef.current?.signal;

    console.log(LOG_TAG, 'ensureDeviceReady called');

    if (!isHardwareWalletAccount) {
      console.log(LOG_TAG, 'Not a hardware wallet account, returning true');
      return true; // Non-hardware wallet accounts are always ready
    }

    if (abortSignal?.aborted) {
      throw new Error('Operation aborted');
    }

    const adapter = adapterRef.current;
    console.log(LOG_TAG, 'Adapter exists:', Boolean(adapter));
    console.log(LOG_TAG, 'Adapter connected:', adapter?.isConnected());

    // Check if already connected
    if (adapter?.isConnected()) {
      // Use adapter-specific verification if available (e.g., Ledger's app check)
      // verifyDeviceReady will throw native HardwareWalletError from KeyringController if not ready
      if (adapter.verifyDeviceReady) {
        console.log(LOG_TAG, 'Calling adapter.verifyDeviceReady');
        await adapter.verifyDeviceReady();
        console.log(LOG_TAG, 'adapter.verifyDeviceReady succeeded');
      }
      // Set to ready after verification (or if no verification needed)
      if (!abortSignal?.aborted) {
        setConnectionState(ConnectionState.ready());
      }
      return true;
    }

    // Try to connect
    if (deviceId && detectedWalletType) {
      console.log(LOG_TAG, 'Connecting to device:', deviceId);
      await connect(detectedWalletType, deviceId);

      // After connection, verify device is ready
      if (!abortSignal?.aborted) {
        if (adapter?.verifyDeviceReady) {
          console.log(
            LOG_TAG,
            'Calling adapter.verifyDeviceReady after connect',
          );
          // Will throw if not ready (e.g., wrong app, locked device)
          await adapter.verifyDeviceReady();
          console.log(
            LOG_TAG,
            'adapter.verifyDeviceReady succeeded after connect',
          );
        }
        setConnectionState(ConnectionState.ready());
      }
      return true;
    }

    // No device found
    console.log(LOG_TAG, 'No device found');
    throw new Error('Hardware wallet device not found');
  }, [isHardwareWalletAccount, connect, deviceId, detectedWalletType]);

  // ============================================================================
  // SECTION 9: Context Value
  // ============================================================================

  const contextValue = useMemo<HardwareWalletContextType>(
    () => ({
      isHardwareWalletAccount,
      detectedWalletType,
      walletType,
      connectionState,
      deviceId,
      webHidPermissionState,
      isWebHidAvailable: isWebHidAvailableState,
      currentAppName,
      connect,
      disconnect,
      executeWithWallet,
      clearError,
      retry,
      checkWebHidPermission: checkWebHidPermissionAction,
      requestWebHidPermission: requestWebHidPermissionAction,
      ensureDeviceReady,
    }),
    [
      isHardwareWalletAccount,
      detectedWalletType,
      walletType,
      connectionState,
      deviceId,
      webHidPermissionState,
      isWebHidAvailableState,
      currentAppName,
      connect,
      disconnect,
      executeWithWallet,
      clearError,
      retry,
      checkWebHidPermissionAction,
      requestWebHidPermissionAction,
      ensureDeviceReady,
    ],
  );

  console.log('[HardwareWalletProvider] contextValue:', contextValue);

  return (
    <HardwareWalletContext.Provider value={contextValue}>
      {children}
    </HardwareWalletContext.Provider>
  );
};
