import { useState, useRef, useMemo } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { KeyringTypes } from '@metamask/keyring-controller';
import {
  AccountsState,
  getMaybeSelectedInternalAccount,
} from '../../selectors';
import {
  HardwareConnectionPermissionState,
  HardwareWalletType,
  type HardwareWalletAdapter,
  type HardwareWalletConnectionState,
} from './types';
import { ConnectionState } from './connectionState';

/**
 * State and refs managed by the hardware wallet context
 */
export type HardwareWalletState = {
  // Basic state
  hardwareConnectionPermissionState: HardwareConnectionPermissionState;
  connectionState: HardwareWalletConnectionState;

  // Derived state
  walletType: HardwareWalletType | null;
  isHardwareWalletAccount: boolean;
  accountAddress: string | null;
};

/**
 * Refs used for managing async operations and state
 */
export type HardwareWalletRefs = {
  adapterRef: React.MutableRefObject<HardwareWalletAdapter | null>;
  abortControllerRef: React.MutableRefObject<AbortController | null>;
  /**
   * Stores the pending connection promise. When not null, a connection is in progress
   * and concurrent callers should await this promise instead of starting a new connection.
   */
  connectingPromiseRef: React.MutableRefObject<Promise<void> | null>;
  /**
   * Stores pending ensureDeviceReady promises keyed by requireBlindSigning.
   * This prevents duplicate checks for the same option while allowing different
   * option sets to run independently.
   */
  ensureDeviceReadyPromiseRef: React.MutableRefObject<
    Map<boolean, Promise<boolean>>
  >;
  /**
   * Flag to prevent concurrent connection attempts.
   * Used to synchronously check-and-set before any async work.
   */
  isConnectingRef: React.MutableRefObject<boolean>;
  hasAutoConnectedRef: React.MutableRefObject<boolean>;
  lastConnectedAccountRef: React.MutableRefObject<string | null>;
  currentConnectionIdRef: React.MutableRefObject<number | null>;
  connectRef: React.MutableRefObject<(() => Promise<void>) | null>;
  walletTypeRef: React.MutableRefObject<HardwareWalletType | null>;
  previousWalletTypeRef: React.MutableRefObject<HardwareWalletType | null>;
};

/**
 * Hook that manages all hardware wallet state and refs
 */
export const useHardwareWalletStateManager = () => {
  const accountInfo = useSelector(getAccountHardwareInfo, shallowEqual);

  const walletType = useMemo(
    () => keyringTypeToHardwareWalletType(accountInfo.keyringType),
    [accountInfo.keyringType],
  );

  const isHardwareWalletAccount = useMemo(
    () => walletType !== null,
    [walletType],
  );

  const accountAddress = accountInfo.address;

  // State declarations
  const [
    hardwareConnectionPermissionState,
    setHardwareConnectionPermissionState,
  ] = useState<HardwareConnectionPermissionState>(
    HardwareConnectionPermissionState.Unknown,
  );
  const [connectionState, setConnectionState] =
    useState<HardwareWalletConnectionState>(ConnectionState.disconnected());

  // Ref declarations
  const adapterRef = useRef<HardwareWalletAdapter | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const connectingPromiseRef = useRef<Promise<void> | null>(null);
  const ensureDeviceReadyPromiseRef = useRef<Map<boolean, Promise<boolean>>>(
    new Map(),
  );
  const isConnectingRef = useRef(false);
  const hasAutoConnectedRef = useRef(false);
  const lastConnectedAccountRef = useRef<string | null>(null);
  const currentConnectionIdRef = useRef<number | null>(null);
  const connectRef = useRef<(() => Promise<void>) | null>(null);
  const walletTypeRef = useRef<HardwareWalletType | null>(null);
  const previousWalletTypeRef = useRef<HardwareWalletType | null>(null);

  // Track previous wallet type for detecting wallet type changes (e.g., Trezor -> Ledger)
  if (walletTypeRef.current !== walletType) {
    previousWalletTypeRef.current = walletTypeRef.current;
    walletTypeRef.current = walletType;
  }

  const state: HardwareWalletState = {
    hardwareConnectionPermissionState,
    connectionState,
    walletType,
    isHardwareWalletAccount,
    accountAddress,
  };

  const refs = useMemo<HardwareWalletRefs>(
    () => ({
      adapterRef,
      abortControllerRef,
      connectingPromiseRef,
      ensureDeviceReadyPromiseRef,
      isConnectingRef,
      hasAutoConnectedRef,
      lastConnectedAccountRef,
      currentConnectionIdRef,
      connectRef,
      walletTypeRef,
      previousWalletTypeRef,
    }),
    [],
  );

  const setters = useMemo(
    () => ({
      setHardwareConnectionPermissionState,
      setConnectionState,
      /**
       * Cleans up the adapter by calling destroy() and nullifying the reference
       */
      cleanupAdapter: () => {
        const adapter = adapterRef.current;
        if (adapter) {
          adapter.destroy();
          adapterRef.current = null;
        }
      },
      /**
       * Aborts and cleans up the current AbortController
       */
      abortAndCleanupController: () => {
        const controller = abortControllerRef.current;
        if (controller) {
          controller.abort();
          abortControllerRef.current = null;
        }
      },
      /**
       * Resets connection-related refs to their initial state
       */
      resetConnectionRefs: () => {
        connectingPromiseRef.current = null;
        ensureDeviceReadyPromiseRef.current.clear();
        currentConnectionIdRef.current = null;
        isConnectingRef.current = false;
      },
      /**
       * Resets auto-connect state, allowing auto-connect to run again
       */
      resetAutoConnectState: () => {
        hasAutoConnectedRef.current = false;
        lastConnectedAccountRef.current = null;
      },
      /**
       * Marks auto-connect as completed for an account
       *
       * @param connectedAccountAddress - The account address that was auto-connected
       */
      setAutoConnected: (connectedAccountAddress: string | null) => {
        hasAutoConnectedRef.current = true;
        lastConnectedAccountRef.current = connectedAccountAddress;
      },
    }),
    [setHardwareConnectionPermissionState, setConnectionState],
  );

  return {
    state,
    refs,
    setters,
  };
};

/**
 * Selector that extracts only the account data we need for hardware wallet detection.
 * This prevents re-renders when other account properties change.
 *
 * @param state - Redux state object
 * @returns Account hardware info with keyring type and address
 */
function getAccountHardwareInfo(state: AccountsState) {
  const account = getMaybeSelectedInternalAccount(state);
  return {
    keyringType: account?.metadata?.keyring?.type ?? null,
    address: account?.address ?? null,
  };
}

/**
 * Utility function to convert keyring type to hardware wallet type
 *
 * @param keyringType
 */
function keyringTypeToHardwareWalletType(
  keyringType?: string | null,
): HardwareWalletType | null {
  if (!keyringType) {
    return null;
  }

  switch (keyringType) {
    case KeyringTypes.ledger:
      return HardwareWalletType.Ledger;
    case KeyringTypes.trezor:
      return HardwareWalletType.Trezor;
    case KeyringTypes.oneKey:
      return HardwareWalletType.OneKey;
    case KeyringTypes.lattice:
      return HardwareWalletType.Lattice;
    case KeyringTypes.qr:
      return HardwareWalletType.Qr;
    default:
      return null;
  }
}
