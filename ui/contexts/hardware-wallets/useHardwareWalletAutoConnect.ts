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
    isEnsuringDeviceReadyRef,
    connectRef,
    hasAutoConnectedRef,
    lastConnectedAccountRef,
  } = refs;

  useEffect(
    () => {
      if (
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
        try {
          if (abortSignal.aborted || isEnsuringDeviceReadyRef.current) {
            return;
          }

          const currentPermissionState =
            await checkHardwareWalletPermission(walletType);

          if (abortSignal.aborted || isEnsuringDeviceReadyRef.current) {
            return;
          }

          setHardwareConnectionPermissionState(currentPermissionState);
          if (
            currentPermissionState !== HardwareConnectionPermissionState.Granted
          ) {
            return;
          }

          if (adapterRef.current?.isConnected()) {
            updateConnectionState(ConnectionState.connected());
            return;
          }

          if (isConnectingRef.current || !connectRef.current) {
            return;
          }

          isConnectingRef.current = true;
          try {
            await connectRef.current();
            if (!abortSignal.aborted && adapterRef.current?.isConnected()) {
              updateConnectionState(ConnectionState.connected());
              setAutoConnected(effectAccountAddress);
            } else if (!abortSignal.aborted && !isOnAutoConnectRoute) {
              updateConnectionState(ConnectionState.disconnected());
            }
          } catch {
            if (!abortSignal.aborted && !isOnAutoConnectRoute) {
              updateConnectionState(ConnectionState.disconnected());
            }
          } finally {
            isConnectingRef.current = false;
          }
        } catch {
          // Swallow errors; auto-connect best-effort only.
        }
      };

      const runNativeDisconnect = async () => {
        if (abortSignal.aborted || isEnsuringDeviceReadyRef.current) {
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

      const handleNativeDisconnect = () => {
        runNativeDisconnect().catch(() => {
          // Best-effort; permission refresh after disconnect should not surface as unhandled.
        });
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
          if (
            abortSignal.aborted ||
            isEnsuringDeviceReadyRef.current ||
            devices.length === 0
          ) {
            return;
          }

          handleNativeConnect();
        })
        .catch(() => {
          // Swallow errors from getConnectedDevices; connect path uses its own catch.
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
      isHardwareWalletAccount,
      walletType,
      hardwareConnectionPermissionState,
      isWebHidAvailable,
      isWebUsbAvailable,
      handleDisconnect,
      isOnAutoConnectRoute,
      setHardwareConnectionPermissionState,
      updateConnectionState,
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

      getConnectedDevices(walletType)
        .then(async (devices) => {
          if (abortSignal.aborted || isEnsuringDeviceReadyRef.current) {
            return;
          }

          if (
            devices.length > 0 &&
            connectRef.current &&
            !adapterRef.current?.isConnected() &&
            !isConnectingRef.current &&
            !hasAutoConnectedRef.current
          ) {
            // Synchronous check-and-set to prevent race condition with runNativeConnect
            // This must happen atomically before any async work
            isConnectingRef.current = true;

            const connect = connectRef.current;
            try {
              await connect();
              if (!abortSignal.aborted && adapterRef.current?.isConnected()) {
                updateConnectionState(ConnectionState.connected());
                setAutoConnected(effectAccountAddress ?? null);
              } else if (!abortSignal.aborted && !isOnAutoConnectRoute) {
                updateConnectionState(ConnectionState.disconnected());
              }
            } catch {
              if (!abortSignal.aborted && !isOnAutoConnectRoute) {
                updateConnectionState(ConnectionState.disconnected());
              }
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
      isHardwareWalletAccount,
      accountAddress,
      walletType,
      hardwareConnectionPermissionState,
      isOnAutoConnectRoute,
      resetAutoConnectState,
      setAutoConnected,
      updateConnectionState,
    ],
  );
};
