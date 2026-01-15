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
} from './webConnectionUtils';
import { TrezorAdapter } from './adapters';

const LOG_TAG = '[HardwareWalletContext.Split]';

/**
 * Config context - rarely changes
 * Components that only need wallet info can subscribe to this without
 * rerendering on every connection state change
 */
export type HardwareWalletConfigContextType = {
  isHardwareWalletAccount: boolean;
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
  /**
   * Connect to the currently selected hardware wallet account.
   *
   * Wallet type is derived from the selected account, and the device id is
   * taken from the latest known device (if any) or discovered.
   */
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  clearError: () => void;
  checkHardwareWalletPermission: (
    walletType: HardwareWalletType,
  ) => Promise<HardwareConnectionPermissionState>;
  requestHardwareWalletPermission: (
    walletType: HardwareWalletType,
  ) => Promise<boolean>;
  ensureDeviceReady: (deviceId?: string) => Promise<boolean>;
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

function isHardwareWalletErrorWithCode(
  error: unknown,
): error is HardwareWalletError {
  if (!error || typeof error !== 'object') {
    return false;
  }

  return Object.prototype.hasOwnProperty.call(error, 'code');
}

function createAdapterForHardwareWalletType(
  walletType: HardwareWalletType,
  adapterOptions: HardwareWalletAdapterOptions,
): HardwareWalletAdapter {
  switch (walletType) {
    case HardwareWalletType.Ledger:
      return new LedgerAdapter(adapterOptions);
    case HardwareWalletType.Trezor:
      return new TrezorAdapter(adapterOptions);
    default:
      throw new Error(
        `Unsupported hardware wallet type: ${String(walletType)}`,
      );
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

  const walletType = useMemo(
    () => keyringTypeToHardwareWalletType(accountInfo.keyringType),
    [accountInfo.keyringType],
  );

  const isHardwareWalletAccount = useMemo(
    () => walletType !== null,
    [walletType],
  );

  const accountAddress = accountInfo.address;

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
  const connectRef = useRef<() => Promise<void>>();

  const deviceIdRef = useRef<string | null>(null);

  useEffect(() => {
    deviceIdRef.current = deviceId;
  }, [deviceId]);

  const walletTypeRef = useRef<HardwareWalletType | null>(null);
  const previousWalletTypeRef = useRef<HardwareWalletType | null>(null);
  useEffect(() => {
    walletTypeRef.current = walletType;
  }, [walletType]);

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
      setDeviceId(null);
      setCurrentAppName(null);
      isConnectingRef.current = false;
      currentConnectionIdRef.current = null;
      hasAutoConnectedRef.current = false;
      lastConnectedAccountRef.current = null;
    }
  }, [isHardwareWalletAccount, updateConnectionState]);

  // Reset connection when switching between different hardware wallet account types
  useEffect(() => {
    if (!isHardwareWalletAccount) {
      previousWalletTypeRef.current = null;
      return;
    }

    const previousWalletType = previousWalletTypeRef.current;
    previousWalletTypeRef.current = walletType;

    if (
      isHardwareWalletAccount &&
      previousWalletType &&
      walletType &&
      previousWalletType !== walletType &&
      adapterRef.current
    ) {
      console.log(
        LOG_TAG,
        `Wallet type changed from ${previousWalletType} to ${walletType}, disconnecting`,
      );
      // Disconnect from the current wallet type before switching
      adapterRef.current.destroy();
      adapterRef.current = null;
      updateConnectionState(ConnectionState.disconnected());
      setDeviceId(null);
      setCurrentAppName(null);
      isConnectingRef.current = false;
      currentConnectionIdRef.current = null;
      hasAutoConnectedRef.current = false;
      lastConnectedAccountRef.current = null;
    }
  }, [isHardwareWalletAccount, walletType, updateConnectionState]);

  useEffect(() => {
    if (
      isHardwareWalletAccount &&
      walletType &&
      (isWebHidAvailableState || isWebUsbAvailableState)
    ) {
      checkHardwareWalletPermission(walletType)
        .then((state) => {
          if (!abortControllerRef.current?.signal.aborted) {
            setHardwareConnectionPermissionState(state);
          }
        })
        .catch((error: unknown) => {
          // Keep existing permission state when the check fails.
          // This avoids unhandled rejections and keeps UI stable.
          console.error(LOG_TAG, 'Permission check failed:', error);
        });
    }
  }, [
    isHardwareWalletAccount,
    walletType,
    isWebHidAvailableState,
    isWebUsbAvailableState,
  ]);

  // Subscribe to WebHID/WebUSB events based on wallet type
  useEffect(() => {
    if (!isHardwareWalletAccount || !walletType) {
      return undefined;
    }

    const isLedger = walletType === HardwareWalletType.Ledger;
    const isTrezor = walletType === HardwareWalletType.Trezor;

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
        await checkHardwareWalletPermission(walletType);
      setHardwareConnectionPermissionState(currentPermissionState);

      if (
        currentPermissionState === HardwareConnectionPermissionState.Granted &&
        !adapterRef.current?.isConnected() &&
        !isConnectingRef.current
      ) {
        deviceIdRef.current = newDeviceId;
        connectRef.current?.();
      }
    };

    const handleNativeDisconnect = async (device: HIDDevice | USBDevice) => {
      if (abortSignal?.aborted) {
        return;
      }

      const disconnectedDeviceId = device.productId.toString();
      if (deviceIdRef.current === disconnectedDeviceId) {
        handleDisconnect();

        // Re-check permission state when device disconnects, as it may have changed
        // (e.g., from GRANTED when devices were paired to PROMPT when no devices remain)
        const currentPermissionState =
          await checkHardwareWalletPermission(walletType);
        setHardwareConnectionPermissionState(currentPermissionState);
      }
    };

    const unsubscribe = isLedger
      ? subscribeToWebHIDEvents(handleNativeConnect, handleNativeDisconnect)
      : subscribeToWebUSBEvents(handleNativeConnect, handleNativeDisconnect);

    return unsubscribe;
  }, [
    isHardwareWalletAccount,
    walletType,
    isWebHidAvailableState,
    isWebUsbAvailableState,
    handleDisconnect,
  ]);

  type IsLatestAttempt = () => boolean;

  const resetAdapterForFreshConnection = useCallback(() => {
    // Ensure clean slate: cancel any in-flight attempt + destroy any existing adapter.
    // This prevents issues with stale state, hung promises, or device state mismatches.
    if (isConnectingRef.current || adapterRef.current) {
      console.log(LOG_TAG, 'Resetting existing adapter for fresh connection');
      adapterRef.current?.destroy();
      adapterRef.current = null;
    }
  }, []);

  const beginConnectionAttempt = useCallback(() => {
    const connectionId = Date.now();
    currentConnectionIdRef.current = connectionId;
    isConnectingRef.current = true;

    const isLatestAttempt: IsLatestAttempt = () =>
      currentConnectionIdRef.current === connectionId;

    return { connectionId, isLatestAttempt };
  }, []);

  const resolveOrDiscoverDeviceId = useCallback(
    async (targetWalletType: HardwareWalletType): Promise<string | null> => {
      // Prefer most recent device id (e.g. from native connect event).
      // If missing, discover the device.
      const existingDeviceId = deviceIdRef.current;
      if (existingDeviceId) {
        return existingDeviceId;
      }

      console.log(
        LOG_TAG,
        `Device ID not provided, attempting to discover ${targetWalletType} device`,
      );

      try {
        const discoveredId = await getHardwareWalletDeviceId(targetWalletType);
        if (!discoveredId) {
          const error = createHardwareWalletError(
            ErrorCode.DEVICE_STATE_003,
            targetWalletType,
            `No ${targetWalletType} device found. Please ensure your device is connected and unlocked.`,
          );
          updateConnectionState(getConnectionStateFromError(error));
          isConnectingRef.current = false;
          return null;
        }

        console.log(LOG_TAG, `Discovered device ID: ${discoveredId}`);
        return discoveredId;
      } catch (error) {
        console.error(LOG_TAG, 'Failed to discover device:', error);
        updateConnectionState(
          getConnectionStateFromError(
            createHardwareWalletError(
              ErrorCode.CONN_CLOSED_001,
              targetWalletType,
              `Failed to discover ${targetWalletType} device: ${error instanceof Error ? error.message : String(error)}`,
              { cause: error instanceof Error ? error : undefined },
            ),
          ),
        );
        isConnectingRef.current = false;
        return null;
      }
    },
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
        setDeviceId(targetDeviceId);
        updateConnectionState(ConnectionState.connecting());
      }
    },
    [updateConnectionState],
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
      // Verify this is still the latest connection attempt
      if (!isLatestAttempt()) {
        console.log(LOG_TAG, 'Connection superseded by newer attempt');
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

      // Verify this is still the latest connection attempt
      if (!isLatestAttempt()) {
        console.log(LOG_TAG, 'Connection superseded before adapter.connect');
        adapter.destroy();
        return;
      }

      adapterRef.current = adapter;
      await adapter.connect(targetDeviceId);

      // Verify this is still the latest connection attempt after async operation
      if (!isLatestAttempt()) {
        console.log(LOG_TAG, 'Connection superseded after adapter.connect');
        adapter.destroy();
        adapterRef.current = null;
        return;
      }

      if (!abortSignal?.aborted) {
        updateConnectionState(ConnectionState.connected());
      }
    },
    [handleDeviceEvent, handleDisconnect, updateConnectionState],
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
      console.error(LOG_TAG, 'Connection error:', error);

      // Only update state if this is still the latest connection attempt
      if (!isLatestAttempt()) {
        console.log(LOG_TAG, 'Ignoring error from superseded connection');
        return;
      }

      if (!abortSignal?.aborted) {
        if (isHardwareWalletErrorWithCode(error)) {
          updateConnectionState(getConnectionStateFromError(error));
        } else {
          const fallbackError = isError(error)
            ? error
            : new Error('Failed to connect to hardware wallet');
          updateConnectionState(
            ConnectionState.error('connection_failed', fallbackError),
          );
        }
      }

      adapterRef.current?.destroy();
      adapterRef.current = null;
    },
    [updateConnectionState],
  );

  const finalizeConnectionAttempt = useCallback(
    (isLatestAttempt: IsLatestAttempt) => {
      // Only clear connecting flag if this is still the latest connection attempt
      if (isLatestAttempt()) {
        isConnectingRef.current = false;
      }
    },
    [],
  );

  const connect = useCallback(async (): Promise<void> => {
    const abortSignal = abortControllerRef.current?.signal;

    const effectiveType = walletTypeRef.current;
    if (!effectiveType) {
      updateConnectionState(
        ConnectionState.error(
          'connection_failed',
          new Error('Hardware wallet type is unknown'),
        ),
      );
      isConnectingRef.current = false;
      return;
    }

    resetAdapterForFreshConnection();
    const { connectionId, isLatestAttempt } = beginConnectionAttempt();

    const discoveredDeviceId = await resolveOrDiscoverDeviceId(effectiveType);
    if (!discoveredDeviceId) {
      return;
    }

    console.log(
      LOG_TAG,
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
  ]);

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

    (walletType ? getHardwareWalletDeviceId(walletType) : Promise.resolve(null))
      .then(async (id) => {
        if (abortSignal?.aborted) {
          return;
        }

        setDeviceId((prevId) => (prevId === id ? prevId : id));

        if (
          walletType &&
          id &&
          !adapterRef.current?.isConnected() &&
          !isConnectingRef.current &&
          !hasAutoConnectedRef.current &&
          hardwareConnectionPermissionState ===
            HardwareConnectionPermissionState.Granted
        ) {
          hasAutoConnectedRef.current = true;
          lastConnectedAccountRef.current = accountAddress ?? null;
          deviceIdRef.current = id;
          // Await connection to ensure state updates to 'connected'
          await connectRef.current?.();
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
    walletType,
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
        setHardwareConnectionPermissionState(
          HardwareConnectionPermissionState.Denied,
        );
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
      const effectiveDeviceId = targetDeviceId || deviceIdRef.current;
      const abortSignal = abortControllerRef.current?.signal;

      if (abortSignal?.aborted) {
        console.log(LOG_TAG, 'ensureDeviceReady aborted');
        return false;
      }

      // If not connected, try to connect first
      if (!adapterRef.current?.isConnected()) {
        console.log(LOG_TAG, 'Device not connected, attempting connection');
        const currentWalletType = walletTypeRef.current;

        if (!currentWalletType) {
          return false;
        }

        try {
          if (effectiveDeviceId) {
            deviceIdRef.current = effectiveDeviceId;
            setDeviceId(effectiveDeviceId);
          }
          await connect();
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
        const adapter = adapterRef.current;
        if (adapter?.verifyDeviceReady && effectiveDeviceId) {
          try {
            const result = await adapter.verifyDeviceReady(effectiveDeviceId);
            console.log(LOG_TAG, 'ensureDeviceReady result:', result);
            if (result) {
              updateConnectionState(ConnectionState.ready());
            }
            return result;
          } catch (error) {
            // Prefer adapter-provided HardwareWalletError state when available.
            // Some adapters emit device events for specific failure reasons, but
            // we also set a safe fallback error state to keep UI consistent.
            console.error(LOG_TAG, 'verifyDeviceReady failed:', error);
            if (error && typeof error === 'object' && 'code' in error) {
              updateConnectionState(
                getConnectionStateFromError(
                  error as unknown as HardwareWalletError,
                ),
              );
            } else {
              const fallbackError = isError(error)
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
    [connect, updateConnectionState],
  );

  // Memoized context values
  const configValue = useMemo<HardwareWalletConfigContextType>(
    () => ({
      isHardwareWalletAccount,
      walletType,
      deviceId,
      hardwareConnectionPermissionState,
      isWebHidAvailable: isWebHidAvailableState,
      isWebUsbAvailable: isWebUsbAvailableState,
      currentAppName,
    }),
    [
      isHardwareWalletAccount,
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
