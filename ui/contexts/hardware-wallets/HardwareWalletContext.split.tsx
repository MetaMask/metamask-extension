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
  createHardwareWalletError,
  ErrorCode,
  type HardwareWalletError,
} from './errors';
import {
  ConnectionStatus,
  DeviceEvent,
  HardwareWalletType,
  HardwareConnectionPermissionState,
  type HardwareWalletAdapter,
  type HardwareWalletAdapterOptions,
  type HardwareWalletConnectionState,
  type DeviceEventPayload,
} from './types';
import {
  checkHardwareWalletPermission,
  getHardwareWalletDeviceId,
  requestHardwareWalletPermission,
  isWebHIDAvailable,
  isWebUSBAvailable,
  subscribeToWebHIDEvents,
  subscribeToWebUSBEvents,
} from './webHIDUtils';
import { TrezorAdapter } from './adapters';

const LOG_TAG = '[HardwareWalletContext.Split]';

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
  hardwareConnectionPermissionState: HardwareConnectionPermissionState;
  isWebHidAvailable: boolean;
  isWebUsbAvailable: boolean;
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
  connect: (type: HardwareWalletType, id?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  clearError: () => void;
  checkHardwareWalletPermission: (
    walletType: HardwareWalletType,
  ) => Promise<HardwareConnectionPermissionState>;
  requestHardwareWalletPermission: (
    walletType: HardwareWalletType,
  ) => Promise<boolean>;
  ensureDeviceReady: (deviceId: string) => Promise<boolean>;
};

const HardwareWalletConfigContext =
  createContext<HardwareWalletConfigContextType | null>(null);

const HardwareWalletStateContext =
  createContext<HardwareWalletStateContextType | null>(null);

const HardwareWalletActionsContext =
  createContext<HardwareWalletActionsContextType | null>(null);

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
      return HardwareWalletType.Ledger;
    case KeyringTypes.trezor:
      return HardwareWalletType.Trezor;
    default:
      return null;
  }
}

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

