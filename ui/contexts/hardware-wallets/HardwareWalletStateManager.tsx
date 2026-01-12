import { useState, useRef, useEffect, useMemo } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { KeyringTypes } from '@metamask/keyring-controller';
import { getMaybeSelectedInternalAccount } from '../../selectors';
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
  deviceId: string | null;
  hardwareConnectionPermissionState: HardwareConnectionPermissionState;
  currentAppName: string | null;
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
  isConnectingRef: React.MutableRefObject<boolean>;
  hasAutoConnectedRef: React.MutableRefObject<boolean>;
  lastConnectedAccountRef: React.MutableRefObject<string | null>;
  currentConnectionIdRef: React.MutableRefObject<number | null>;
  connectRef: React.MutableRefObject<(() => Promise<void>) | null>;
  deviceIdRef: React.MutableRefObject<string | null>;
  walletTypeRef: React.MutableRefObject<HardwareWalletType | null>;
  previousWalletTypeRef: React.MutableRefObject<HardwareWalletType | null>;
};

/**
 * Hook that manages all hardware wallet state and refs
 */
export const useHardwareWalletStateManager = () => {
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

  // State declarations
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

  // Ref declarations
  const adapterRef = useRef<HardwareWalletAdapter | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isConnectingRef = useRef(false);
  const hasAutoConnectedRef = useRef(false);
  const lastConnectedAccountRef = useRef<string | null>(null);
  const currentConnectionIdRef = useRef<number | null>(null);
  const connectRef = useRef<(() => Promise<void>) | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const walletTypeRef = useRef<HardwareWalletType | null>(null);
  const previousWalletTypeRef = useRef<HardwareWalletType | null>(null);

  // Sync deviceId with deviceIdRef
  useEffect(() => {
    deviceIdRef.current = deviceId;
  }, [deviceId]);

  // Sync walletType with walletTypeRef
  useEffect(() => {
    previousWalletTypeRef.current = walletTypeRef.current;
    walletTypeRef.current = walletType;
  }, [walletType]);

  const state: HardwareWalletState = {
    deviceId,
    hardwareConnectionPermissionState,
    currentAppName,
    connectionState,
    walletType,
    isHardwareWalletAccount,
    accountAddress,
  };

  const refs = useMemo<HardwareWalletRefs>(
    () => ({
      adapterRef,
      abortControllerRef,
      isConnectingRef,
      hasAutoConnectedRef,
      lastConnectedAccountRef,
      currentConnectionIdRef,
      connectRef,
      deviceIdRef,
      walletTypeRef,
      previousWalletTypeRef,
    }),
    [],
  );

  const setters = useMemo(
    () => ({
      setDeviceId,
      setHardwareConnectionPermissionState,
      setCurrentAppName,
      setConnectionState,
    }),
    [
      setDeviceId,
      setHardwareConnectionPermissionState,
      setCurrentAppName,
      setConnectionState,
    ],
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function selectAccountHardwareInfo(state: any) {
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
