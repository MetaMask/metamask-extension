/**
 * Hardware Wallet Context - Optimized Version
 *
 * This version splits the context into two separate contexts to prevent unnecessary rerenders:
 * 1. HardwareWalletConfigContext - Rarely changes (wallet type, device ID, etc.)
 * 2. HardwareWalletStateContext - Frequently changes (connection state)
 *
 * This allows components to subscribe only to what they need.
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

const LOG_TAG = '[HardwareWalletContext]';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Config context - rarely changes
 */
interface HardwareWalletConfigContextType {
  isHardwareWalletAccount: boolean;
  detectedWalletType: HardwareWalletType | null;
  walletType: HardwareWalletType | null;
  deviceId: string | null;
  webHidPermissionState: WebHIDPermissionState;
  isWebHidAvailable: boolean;
  currentAppName: string | null;
}

/**
 * State context - frequently changes
 */
interface HardwareWalletStateContextType {
  connectionState: HardwareWalletConnectionState;
}

/**
 * Actions context - callbacks (stable)
 */
interface HardwareWalletActionsContextType {
  connect: (type: HardwareWalletType, id: string) => Promise<void>;
  disconnect: () => Promise<void>;
  executeWithWallet: <TResult>(
    operation: (adapter: HardwareWalletAdapter) => Promise<TResult>,
  ) => Promise<TResult>;
  clearError: () => void;
  retry: () => Promise<void>;
  checkWebHidPermission: () => Promise<WebHIDPermissionState>;
  requestWebHidPermission: () => Promise<boolean>;
  ensureDeviceReady: () => Promise<boolean>;
}

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
 * Use this when you need wallet type, device ID, etc.
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
 * Use this when you need connection state
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
 * Use this when you need to perform actions
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
 * Use this when you need everything (but be aware it may cause more rerenders)
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
// PROVIDER
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

export const HardwareWalletProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Account detection
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const keyringType = selectedAccount?.metadata?.keyring?.type;
  const detectedWalletType = keyringTypeToHardwareWalletType(keyringType);
  const isHardwareWalletAccount = detectedWalletType !== null;
  const accountAddress = selectedAccount?.address;

  // State - split into config and state
  const [walletType, setWalletType] = useState<HardwareWalletType | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [webHidPermissionState, setWebHidPermissionState] =
    useState<WebHIDPermissionState>(WebHIDPermissionState.UNKNOWN);
  const [currentAppName, setCurrentAppName] = useState<string | null>(null);

  // Frequently changing state (separate to prevent unnecessary rerenders)
  const [connectionState, setConnectionState] =
    useState<HardwareWalletConnectionState>(ConnectionState.disconnected());

  const isWebHidAvailableState = isWebHIDAvailable();

  // Refs
  const adapterRef = useRef<HardwareWalletAdapter | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingOperationRef = useRef<(() => Promise<unknown>) | null>(null);
  const isConnectingRef = useRef(false);
  const hasAutoConnectedRef = useRef(false);
  const lastConnectedAccountRef = useRef<string | null>(null);
  const connectRef =
    useRef<(type: HardwareWalletType, id: string) => Promise<void>>();

  // Smart state updater to prevent unnecessary rerenders
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
      hasAutoConnectedRef.current = false;
      lastConnectedAccountRef.current = null;
    }
  }, [isHardwareWalletAccount, updateConnectionState]);

  // Actions - these are stable and don't depend on state
  // (implementation details omitted for brevity - same as original)
  const connect = useCallback(
    async (type: HardwareWalletType, id: string): Promise<void> => {
      // ... implementation ...
    },
    [handleDeviceEvent, handleDisconnect, updateConnectionState],
  );

  const disconnect = useCallback(async (): Promise<void> => {
    // ... implementation ...
  }, [updateConnectionState]);

  const executeWithWallet = useCallback(
    async <TResult,>(
      operation: (adapter: HardwareWalletAdapter) => Promise<TResult>,
    ): Promise<TResult> => {
      // ... implementation ...
      throw new Error('Not implemented');
    },
    [updateConnectionState],
  );

  const clearError = useCallback(() => {
    // ... implementation ...
  }, [updateConnectionState]);

  const retry = useCallback(async (): Promise<void> => {
    // ... implementation ...
  }, [connect, updateConnectionState]);

  const checkWebHidPermissionAction =
    useCallback(async (): Promise<WebHIDPermissionState> => {
      // ... implementation ...
      return WebHIDPermissionState.UNKNOWN;
    }, [isWebHidAvailableState]);

  const requestWebHidPermissionAction =
    useCallback(async (): Promise<boolean> => {
      // ... implementation ...
      return false;
    }, [isWebHidAvailableState]);

  const ensureDeviceReady = useCallback(async (): Promise<boolean> => {
    // ... implementation ...
    return true;
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

  const stateValue = useMemo<HardwareWalletStateContextType>(
    () => ({
      connectionState,
    }),
    [connectionState],
  );

  const actionsValue = useMemo<HardwareWalletActionsContextType>(
    () => ({
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
