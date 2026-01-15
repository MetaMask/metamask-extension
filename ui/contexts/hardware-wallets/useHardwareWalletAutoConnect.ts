import { useEffect, type Dispatch, type SetStateAction } from 'react';
import {
  checkHardwareWalletPermission,
  getHardwareWalletDeviceId,
  subscribeToWebHIDEvents,
  subscribeToWebUSBEvents,
} from './webConnectionUtils';
import { HardwareWalletType, HardwareConnectionPermissionState } from './types';
import {
  type HardwareWalletState,
  type HardwareWalletRefs,
} from './HardwareWalletStateManager';

type UseHardwareWalletAutoConnectParams = {
  state: HardwareWalletState;
  refs: HardwareWalletRefs;
  setDeviceId: Dispatch<SetStateAction<string | null>>;
  setHardwareConnectionPermissionState: (
    permission: HardwareConnectionPermissionState,
  ) => void;
  hardwareConnectionPermissionState: HardwareConnectionPermissionState;
  isWebHidAvailable: boolean;
  isWebUsbAvailable: boolean;
  handleDisconnect: (error?: unknown) => void;
  resetAutoConnectState: () => void;
  setAutoConnected: (accountAddress: string | null, deviceId: string) => void;
  setDeviceIdRef: (deviceId: string) => void;
};

export const useHardwareWalletAutoConnect = ({
  state,
  refs,
  setDeviceId,
  setHardwareConnectionPermissionState,
  hardwareConnectionPermissionState,
  isWebHidAvailable,
  isWebUsbAvailable,
  handleDisconnect,
  resetAutoConnectState,
  setAutoConnected,
  setDeviceIdRef,
}: UseHardwareWalletAutoConnectParams) => {
  const { isHardwareWalletAccount, walletType, accountAddress } = state;

  useEffect(() => {
    if (
      !isHardwareWalletAccount ||
      !walletType ||
      hardwareConnectionPermissionState !==
        HardwareConnectionPermissionState.Granted
    ) {
      return undefined;
    }

    const { abortControllerRef, adapterRef, isConnectingRef, connectRef } =
      refs;

    const isLedger = walletType === HardwareWalletType.Ledger;
    const isTrezor = walletType === HardwareWalletType.Trezor;

    const isSupportedWalletType = isLedger || isTrezor;
    const hasRequiredWebAPI = (isLedger && isWebHidAvailable) || (isTrezor && isWebUsbAvailable);

    if (!isSupportedWalletType || !hasRequiredWebAPI) {
      return undefined;
    }

    const abortSignal = abortControllerRef.current?.signal;

    const handleNativeConnect = async (device: HIDDevice | USBDevice) => {
      if (abortSignal?.aborted) {
        return;
      }

      const newDeviceId = device.productId.toString();
      setDeviceId((prevId) => (prevId === newDeviceId ? prevId : newDeviceId));

      const currentPermissionState =
        await checkHardwareWalletPermission(walletType);
      setHardwareConnectionPermissionState(currentPermissionState);

      if (
        currentPermissionState === HardwareConnectionPermissionState.Granted &&
        !adapterRef.current?.isConnected() &&
        !isConnectingRef.current
      ) {
        setDeviceIdRef(newDeviceId);
        connectRef.current?.();
      }
    };

    const handleNativeDisconnect = async (device: HIDDevice | USBDevice) => {
      if (abortSignal?.aborted) {
        return;
      }

      const disconnectedDeviceId = device.productId.toString();
      if (refs.deviceIdRef.current === disconnectedDeviceId) {
        handleDisconnect();

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
    hardwareConnectionPermissionState,
    isWebHidAvailable,
    isWebUsbAvailable,
    handleDisconnect,
    setDeviceId,
    setHardwareConnectionPermissionState,
    setDeviceIdRef,
    refs,
  ]);

  // Auto-connection effect
  useEffect(() => {
    const {
      abortControllerRef,
      hasAutoConnectedRef,
      lastConnectedAccountRef,
      adapterRef,
      isConnectingRef,
      connectRef,
    } = refs;
    if (
      !isHardwareWalletAccount ||
      hardwareConnectionPermissionState !==
        HardwareConnectionPermissionState.Granted
    ) {
      resetAutoConnectState();
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
          setAutoConnected(accountAddress ?? null, id);
          await connectRef.current?.();
        }
      })
      .catch(() => {
        // Swallow errors; auto-connect best-effort only.
      });
  }, [
    isHardwareWalletAccount,
    accountAddress,
    walletType,
    hardwareConnectionPermissionState,
    refs,
    setDeviceId,
    resetAutoConnectState,
    setAutoConnected,
  ]);
};
