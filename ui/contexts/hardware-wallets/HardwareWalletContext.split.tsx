/**
 * Hardware Wallet Context - Split Context Implementation
 *
 * Splits the context into three separate contexts to prevent unnecessary rerenders:
 * 1. Config Context - Rarely changes (wallet type, device ID, permissions)
 * 2. State Context - Frequently changes (connection state)
 * 3. Actions Context - Stable callbacks (connect, disconnect, etc.)
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { KeyringTypes } from '@metamask/keyring-controller';
import { getSelectedInternalAccount } from '../../selectors/accounts';
import { ConnectionState } from './connectionState';
import { LedgerAdapter } from './adapters/LedgerAdapter';
import {
  getConnectionStateFromError,
  type HardwareWalletError,
} from './errors';
import {
  ConnectionStatus,
  DeviceEvent,
  HardwareWalletType,
  WebHIDPermissionState,
  type HardwareWalletAdapter,
  type HardwareWalletAdapterOptions,
  type HardwareWalletConnectionState,
  type DeviceEventPayload,
} from './types';
import {
  checkWebHIDPermission,
  getDeviceId,
  requestWebHIDPermission,
  isWebHIDAvailable,
  subscribeToWebHIDEvents,
} from './webHIDUtils';

const LOG_TAG = '[HardwareWalletContext.Split]';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Config context - rarely changes
 * Components that only need wallet info can subscribe to this without
 * rerendering on every connection state change
 */
export type HardwareWalletConfigContextType = {
  isHardwareWalletAccount: boolean;
  detectedWalletType: HardwareWalletType | null;
  walletType: HardwareWalletType | null;
  deviceId: string | null;
  webHidPermissionState: WebHIDPermissionState;
  isWebHidAvailable: boolean;
  currentAppName: string | null;
};

/**
 * State context - frequently changes
 * Only components that need real-time connection status should subscribe
 */
export type HardwareWalletStateContextType = {
  connectionState: HardwareWalletConnectionState;
};

/**
 * Actions context - stable callbacks
 * These never change, so components subscribing only to actions never rerender
 */
export type HardwareWalletActionsContextType = {
  connect: (type: HardwareWalletType, id: string) => Promise<void>;
  disconnect: () => Promise<void>;
  clearError: () => void;
  retry: () => Promise<void>;
  checkWebHidPermission: () => Promise<WebHIDPermissionState>;
  requestWebHidPermission: () => Promise<boolean>;
  ensureDeviceReady: () => Promise<boolean>;
};

// ============================================================================
// CONTEXTS
// ============================================================================

const HardwareWalletConfigContext =
  createContext<HardwareWalletConfigContextType | null>(null);

const HardwareWalletStateContext =
  createContext<HardwareWalletStateContextType | null>(null);

const HardwareWalletActionsContext =
  createContext<HardwareWalletActionsContextType | null>(null);

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to access hardware wallet config (rarely changes)
 * Use this when you need wallet type, device ID, permissions, etc.
 * This hook will NOT cause rerenders when connection state changes.
 */
export const useHardwareWalletConfig = (): HardwareWalletConfigContextType => {
  const context = useContext(HardwareWalletConfigContext);
  if (!context) {
    throw new Error(
      'useHardwareWalletConfig must be used within HardwareWalletProvider',
    );
  }
  return context;
};

/**
 * Hook to access hardware wallet state (frequently changes)
 * Use this when you need connection state updates.
 * This hook WILL cause rerenders when connection state changes.
 */
export const useHardwareWalletState = (): HardwareWalletStateContextType => {
  const context = useContext(HardwareWalletStateContext);
  if (!context) {
    throw new Error(
      'useHardwareWalletState must be used within HardwareWalletProvider',
    );
  }
  return context;
};

/**
 * Hook to access hardware wallet actions (stable callbacks)
 * Use this when you need to perform actions like connect/disconnect.
 * This hook will NEVER cause rerenders (actions are stable).
 */
