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

    const isLedger = walletType === HardwareWalletType.Ledger;
    const isTrezor = walletType === HardwareWalletType.Trezor;

    if ((isLedger && !isWebHidAvailable) || (isTrezor && !isWebUsbAvailable)) {
      return undefined;
    }

    const abortSignal = refs.abortControllerRef.current?.signal;

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
        !refs.adapterRef.current?.isConnected() &&
        !refs.isConnectingRef.current
      ) {
        refs.deviceIdRef.current = newDeviceId;
        refs.connectRef.current?.();
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
    refs,
  ]);

  // Auto-connection effect
  useEffect(() => {
    if (
      !isHardwareWalletAccount ||
      hardwareConnectionPermissionState !==
        HardwareConnectionPermissionState.Granted
    ) {
      refs.hasAutoConnectedRef.current = false;
      refs.lastConnectedAccountRef.current = null;
      return;
    }

    const abortSignal = refs.abortControllerRef.current?.signal;

    const shouldSkipAutoConnect =
      refs.hasAutoConnectedRef.current &&
      refs.lastConnectedAccountRef.current === accountAddress;
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
          !refs.adapterRef.current?.isConnected() &&
          !refs.isConnectingRef.current &&
          !refs.hasAutoConnectedRef.current &&
          hardwareConnectionPermissionState ===
            HardwareConnectionPermissionState.Granted
        ) {
          refs.hasAutoConnectedRef.current = true;
          refs.lastConnectedAccountRef.current = accountAddress ?? null;
          refs.deviceIdRef.current = id;
          await refs.connectRef.current?.();
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
  ]);
};