export const HardwareWalletProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const accountInfo = useSelector(selectAccountHardwareInfo, shallowEqual);

  const detectedWalletType = useMemo(
    () => keyringTypeToHardwareWalletType(accountInfo.keyringType),
    [accountInfo.keyringType],
  );

  const isHardwareWalletAccount = useMemo(
    () => detectedWalletType !== null,
    [detectedWalletType],
  );

  const accountAddress = accountInfo.address;

  const [walletType, setWalletType] = useState<HardwareWalletType | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [
    hardwareConnectionPermissionState,
    setHardwareConnectionPermissionState,
  ] = useState<HardwareConnectionPermissionState>(
    HardwareConnectionPermissionState.Unknown,
  );
  const [currentAppName, setCurrentAppName] = useState<string | null>(null);

  const [connectionState, setConnectionState] =
    useState<HardwareWalletConnectionState>(ConnectionState.disconnected());

  const isWebHidAvailableState = useMemo(() => isWebHIDAvailable(), []);
  const isWebUsbAvailableState = useMemo(() => isWebUSBAvailable(), []);

  const adapterRef = useRef<HardwareWalletAdapter | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isConnectingRef = useRef(false);
  const hasAutoConnectedRef = useRef(false);
  const lastConnectedAccountRef = useRef<string | null>(null);
  const currentConnectionIdRef = useRef<number | null>(null);
  const connectRef =
    useRef<(type: HardwareWalletType, id?: string) => Promise<void>>();

  const walletTypeRef = useRef<HardwareWalletType | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const detectedWalletTypeRef = useRef<HardwareWalletType | null>(null);

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
    [],
  );

  const handleDeviceEvent = useCallback(
    (payload: DeviceEventPayload) => {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.log(LOG_TAG, 'Device event:', payload.event);

      switch (payload.event) {
        case DeviceEvent.Disconnected:
          if (!isConnectingRef.current) {
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
          setCurrentAppName(payload.currentAppName || null);
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
      isConnectingRef.current = false;
      currentConnectionIdRef.current = null;
      hasAutoConnectedRef.current = false;
      lastConnectedAccountRef.current = null;
    }
  }, [isHardwareWalletAccount, updateConnectionState]);

  // Reset wallet type when switching between different hardware wallet accounts
  useEffect(() => {
    if (isHardwareWalletAccount && detectedWalletType && walletType) {
      if (detectedWalletType !== walletType && adapterRef.current) {
        console.log(
          LOG_TAG,
          `Wallet type changed from ${walletType} to ${detectedWalletType}, disconnecting`,
        );
        // Disconnect from the current wallet type before switching
        adapterRef.current.destroy();
        adapterRef.current = null;
        updateConnectionState(ConnectionState.disconnected());
        setWalletType(null);
        setDeviceId(null);
        setCurrentAppName(null);
        isConnectingRef.current = false;
        currentConnectionIdRef.current = null;
        hasAutoConnectedRef.current = false;
        lastConnectedAccountRef.current = null;
      }
    }
  }, [
    isHardwareWalletAccount,
    detectedWalletType,
    walletType,
    updateConnectionState,
  ]);

  useEffect(() => {
    if (
      isHardwareWalletAccount &&
      detectedWalletType &&
      (isWebHidAvailableState || isWebUsbAvailableState)
    ) {
      checkHardwareWalletPermission(detectedWalletType).then((state) => {
        if (!abortControllerRef.current?.signal.aborted) {
          setHardwareConnectionPermissionState(state);
        }
      });
    }
  }, [
    isHardwareWalletAccount,
    detectedWalletType,
    isWebHidAvailableState,
    isWebUsbAvailableState,
  ]);

  // Subscribe to WebHID/WebUSB events based on wallet type
  useEffect(() => {
    if (!isHardwareWalletAccount || !detectedWalletType) {
      return undefined;
    }

    const isLedger = detectedWalletType === HardwareWalletType.Ledger;
    const isTrezor = detectedWalletType === HardwareWalletType.Trezor;

    if (
      (isLedger && !isWebHidAvailableState) ||
      (isTrezor && !isWebUsbAvailableState)
    ) {
      return undefined;
    }

    const abortSignal = abortControllerRef.current?.signal;

    const handleNativeConnect = async (device: HIDDevice | USBDevice) => {
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

      // Re-check permission state when device connects, as it may have changed
      // (e.g., from PROMPT when device was disconnected to GRANTED when reconnected)
      const currentPermissionState =
        await checkHardwareWalletPermission(detectedWalletType);
      setHardwareConnectionPermissionState(currentPermissionState);

      if (
        detectedWalletType &&
        currentPermissionState === HardwareConnectionPermissionState.Granted &&
        !adapterRef.current?.isConnected() &&
        !isConnectingRef.current
      ) {
        connectRef.current?.(detectedWalletType, newDeviceId);
      }
    };

    const handleNativeDisconnect = async (device: HIDDevice | USBDevice) => {
      if (abortSignal?.aborted) {
        return;
      }

      const disconnectedDeviceId = device.productId.toString();
      if (deviceId === disconnectedDeviceId) {
        handleDisconnect();

        // Re-check permission state when device disconnects, as it may have changed
        // (e.g., from GRANTED when devices were paired to PROMPT when no devices remain)
        const currentPermissionState =
          await checkHardwareWalletPermission(detectedWalletType);
        setHardwareConnectionPermissionState(currentPermissionState);
      }
    };

    const unsubscribe = isLedger
      ? subscribeToWebHIDEvents(handleNativeConnect, handleNativeDisconnect)
      : subscribeToWebUSBEvents(handleNativeConnect, handleNativeDisconnect);

    return unsubscribe;
  }, [
    isHardwareWalletAccount,
    detectedWalletType,
    isWebHidAvailableState,
    isWebUsbAvailableState,
    hardwareConnectionPermissionState,
    deviceId,
    handleDisconnect,
  ]);

  const connect = useCallback(
    async (type: HardwareWalletType, id?: string): Promise<void> => {
      const abortSignal = abortControllerRef.current?.signal;

      // Set wallet type immediately so error modals can display the correct wallet type
      setWalletType(type);

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

      // If device ID is not provided, try to find the device
      let discoveredDeviceId = id;
      if (!discoveredDeviceId) {
        console.log(
          LOG_TAG,
          `Device ID not provided, attempting to discover ${type} device`,
        );
        try {
          const discoveredId = await getHardwareWalletDeviceId(type);
          if (!discoveredId) {
            console.log(LOG_TAG, 'No hardware wallet device found');
            console.log(
              '[HardwareWalletContext] Creating error for no device found',
            );
            const error = createHardwareWalletError(
              ErrorCode.DEVICE_STATE_003,
              type,
              `No ${type} device found. Please ensure your device is connected and unlocked.`,
            );
            console.log(
              '[HardwareWalletContext] Created error:',
              error.code,
              error.userActionable,
            );
            updateConnectionState(getConnectionStateFromError(error));
            isConnectingRef.current = false;
            return;
          }
          discoveredDeviceId = discoveredId;
          console.log(LOG_TAG, `Discovered device ID: ${discoveredDeviceId}`);
        } catch (error) {
          console.error(LOG_TAG, 'Failed to discover device:', error);
          updateConnectionState(
            getConnectionStateFromError(
              createHardwareWalletError(
                ErrorCode.CONN_CLOSED_001,
                type,
                `Failed to discover ${type} device: ${error instanceof Error ? error.message : String(error)}`,
                { cause: error instanceof Error ? error : undefined },
              ),
            ),
          );
          isConnectingRef.current = false;
          return;
        }
      }

      console.log(
        LOG_TAG,
        `Connecting to ${type} device: ${discoveredDeviceId} (ID: ${connectionId})`,
      );

      if (!abortSignal?.aborted) {
        setDeviceId(discoveredDeviceId);
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
          case HardwareWalletType.Ledger:
            adapter = new LedgerAdapter(adapterOptions);
            break;
          case HardwareWalletType.Trezor:
            adapter = new TrezorAdapter(adapterOptions);
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
        await adapter.connect(discoveredDeviceId);

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

    (detectedWalletType
      ? getHardwareWalletDeviceId(detectedWalletType)
      : Promise.resolve(null)
    )
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
          hardwareConnectionPermissionState ===
            HardwareConnectionPermissionState.Granted
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
    hardwareConnectionPermissionState,
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
    }
  }, [updateConnectionState]);

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

  const checkHardwareWalletPermissionAction = useCallback(
    async (
      targetWalletType: HardwareWalletType,
    ): Promise<HardwareConnectionPermissionState> => {
      const isLedger = targetWalletType === HardwareWalletType.Ledger;
      const isTrezor = targetWalletType === HardwareWalletType.Trezor;

      if (
        (isLedger && !isWebHidAvailableState) ||
        (isTrezor && !isWebUsbAvailableState)
      ) {
        return HardwareConnectionPermissionState.Denied;
      }

      const state = await checkHardwareWalletPermission(targetWalletType);
      setHardwareConnectionPermissionState(state);
      return state;
    },
    [isWebHidAvailableState, isWebUsbAvailableState],
  );

  const requestHardwareWalletPermissionAction = useCallback(
    async (targetWalletType: HardwareWalletType): Promise<boolean> => {
      const isLedger = targetWalletType === HardwareWalletType.Ledger;
      const isTrezor = targetWalletType === HardwareWalletType.Trezor;

      if (
        (isLedger && !isWebHidAvailableState) ||
        (isTrezor && !isWebUsbAvailableState)
      ) {
        return false;
      }

      const granted = await requestHardwareWalletPermission(targetWalletType);
      if (granted) {
        setHardwareConnectionPermissionState(
          HardwareConnectionPermissionState.Granted,
        );
      } else {
        setHardwareConnectionPermissionState(
          HardwareConnectionPermissionState.Denied,
        );
      }
      return granted;
    },
    [isWebHidAvailableState, isWebUsbAvailableState],
  );

  const ensureDeviceReady = useCallback(
    async (targetDeviceId?: string): Promise<boolean> => {
      const effectiveDeviceId = targetDeviceId || deviceId;
      const abortSignal = abortControllerRef.current?.signal;

      if (abortSignal?.aborted) {
        console.log(LOG_TAG, 'ensureDeviceReady aborted');
        return false;
      }

      const adapter = adapterRef.current;

      // If not connected, try to connect first
      if (!adapter?.isConnected()) {
        console.log(LOG_TAG, 'Device not connected, attempting connection');
        const currentDetectedWalletType = detectedWalletTypeRef.current;

        if (!currentDetectedWalletType) {
          return false;
        }

        try {
          await connect(
            currentDetectedWalletType,
            effectiveDeviceId ?? undefined,
          );
        } catch (error) {
          // Error state already set by connect/adapter via device events
          // HardwareWalletErrorMonitor will show modal automatically
          console.error(
            LOG_TAG,
            'Connection failed in ensureDeviceReady:',
            error,
          );
          return false;
        }
      }

      if (!abortSignal?.aborted) {
        if (adapter?.verifyDeviceReady && effectiveDeviceId) {
          try {
            const result = await adapter.verifyDeviceReady(effectiveDeviceId);
            console.log(LOG_TAG, 'ensureDeviceReady result:', result);
            if (result) {
              updateConnectionState(ConnectionState.ready());
            }
            return result;
          } catch (error) {
            // Error state already set via onDeviceEvent in adapter
            // HardwareWalletErrorMonitor will show modal automatically
            console.error(LOG_TAG, 'verifyDeviceReady failed:', error);
            return false;
          }
        }
      }

      return false;
    },
    [connect, updateConnectionState, deviceId],
  );

  // Memoized context values
  const configValue = useMemo<HardwareWalletConfigContextType>(
    () => ({
      isHardwareWalletAccount,
      detectedWalletType,
      walletType,
      deviceId,
      hardwareConnectionPermissionState,
      isWebHidAvailable: isWebHidAvailableState,
      isWebUsbAvailable: isWebUsbAvailableState,
      currentAppName,
    }),
    [
      isHardwareWalletAccount,
      detectedWalletType,
      walletType,
      deviceId,
      hardwareConnectionPermissionState,
      isWebHidAvailableState,
      isWebUsbAvailableState,
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
      checkHardwareWalletPermission: checkHardwareWalletPermissionAction,
      requestHardwareWalletPermission: requestHardwareWalletPermissionAction,
      ensureDeviceReady,
    }),
    [
      connect,
      disconnect,
      clearError,
      checkHardwareWalletPermissionAction,
      requestHardwareWalletPermissionAction,
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
