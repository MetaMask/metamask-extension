import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { ConnectionState } from './connectionState';
import { useHardwareWalletStateManager } from './HardwareWalletStateManager';
import { useDeviceEventHandlers } from './HardwareWalletEventHandlers';
import { useHardwareWalletPermissions } from './useHardwareWalletPermissions';
import { useHardwareWalletConnection } from './useHardwareWalletConnection';
import { useHardwareWalletAutoConnect } from './useHardwareWalletAutoConnect';
import {
  HardwareWalletType,
  HardwareConnectionPermissionState,
  type HardwareWalletConnectionState,
} from './types';
import { isWebHidAvailable, isWebUsbAvailable } from './webConnectionUtils';

// Type definitions for separate contexts
export type HardwareWalletConfigContextType = {
  isHardwareWalletAccount: boolean;
  walletType: HardwareWalletType | null;
  deviceId: string | null;
  hardwareConnectionPermissionState: HardwareConnectionPermissionState;
  isWebHidAvailable: boolean;
  isWebUsbAvailable: boolean;
};

export type HardwareWalletStateContextType = {
  connectionState: HardwareWalletConnectionState;
};

export type HardwareWalletActionsContextType = {
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

/**
 * Hardware wallet context type - single unified context
 */
export type HardwareWalletContextType = {
  // State (may cause rerenders)
  isHardwareWalletAccount: boolean;
  walletType: HardwareWalletType | null;
  connectionState: HardwareWalletConnectionState;
  deviceId: string | null;
  hardwareConnectionPermissionState: HardwareConnectionPermissionState;
  isWebHidAvailable: boolean;
  isWebUsbAvailable: boolean;

  // Actions (stable, won't cause rerenders)
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

const HardwareWalletContext = createContext<HardwareWalletContextType | null>(
  null,
);

// Separate contexts for performance optimization
export const HardwareWalletConfigContext =
  createContext<HardwareWalletConfigContextType | null>(null);
export const HardwareWalletStateContext =
  createContext<HardwareWalletStateContextType | null>(null);
export const HardwareWalletActionsContext =
  createContext<HardwareWalletActionsContextType | null>(null);

/**
 * Hook to access hardware wallet context
 */
export const useHardwareWallet = (): HardwareWalletContextType => {
  const context = useContext(HardwareWalletContext);
  if (!context) {
    throw new Error(
      'useHardwareWallet must be used within HardwareWalletProvider',
    );
  }
  return context;
};

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
 * Hardware wallet provider component
 *
 * @param options0
 * @param options0.children
 */
export const HardwareWalletProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { state, refs, setters } = useHardwareWalletStateManager();

  const {
    deviceId,
    hardwareConnectionPermissionState,
    connectionState,
    walletType,
    isHardwareWalletAccount,
  } = state;

  const {
    setDeviceId,
    setHardwareConnectionPermissionState,
    setConnectionState,
    resetAutoConnectState,
    setAutoConnected,
    setDeviceIdRef,
  } = setters;

  const isWebHidAvailableState = useMemo(() => isWebHidAvailable(), []);
  const isWebUsbAvailableState = useMemo(() => isWebUsbAvailable(), []);

  const { updateConnectionState, handleDeviceEvent, handleDisconnect } =
    useDeviceEventHandlers({
      refs,
      setters,
    });

  const {
    checkHardwareWalletPermissionAction,
    requestHardwareWalletPermissionAction,
  } = useHardwareWalletPermissions({
    state,
    refs: { abortControllerRef: refs.abortControllerRef },
    setHardwareConnectionPermissionState,
  });

  const { connect, disconnect, clearError, ensureDeviceReady } =
    useHardwareWalletConnection({
      refs,
      setters: {
        setDeviceId,
        setConnectionState,
      },
      updateConnectionState,
      handleDeviceEvent,
      handleDisconnect,
    });

  const stableActionsRef = useRef({
    connect,
    disconnect,
    clearError,
    checkHardwareWalletPermission: checkHardwareWalletPermissionAction,
    requestHardwareWalletPermission: requestHardwareWalletPermissionAction,
    ensureDeviceReady,
  });

  // Update the ref when dependencies change
  stableActionsRef.current = {
    connect,
    disconnect,
    clearError,
    checkHardwareWalletPermission: checkHardwareWalletPermissionAction,
    requestHardwareWalletPermission: requestHardwareWalletPermissionAction,
    ensureDeviceReady,
  };

  useHardwareWalletAutoConnect({
    state,
    refs,
    setDeviceId,
    setHardwareConnectionPermissionState,
    hardwareConnectionPermissionState,
    isWebHidAvailable: isWebHidAvailableState,
    isWebUsbAvailable: isWebUsbAvailableState,
    handleDisconnect,
    resetAutoConnectState,
    setAutoConnected,
    setDeviceIdRef,
  });

  // Abort controller lifecycle
  useEffect(() => {
    // eslint-disable-next-line react-compiler/react-compiler
    refs.abortControllerRef.current = new AbortController();
    return () => {
      refs.abortControllerRef.current?.abort();
      refs.adapterRef.current?.destroy();
    };
  }, [refs]);

  // Reset when leaving hardware wallet account
  useEffect(() => {
    if (!isHardwareWalletAccount && refs.adapterRef.current) {
      refs.adapterRef.current.destroy();
      refs.adapterRef.current = null;
      updateConnectionState(ConnectionState.disconnected());
      setDeviceId(null);
      refs.isConnectingRef.current = false;
      refs.currentConnectionIdRef.current = null;
      refs.hasAutoConnectedRef.current = false;
      refs.lastConnectedAccountRef.current = null;
    }
  }, [isHardwareWalletAccount, updateConnectionState, refs, setDeviceId]);

  // Disconnect when switching wallet type
  useEffect(() => {
    if (!isHardwareWalletAccount) {
      refs.previousWalletTypeRef.current = null;
      return;
    }

    const previousWalletType = refs.previousWalletTypeRef.current;
    refs.previousWalletTypeRef.current = walletType;

    if (
      isHardwareWalletAccount &&
      previousWalletType &&
      walletType &&
      previousWalletType !== walletType &&
      refs.adapterRef.current
    ) {
      refs.adapterRef.current.destroy();
      refs.adapterRef.current = null;
      updateConnectionState(ConnectionState.disconnected());
      setDeviceId(null);
      refs.isConnectingRef.current = false;
      refs.currentConnectionIdRef.current = null;
      refs.hasAutoConnectedRef.current = false;
      refs.lastConnectedAccountRef.current = null;
    }
  }, [
    isHardwareWalletAccount,
    walletType,
    updateConnectionState,
    refs,
    setDeviceId,
  ]);

  // === CONTEXT VALUE ===
  const contextValue = useMemo<HardwareWalletContextType>(
    () => ({
      // State
      isHardwareWalletAccount,
      walletType,
      connectionState,
      deviceId,
      hardwareConnectionPermissionState,
      isWebHidAvailable: isWebHidAvailableState,
      isWebUsbAvailable: isWebUsbAvailableState,

      // Actions (stable)
      connect: stableActionsRef.current.connect,
      disconnect: stableActionsRef.current.disconnect,
      clearError: stableActionsRef.current.clearError,
      checkHardwareWalletPermission:
        stableActionsRef.current.checkHardwareWalletPermission,
      requestHardwareWalletPermission:
        stableActionsRef.current.requestHardwareWalletPermission,
      ensureDeviceReady: stableActionsRef.current.ensureDeviceReady,
    }),
    [
      isHardwareWalletAccount,
      walletType,
      connectionState,
      deviceId,
      hardwareConnectionPermissionState,
      isWebHidAvailableState,
      isWebUsbAvailableState,
      stableActionsRef,
    ],
  );

  // Separate context values for performance optimization
  const configValue = useMemo<HardwareWalletConfigContextType>(
    () => ({
      isHardwareWalletAccount,
      walletType,
      deviceId,
      hardwareConnectionPermissionState,
      isWebHidAvailable: isWebHidAvailableState,
      isWebUsbAvailable: isWebUsbAvailableState,
    }),
    [
      isHardwareWalletAccount,
      walletType,
      deviceId,
      hardwareConnectionPermissionState,
      isWebHidAvailableState,
      isWebUsbAvailableState,
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
      connect: stableActionsRef.current.connect,
      disconnect: stableActionsRef.current.disconnect,
      clearError: stableActionsRef.current.clearError,
      checkHardwareWalletPermission:
        stableActionsRef.current.checkHardwareWalletPermission,
      requestHardwareWalletPermission:
        stableActionsRef.current.requestHardwareWalletPermission,
      ensureDeviceReady: stableActionsRef.current.ensureDeviceReady,
    }),
    // Actions are stable, so this memo only runs once
    [],
  );

  return (
    <HardwareWalletConfigContext.Provider value={configValue}>
      <HardwareWalletStateContext.Provider value={stateValue}>
        <HardwareWalletActionsContext.Provider value={actionsValue}>
          <HardwareWalletContext.Provider value={contextValue}>
            {children}
          </HardwareWalletContext.Provider>
        </HardwareWalletActionsContext.Provider>
      </HardwareWalletStateContext.Provider>
    </HardwareWalletConfigContext.Provider>
  );
};
