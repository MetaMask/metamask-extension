import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  checkHardwareWalletPermission,
  getConnectedDevices,
  subscribeToWebHidEvents,
  subscribeToWebUsbEvents,
} from './webConnectionUtils';
import {
  HardwareWalletType,
  HardwareConnectionPermissionState,
  type HardwareWalletConnectionState,
} from './types';
import {
  type HardwareWalletState,
  type HardwareWalletRefs,
} from './HardwareWalletStateManager';
import { ConnectionState } from './connectionState';
import { isHardwareWalletRoute } from './utils';

type UseHardwareWalletAutoConnectParams = {
  state: HardwareWalletState;
  refs: HardwareWalletRefs;
  setHardwareConnectionPermissionState: (
    permission: HardwareConnectionPermissionState,
  ) => void;
  updateConnectionState: (newState: HardwareWalletConnectionState) => void;
  hardwareConnectionPermissionState: HardwareConnectionPermissionState;
  isWebHidAvailable: boolean;
  isWebUsbAvailable: boolean;
  handleDisconnect: (error?: unknown) => void;
  resetAutoConnectState: () => void;
  setAutoConnected: (accountAddress: string | null) => void;
};

export const useHardwareWalletAutoConnect = ({
  state,
  refs,
  setHardwareConnectionPermissionState,
  updateConnectionState,
  hardwareConnectionPermissionState,
  isWebHidAvailable,
  isWebUsbAvailable,
  handleDisconnect,
  resetAutoConnectState,
  setAutoConnected,
}: UseHardwareWalletAutoConnectParams) => {
  const { isHardwareWalletAccount, walletType, accountAddress } = state;
  const location = useLocation();
  const isOnAutoConnectRoute = isHardwareWalletRoute(location.pathname);

  const {
    adapterRef,
    isConnectingRef,
    connectRef,
    hasAutoConnectedRef,
    lastConnectedAccountRef,
  } = refs;

  useEffect(
    () => {
      if (
        !isOnAutoConnectRoute ||
        !isHardwareWalletAccount ||
        !walletType ||
        hardwareConnectionPermissionState ===
          HardwareConnectionPermissionState.Denied
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

      const handleNativeConnect = async () => {
        if (abortSignal.aborted) {
          return;
        }

        updateConnectionState(ConnectionState.connected());

        const currentPermissionState =
          await checkHardwareWalletPermission(walletType);

        // Check abort after async operation
        if (abortSignal.aborted) {
          return;
        }

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
                setAutoConnected(effectAccountAddress);
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

      const handleNativeDisconnect = async () => {
        if (abortSignal.aborted) {
          return;
        }

        if (!adapterRef.current?.isConnected()) {
          return;
        }

        handleDisconnect();

        const currentPermissionState =
          await checkHardwareWalletPermission(walletType);

        if (abortSignal.aborted) {
          return;
        }

        setHardwareConnectionPermissionState(currentPermissionState);
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

      getConnectedDevices(walletType)
        .then((devices) => {
          if (abortSignal.aborted || devices.length === 0) {
            return;
          }

          handleNativeConnect();
        })
        .catch(() => {
          // Swallow errors; auto-connect best-effort only.
        });

      return () => {
        unsubscribe?.();
        abortController.abort();
      };
    },
    // Ignore refs in dep array
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      isOnAutoConnectRoute,
      isHardwareWalletAccount,
      walletType,
      hardwareConnectionPermissionState,
      isWebHidAvailable,
      isWebUsbAvailable,
      handleDisconnect,
      setHardwareConnectionPermissionState,
      updateConnectionState,
      setAutoConnected,
    ],
  );

  // Auto-connection effect
  useEffect(
    () => {
      if (
        !isOnAutoConnectRoute ||
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

      getConnectedDevices(walletType)
        .then(async (devices) => {
          if (abortSignal.aborted) {
            return;
          }

          if (
            devices.length > 0 &&
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
                setAutoConnected(effectAccountAddress ?? null);
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
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      isOnAutoConnectRoute,
      isHardwareWalletAccount,
      accountAddress,
      walletType,
      hardwareConnectionPermissionState,
      resetAutoConnectState,
      setAutoConnected,
    ],
  );
};