export const useHardwareWalletActions =
  (): HardwareWalletActionsContextType => {
    const context = useContext(HardwareWalletActionsContext);
    if (!context) {
      throw new Error(
        'useHardwareWalletActions must be used within HardwareWalletProvider',
      );
    }
    return context;
  };

/**
 * Convenience hook that combines all contexts
 * Use this for backward compatibility or when you truly need everything.
 * NOTE: This will cause rerenders on ALL context changes.
 */
export const useHardwareWallet = () => {
  const config = useHardwareWalletConfig();
  const state = useHardwareWalletState();
  const actions = useHardwareWalletActions();

  return {
    ...config,
    ...state,
    ...actions,
  };
};

// ============================================================================
// HELPERS
// ============================================================================

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

function keyringTypeToHardwareWalletType(
  keyringType?: string,
): HardwareWalletType | null {
  if (!keyringType) {
    return null;
  }

  switch (keyringType) {
    case KeyringTypes.ledger:
      return HardwareWalletType.LEDGER;
    default:
      return null;
  }
}

// ============================================================================
// SELECTORS
// ============================================================================

/**
 * Selector that extracts only the account data we need for hardware wallet detection.
 * This prevents re-renders when other account properties change.
 *
 * @param state - Redux state object
 * @returns Account hardware info with keyring type and address
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function selectAccountHardwareInfo(state: any) {
  const account = getSelectedInternalAccount(state);
  return {
    keyringType: account?.metadata?.keyring?.type ?? null,
    address: account?.address ?? null,
  };
}

// ============================================================================
// PROVIDER
// ============================================================================

export const HardwareWalletProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Account detection - use a custom selector that only extracts what we need
  // and shallowEqual to prevent re-renders when values haven't changed
  const accountInfo = useSelector(selectAccountHardwareInfo, shallowEqual);

  // Memoize derived values to prevent provider re-renders
  const detectedWalletType = useMemo(
    () => keyringTypeToHardwareWalletType(accountInfo.keyringType),
    [accountInfo.keyringType],
  );

  const isHardwareWalletAccount = useMemo(
    () => detectedWalletType !== null,
    [detectedWalletType],
  );

  const accountAddress = accountInfo.address;

  // Config state (rarely changes)
  const [walletType, setWalletType] = useState<HardwareWalletType | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [webHidPermissionState, setWebHidPermissionState] =
    useState<WebHIDPermissionState>(WebHIDPermissionState.UNKNOWN);
  const [currentAppName, setCurrentAppName] = useState<string | null>(null);

  // State (frequently changes)
  const [connectionState, setConnectionState] =
    useState<HardwareWalletConnectionState>(ConnectionState.disconnected());

  // Memoize isWebHidAvailable to prevent unnecessary rerenders
  const isWebHidAvailableState = useMemo(() => isWebHIDAvailable(), []);

  // Refs for internal state (NOT for avoiding dependencies - only for imperative code)
  const adapterRef = useRef<HardwareWalletAdapter | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingOperationRef = useRef<(() => Promise<unknown>) | null>(null);
  const isConnectingRef = useRef(false);
  const hasAutoConnectedRef = useRef(false);
  const lastConnectedAccountRef = useRef<string | null>(null);
  const currentConnectionIdRef = useRef<number | null>(null);
  const connectRef =
    useRef<(type: HardwareWalletType, id: string) => Promise<void>>();

  // Refs for state values used in callbacks to keep callbacks stable
  const walletTypeRef = useRef<HardwareWalletType | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const detectedWalletTypeRef = useRef<HardwareWalletType | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    walletTypeRef.current = walletType;
  }, [walletType]);

  useEffect(() => {
    deviceIdRef.current = deviceId;
  }, [deviceId]);

  useEffect(() => {
    detectedWalletTypeRef.current = detectedWalletType;
  }, [detectedWalletType]);

  const updateConnectionState = useCallback(
    (newState: HardwareWalletConnectionState) => {
      setConnectionState((prev) => {
        if (prev.status !== newState.status) {
          return newState;
        }

        if (
          newState.status === ConnectionStatus.ERROR &&
          prev.status === ConnectionStatus.ERROR
        ) {
          if (
            prev.reason !== newState.reason ||
            prev.error?.message !== newState.error?.message
          ) {
            return newState;
          }
        }

        if (
          newState.status === ConnectionStatus.AWAITING_APP &&
          prev.status === ConnectionStatus.AWAITING_APP
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
    [],
  );

  // Event handlers
  const handleDeviceEvent = useCallback(
    (payload: DeviceEventPayload) => {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.log(LOG_TAG, 'Device event:', payload.event);

      switch (payload.event) {
        case DeviceEvent.DISCONNECTED:
          if (!isConnectingRef.current) {
            updateConnectionState(ConnectionState.disconnected());
          }
          break;

        case DeviceEvent.DEVICE_LOCKED:
          updateConnectionState(
            ConnectionState.error('locked', payload.error as Error),
          );
          break;

        case DeviceEvent.APP_NOT_OPEN:
          updateConnectionState(ConnectionState.awaitingApp('not_open'));
          break;

        case DeviceEvent.APP_CHANGED:
          setCurrentAppName(payload.currentAppName || null);
          if (payload.currentAppName) {
            updateConnectionState(
              ConnectionState.awaitingApp('wrong_app', payload.currentAppName),
            );
          }
          break;

        case DeviceEvent.CONNECTION_FAILED:
          if (payload.error) {
            updateConnectionState(
              ConnectionState.error('connection_failed', payload.error),
            );
          }
          break;

        default:
          break;
      }
    },
    [updateConnectionState],
  );

  const handleDisconnect = useCallback(
    (disconnectError?: unknown) => {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      if (isConnectingRef.current) {
        return;
      }

      adapterRef.current = null;
      isConnectingRef.current = false;
      currentConnectionIdRef.current = null;

      if (
        disconnectError &&
        typeof disconnectError === 'object' &&
        'code' in disconnectError
      ) {
        updateConnectionState(
          getConnectionStateFromError(
            disconnectError as unknown as HardwareWalletError,
          ),
        );
      } else {
        updateConnectionState(ConnectionState.disconnected());
      }
    },
    [updateConnectionState],
  );

  // Lifecycle effects
  useEffect(() => {
    abortControllerRef.current = new AbortController();
    return () => {
      abortControllerRef.current?.abort();
      adapterRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!isHardwareWalletAccount && adapterRef.current) {
      adapterRef.current.destroy();
      adapterRef.current = null;
      updateConnectionState(ConnectionState.disconnected());
      setWalletType(null);
      setDeviceId(null);
      setCurrentAppName(null);
      pendingOperationRef.current = null;
      isConnectingRef.current = false;
      currentConnectionIdRef.current = null;
      hasAutoConnectedRef.current = false;
      lastConnectedAccountRef.current = null;
    }
  }, [isHardwareWalletAccount, updateConnectionState]);

  useEffect(() => {
    if (isHardwareWalletAccount && isWebHidAvailableState) {
      checkWebHIDPermission().then((state) => {
        if (!abortControllerRef.current?.signal.aborted) {
          setWebHidPermissionState(state);
        }
      });
    }
  }, [isHardwareWalletAccount, isWebHidAvailableState]);

  // Subscribe to WebHID events
  useEffect(() => {
    if (!isHardwareWalletAccount || !isWebHidAvailableState) {
      return undefined;
    }

    const abortSignal = abortControllerRef.current?.signal;

    const handleNativeConnect = (device: HIDDevice) => {
      console.log(
        LOG_TAG,
        'Native connect event for device:',
        device.productId,
      );
      if (abortSignal?.aborted) {
        return;
      }

      const newDeviceId = device.productId.toString();
      setDeviceId((prevId) => (prevId === newDeviceId ? prevId : newDeviceId));

      if (
        detectedWalletType &&
        webHidPermissionState === WebHIDPermissionState.GRANTED &&
        !adapterRef.current?.isConnected() &&
        !isConnectingRef.current
      ) {
        connectRef.current?.(detectedWalletType, newDeviceId);
      }
    };

    const handleNativeDisconnect = (device: HIDDevice) => {
      if (abortSignal?.aborted) {
        return;
      }

      const disconnectedDeviceId = device.productId.toString();
      if (deviceId === disconnectedDeviceId) {
        handleDisconnect();
      }
    };

    const unsubscribe = subscribeToWebHIDEvents(
      handleNativeConnect,
      handleNativeDisconnect,
    );

    return unsubscribe;
  }, [
    isHardwareWalletAccount,
    isWebHidAvailableState,
    detectedWalletType,
    webHidPermissionState,
    deviceId,
    handleDisconnect,
  ]);

  // Actions - stable callbacks with NO state dependencies
  // This is the key: actions don't depend on state, so they never recreate
  const connect = useCallback(
    async (type: HardwareWalletType, id: string): Promise<void> => {
      const abortSignal = abortControllerRef.current?.signal;

      // Cancel any in-flight connection attempt
      if (isConnectingRef.current) {
        console.log(LOG_TAG, 'Cancelling previous connection attempt');
        adapterRef.current?.destroy();
        adapterRef.current = null;
      }

      // Always destroy existing adapter to ensure clean slate
      // This prevents issues with stale state, hung promises, or device state mismatches
      if (adapterRef.current) {
        console.log(
          LOG_TAG,
          'Destroying existing adapter for fresh connection',
        );
        adapterRef.current.destroy();
        adapterRef.current = null;
      }

      // Create a unique ID for this connection attempt
      const connectionId = Date.now();
      currentConnectionIdRef.current = connectionId;
      isConnectingRef.current = true;

      console.log(
        LOG_TAG,
        `Connecting to ${type} device: ${id} (ID: ${connectionId})`,
      );

      if (!abortSignal?.aborted) {
        setWalletType(type);
        setDeviceId(id);
        updateConnectionState(ConnectionState.connecting());
      }

      try {
        // Verify this is still the latest connection attempt
        if (currentConnectionIdRef.current !== connectionId) {
          console.log(LOG_TAG, 'Connection superseded by newer attempt');
          return;
        }

        const adapterOptions: HardwareWalletAdapterOptions = {
          onDisconnect: handleDisconnect,
          onAwaitingConfirmation: () => {
            if (
              !abortSignal?.aborted &&
              currentConnectionIdRef.current === connectionId
            ) {
              updateConnectionState(ConnectionState.awaitingConfirmation());
            }
          },
          onDeviceLocked: () => {
            if (
              !abortSignal?.aborted &&
              currentConnectionIdRef.current === connectionId
            ) {
              updateConnectionState(
                ConnectionState.error('locked', new Error('Device is locked')),
              );
            }
          },
          onAppNotOpen: () => {
            if (
              !abortSignal?.aborted &&
              currentConnectionIdRef.current === connectionId
            ) {
              updateConnectionState(ConnectionState.awaitingApp('not_open'));
            }
          },
          onDeviceEvent: handleDeviceEvent,
        };

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

        // Verify this is still the latest connection attempt
        if (currentConnectionIdRef.current !== connectionId) {
          console.log(LOG_TAG, 'Connection superseded before adapter.connect');
          adapter.destroy();
          return;
        }

        adapterRef.current = adapter;
        await adapter.connect(id);

        // Verify this is still the latest connection attempt after async operation
        if (currentConnectionIdRef.current !== connectionId) {
          console.log(LOG_TAG, 'Connection superseded after adapter.connect');
          adapter.destroy();
          adapterRef.current = null;
          return;
        }

        if (!abortSignal?.aborted) {
          updateConnectionState(ConnectionState.connected());
        }
      } catch (err) {
        console.error(LOG_TAG, 'Connection error:', err);

        // Only update state if this is still the latest connection attempt
        if (currentConnectionIdRef.current !== connectionId) {
          console.log(LOG_TAG, 'Ignoring error from superseded connection');
          return;
        }

        if (!abortSignal?.aborted) {
          if (err && typeof err === 'object' && 'code' in err) {
            updateConnectionState(
              getConnectionStateFromError(
                err as unknown as HardwareWalletError,
              ),
            );
          } else {
            const fallbackError = isError(err)
              ? err
              : new Error('Failed to connect to hardware wallet');
            updateConnectionState(
              ConnectionState.error('connection_failed', fallbackError),
            );
          }
        }

        adapterRef.current?.destroy();
        adapterRef.current = null;
      } finally {
        // Only clear connecting flag if this is still the latest connection attempt
        if (currentConnectionIdRef.current === connectionId) {
          isConnectingRef.current = false;
        }
      }
    },
    [handleDeviceEvent, handleDisconnect, updateConnectionState],
  );

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // Auto-connection
  useEffect(() => {
    if (!isHardwareWalletAccount) {
      hasAutoConnectedRef.current = false;
      lastConnectedAccountRef.current = null;
      return;
    }

    const abortSignal = abortControllerRef.current?.signal;

    const shouldSkipAutoConnect =
      hasAutoConnectedRef.current &&
      lastConnectedAccountRef.current === accountAddress;
    if (shouldSkipAutoConnect) {
      return;
    }

    getDeviceId()
      .then(async (id) => {
        if (abortSignal?.aborted) {
          return;
        }

        setDeviceId((prevId) => (prevId === id ? prevId : id));

        if (
          detectedWalletType &&
          id &&
          !adapterRef.current?.isConnected() &&
          !isConnectingRef.current &&
          !hasAutoConnectedRef.current &&
          webHidPermissionState === WebHIDPermissionState.GRANTED
        ) {
          hasAutoConnectedRef.current = true;
          lastConnectedAccountRef.current = accountAddress ?? null;
          // Await connection to ensure state updates to 'connected'
          await connectRef.current?.(detectedWalletType, id);
          console.log(LOG_TAG, 'Auto-connection completed');
        }
      })
      .catch((error: unknown) => {
        const errorMessage = isError(error) ? error.message : String(error);
        console.error(LOG_TAG, 'Error during auto-connection:', errorMessage);
      });
  }, [
    isHardwareWalletAccount,
    accountAddress,
    detectedWalletType,
    webHidPermissionState,
  ]);

  const disconnect = useCallback(async (): Promise<void> => {
    const abortSignal = abortControllerRef.current?.signal;

    if (abortSignal?.aborted) {
      return;
    }

    try {
      await adapterRef.current?.disconnect();
    } finally {
      adapterRef.current?.destroy();
      adapterRef.current = null;
      currentConnectionIdRef.current = null;
      isConnectingRef.current = false;
      if (!abortSignal?.aborted) {
        updateConnectionState(ConnectionState.disconnected());
        setWalletType(null);
        setDeviceId(null);
      }
      pendingOperationRef.current = null;
    }
  }, [updateConnectionState]);

  // const executeWithWallet = useCallback(
  //   async <TResult,>(
  //     operation: (adapter: HardwareWalletAdapter) => Promise<TResult>,
  //   ): Promise<TResult> => {
  //     const abortSignal = abortControllerRef.current?.signal;

  //     const adapter = adapterRef.current;
  //     if (!adapter) {
  //       throw new Error('No hardware wallet connected');
  //     }

  //     pendingOperationRef.current = () => operation(adapter);

  //     try {
  //       if (!abortSignal?.aborted) {
  //         updateConnectionState(ConnectionState.awaitingConfirmation());
  //       }

  //       adapter.setPendingOperation?.(true);
  //       const result = await operation(adapter);
  //       adapter.setPendingOperation?.(false);

  //       if (!abortSignal?.aborted) {
  //         updateConnectionState(ConnectionState.ready());
  //       }
  //       pendingOperationRef.current = null;

  //       return result;
  //     } catch (err) {
  //       adapter.setPendingOperation?.(false);

  //       // Destroy the adapter on error so it can be recreated on retry
  //       adapterRef.current?.destroy();
  //       adapterRef.current = null;
  //       pendingOperationRef.current = null;

  //       if (!abortSignal?.aborted) {
  //         if (err && typeof err === 'object' && 'code' in err) {
  //           updateConnectionState(
  //             getConnectionStateFromError(
  //               err as unknown as HardwareWalletError,
  //             ),
  //           );
  //         } else if (isError(err)) {
  //           updateConnectionState(
  //             ConnectionState.error('connection_failed', err),
  //           );
  //         } else {
  //           updateConnectionState(
  //             ConnectionState.error(
  //               'connection_failed',
  //               new Error('Unknown error during operation'),
  //             ),
  //           );
  //         }
  //       }
  //       throw err;
  //     }
  //   },
  //   [updateConnectionState],
  // );

  const clearError = useCallback(() => {
    if (abortControllerRef.current?.signal.aborted) {
      return;
    }

    if (adapterRef.current?.isConnected()) {
      updateConnectionState(ConnectionState.connected());
    } else {
      updateConnectionState(ConnectionState.disconnected());
    }
  }, [updateConnectionState]);

  const retry = useCallback(async (): Promise<void> => {
    const abortSignal = abortControllerRef.current?.signal;

    if (abortSignal?.aborted) {
      return;
    }

    if (pendingOperationRef.current && adapterRef.current?.isConnected()) {
      try {
        if (!abortSignal?.aborted) {
          updateConnectionState(ConnectionState.awaitingConfirmation());
        }
        await pendingOperationRef.current();
        if (!abortSignal?.aborted) {
          updateConnectionState(ConnectionState.ready());
        }
        pendingOperationRef.current = null;
      } catch (err) {
        if (!abortSignal?.aborted) {
          if (err && typeof err === 'object' && 'code' in err) {
            updateConnectionState(
              getConnectionStateFromError(
                err as unknown as HardwareWalletError,
              ),
            );
          } else {
            updateConnectionState(ConnectionState.disconnected());
          }
        }
      }
    } else {
      // Use refs to access current state values without creating dependencies
      const currentDeviceId = deviceIdRef.current;
      const currentWalletType = walletTypeRef.current;

      if (currentDeviceId && currentWalletType) {
        await connect(currentWalletType, currentDeviceId);

        if (!abortSignal?.aborted && adapterRef.current?.isConnected()) {
          const adapter = adapterRef.current;
          if (adapter.verifyDeviceReady && currentDeviceId) {
            try {
              const result = await adapter.verifyDeviceReady(currentDeviceId);

              console.log('ensureDeviceReady result', result);
              if (result) {
                updateConnectionState(ConnectionState.ready());
              } else {
                updateConnectionState(
                  ConnectionState.error(
                    'device_not_ready',
                    new Error('Device is not ready'),
                  ),
                );
              }
            } catch (err) {
              if (err && typeof err === 'object' && 'code' in err) {
                updateConnectionState(
                  getConnectionStateFromError(
                    err as unknown as HardwareWalletError,
                  ),
                );
              }
            }
          }
        }
      }
    }
  }, [connect, updateConnectionState]);

  const checkWebHidPermissionAction =
    useCallback(async (): Promise<WebHIDPermissionState> => {
      if (!isWebHidAvailableState) {
        return WebHIDPermissionState.DENIED;
      }

      const state = await checkWebHIDPermission();
      setWebHidPermissionState(state);
      return state;
    }, [isWebHidAvailableState]);

  const requestWebHidPermissionAction =
    useCallback(async (): Promise<boolean> => {
      if (!isWebHidAvailableState) {
        return false;
      }

      const granted = await requestWebHIDPermission();
      if (granted) {
        setWebHidPermissionState(WebHIDPermissionState.GRANTED);
      } else {
        setWebHidPermissionState(WebHIDPermissionState.DENIED);
      }
      return granted;
    }, [isWebHidAvailableState]);

  const ensureDeviceReady = useCallback(async (): Promise<void> => {
    const abortSignal = abortControllerRef.current?.signal;

    if (abortSignal?.aborted) {
      throw new Error('Operation aborted');
    }

    const adapter = adapterRef.current;

    // If not connected, try to connect first
    if (!adapter?.isConnected()) {
      console.log('is connected', adapter?.isConnected());
      // Use refs to access current state values without creating dependencies
      const currentDeviceId = deviceIdRef.current;
      const currentDetectedWalletType = detectedWalletTypeRef.current;

      if (!currentDeviceId || !currentDetectedWalletType) {
        updateConnectionState(
          ConnectionState.error(
            'connection_failed',
            new Error('Hardware wallet device not found'),
          ),
        );
        return;
      }

      await connect(currentDetectedWalletType, currentDeviceId);
    }

    // Common logic: verify device readiness and update connection state
    if (!abortSignal?.aborted) {
      const currentDeviceId = deviceIdRef.current;
      if (adapter?.verifyDeviceReady && currentDeviceId) {
        const result = await adapter.verifyDeviceReady(currentDeviceId);
        console.log('ensureDeviceReady result', result);
        if (result) {
          updateConnectionState(ConnectionState.ready());
        }
      }
    }
  }, [connect, updateConnectionState]);

  // Memoized context values
  const configValue = useMemo<HardwareWalletConfigContextType>(
    () => ({
      isHardwareWalletAccount,
      detectedWalletType,
      walletType,
      deviceId,
      webHidPermissionState,
      isWebHidAvailable: isWebHidAvailableState,
      currentAppName,
    }),
    [
      isHardwareWalletAccount,
      detectedWalletType,
      walletType,
      deviceId,
      webHidPermissionState,
      isWebHidAvailableState,
      currentAppName,
    ],
  );

  // Debug logging - only logs when values actually change
  useEffect(() => {
    console.log('[HardwareWalletProvider] Config changed:', configValue);
  }, [configValue]);

  const stateValue = useMemo<HardwareWalletStateContextType>(
    () => ({
      connectionState,
    }),
    [connectionState],
  );

  // Debug logging - only logs when values actually change
  useEffect(() => {
    console.log('[HardwareWalletProvider] State changed:', stateValue);
  }, [stateValue]);

  // Actions value is stable - these callbacks never change
  const actionsValue = useMemo<HardwareWalletActionsContextType>(
    () => ({
      connect,
      disconnect,
      clearError,
      retry,
      checkWebHidPermission: checkWebHidPermissionAction,
      requestWebHidPermission: requestWebHidPermissionAction,
      ensureDeviceReady,
    }),
    [
      connect,
      disconnect,
      clearError,
      retry,
      checkWebHidPermissionAction,
      requestWebHidPermissionAction,
      ensureDeviceReady,
    ],
  );

  return (
    <HardwareWalletConfigContext.Provider value={configValue}>
      <HardwareWalletStateContext.Provider value={stateValue}>
        <HardwareWalletActionsContext.Provider value={actionsValue}>
          {children}
        </HardwareWalletActionsContext.Provider>
      </HardwareWalletStateContext.Provider>
    </HardwareWalletConfigContext.Provider>
  );
};
