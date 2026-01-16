import { useEffect, type Dispatch, type SetStateAction } from 'react';
import {
  checkHardwareWalletPermission,
  getHardwareWalletDeviceId,
  subscribeToWebHidEvents,
  subscribeToWebUsbEvents,
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
    const hasRequiredWebAPI =
      (isLedger && isWebHidAvailable) || (isTrezor && isWebUsbAvailable);

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

    const getSubscriptionFunction = (type: HardwareWalletType) => {
      switch (type) {
        case HardwareWalletType.Ledger:
          return subscribeToWebHidEvents;
        case HardwareWalletType.Trezor:
          return subscribeToWebUsbEvents;
        default:
          return () => {
            // return noop for unsupported
          };
      }
    };

    const subscribeToEvents = getSubscriptionFunction(walletType);

    const unsubscribe = subscribeToEvents(
      walletType,
      handleNativeConnect,
      handleNativeDisconnect,
    );

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
      return undefined;
    }

    const abortSignal = abortControllerRef.current?.signal;

    const shouldSkipAutoConnect =
      hasAutoConnectedRef.current &&
      lastConnectedAccountRef.current === accountAddress;
    if (shouldSkipAutoConnect) {
      return undefined;
    }

    let isCancelled = false;

    // Capture the account address at the time this effect starts
    // so we only mark auto-connected for the correct account
    const effectAccountAddress = accountAddress;

    (walletType ? getHardwareWalletDeviceId(walletType) : Promise.resolve(null))
      .then(async (id) => {
        if (abortSignal?.aborted || isCancelled) {
          return;
        }

        setDeviceId((prevId) => (prevId === id ? prevId : id));

        if (
          walletType &&
          id &&
          connectRef.current &&
          !adapterRef.current?.isConnected() &&
          !isConnectingRef.current &&
          !hasAutoConnectedRef.current
        ) {
          setDeviceIdRef(id);
          const connect = connectRef.current;
          try {
            await connect();
            // Check cancellation again after async connect completes
            if (!isCancelled) {
              setAutoConnected(effectAccountAddress ?? null, id);
            }
          } catch (error) {
            // Connection failed, don't mark as auto-connected
            // Error is already handled by connectRef implementation
          }
        }
      })
      .catch(() => {
        // Swallow errors; auto-connect best-effort only.
      });

    return () => {
      isCancelled = true;
    };
  }, [
    isHardwareWalletAccount,
    accountAddress,
    walletType,
    hardwareConnectionPermissionState,
    refs,
    setDeviceId,
    resetAutoConnectState,
    setAutoConnected,
    setDeviceIdRef,
  ]);
};
