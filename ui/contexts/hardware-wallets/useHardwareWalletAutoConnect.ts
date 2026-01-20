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

  const {
    adapterRef,
    isConnectingRef,
    connectRef,
    deviceIdRef,
    hasAutoConnectedRef,
    lastConnectedAccountRef,
  } = refs;

  useEffect(
    () => {
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

      const isSupportedWalletType = isLedger || isTrezor;
      const hasRequiredWebAPI =
        (isLedger && isWebHidAvailable) || (isTrezor && isWebUsbAvailable);

      if (!isSupportedWalletType || !hasRequiredWebAPI) {
        return undefined;
      }

      const abortController = new AbortController();
      const abortSignal = abortController.signal;

      // Capture the account address at the time this effect starts
      // so we only mark auto-connected for the correct account
      const effectAccountAddress = accountAddress;

      const handleNativeConnect = async (device: HIDDevice | USBDevice) => {
        if (abortSignal.aborted) {
          return;
        }

        const newDeviceId = device.productId.toString();

        const currentPermissionState =
          await checkHardwareWalletPermission(walletType);

        // Check abort after async operation
        if (abortSignal.aborted) {
          return;
        }

        setDeviceId(newDeviceId);
        setHardwareConnectionPermissionState(currentPermissionState);

        if (
          currentPermissionState ===
            HardwareConnectionPermissionState.Granted &&
          !adapterRef.current?.isConnected()
        ) {
          // Synchronous check-and-set to prevent race condition
          // This must happen atomically before any async work
          if (isConnectingRef.current) {
            return;
          }
          isConnectingRef.current = true;

          const connect = connectRef.current;
          if (connect) {
            try {
              await connect();
              if (!abortSignal.aborted) {
                setDeviceIdRef(newDeviceId);
                setAutoConnected(effectAccountAddress, newDeviceId);
              }
            } catch {
              // Connection failed, don't mark as connected
              // Error is already handled by connectRef implementation
            } finally {
              // Reset connecting state when done (success or failure)
              isConnectingRef.current = false;
            }
          } else {
            // No connect function available, reset the flag
            isConnectingRef.current = false;
          }
        }
      };

      const handleNativeDisconnect = async (device: HIDDevice | USBDevice) => {
        if (abortSignal.aborted) {
          return;
        }

        const disconnectedDeviceId = device.productId.toString();
        if (deviceIdRef.current === disconnectedDeviceId) {
          handleDisconnect();

          const currentPermissionState =
            await checkHardwareWalletPermission(walletType);

          if (abortSignal.aborted) {
            return;
          }

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

      return () => {
        unsubscribe?.();
        abortController.abort();
      };
    },
    // Ignore refs in dep array
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      isHardwareWalletAccount,
      walletType,
      hardwareConnectionPermissionState,
      isWebHidAvailable,
      isWebUsbAvailable,
      handleDisconnect,
      setDeviceId,
      setHardwareConnectionPermissionState,
      setAutoConnected,
    ],
  );

  // Auto-connection effect
  useEffect(
    () => {
      if (
        !isHardwareWalletAccount ||
        !walletType ||
        hardwareConnectionPermissionState !==
          HardwareConnectionPermissionState.Granted
      ) {
        resetAutoConnectState();
        return undefined;
      }

      const shouldSkipAutoConnect =
        hasAutoConnectedRef.current &&
        lastConnectedAccountRef.current === accountAddress;
      if (shouldSkipAutoConnect) {
        return undefined;
      }

      const abortController = new AbortController();
      const abortSignal = abortController.signal;

      // Capture the account address at the time this effect starts
      // so we only mark auto-connected for the correct account
      const effectAccountAddress = accountAddress;

      getHardwareWalletDeviceId(walletType)
        .then(async (id) => {
          if (abortSignal.aborted) {
            return;
          }

          setDeviceId(id);

          if (
            id &&
            connectRef.current &&
            !adapterRef.current?.isConnected() &&
            !isConnectingRef.current &&
            !hasAutoConnectedRef.current
          ) {
            // Synchronous check-and-set to prevent race condition with handleNativeConnect
            // This must happen atomically before any async work
            isConnectingRef.current = true;

            const connect = connectRef.current;
            try {
              await connect();
              // Check cancellation again after async connect completes
              if (!abortSignal.aborted) {
                setDeviceIdRef(id);
                setAutoConnected(effectAccountAddress ?? null, id);
              }
            } catch {
              // Connection failed, don't mark as auto-connected
              // Error is already handled by connectRef implementation
            } finally {
              // Reset connecting state when done (success or failure)
              isConnectingRef.current = false;
            }
          }
        })
        .catch(() => {
          // Swallow errors; auto-connect best-effort only.
        });

      return () => {
        abortController.abort();
      };
    },
    // Ignore refs in dep array
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      isHardwareWalletAccount,
      accountAddress,
      walletType,
      hardwareConnectionPermissionState,
      setDeviceId,
      resetAutoConnectState,
      setAutoConnected,
    ],
  );
};
