import { useCallback, useEffect } from 'react';
import {
  checkHardwareWalletPermission,
  requestHardwareWalletPermission,
} from './webConnectionUtils';
import { HardwareConnectionPermissionState, HardwareWalletType } from './types';
import { type HardwareWalletState } from './HardwareWalletStateManager';

type UseHardwareWalletPermissionsParams = {
  state: HardwareWalletState;
  refs: {
    abortControllerRef: React.MutableRefObject<AbortController | null>;
  };
  setHardwareConnectionPermissionState: (
    state: HardwareConnectionPermissionState,
  ) => void;
  isWebHidAvailable: boolean;
  isWebUsbAvailable: boolean;
};

export const useHardwareWalletPermissions = ({
  state,
  refs,
  setHardwareConnectionPermissionState,
  isWebHidAvailable,
  isWebUsbAvailable,
}: UseHardwareWalletPermissionsParams) => {
  const { isHardwareWalletAccount, walletType } = state;

  useEffect(() => {
    if (!isHardwareWalletAccount || !walletType) {
      return;
    }

    // Check if already aborted (for test scenarios or external abort)
    if (refs.abortControllerRef.current?.signal.aborted) {
      return;
    }

    checkHardwareWalletPermission(walletType)
      .then((permissionState) => {
        // Only update state if this walletType is still current and not aborted
        if (
          state.walletType === walletType &&
          !refs.abortControllerRef.current?.signal.aborted
        ) {
          setHardwareConnectionPermissionState(permissionState);
        }
      })
      .catch(() => {
        // Only update state if this walletType is still current and not aborted
        if (
          state.walletType === walletType &&
          !refs.abortControllerRef.current?.signal.aborted
        ) {
          setHardwareConnectionPermissionState(
            HardwareConnectionPermissionState.Unknown,
          );
        }
      });
  }, [
    isHardwareWalletAccount,
    walletType,
    state.walletType,
    setHardwareConnectionPermissionState,
    refs.abortControllerRef,
  ]);

  const checkHardwareWalletPermissionAction = useCallback(
    async (
      targetWalletType: HardwareWalletType,
    ): Promise<HardwareConnectionPermissionState> => {
      const permissionState =
        await checkHardwareWalletPermission(targetWalletType);
      setHardwareConnectionPermissionState(permissionState);
      return permissionState;
    },
    [setHardwareConnectionPermissionState],
  );

  const requestHardwareWalletPermissionAction = useCallback(
    async (targetWalletType: HardwareWalletType): Promise<boolean> => {
      const isLedger = targetWalletType === HardwareWalletType.Ledger;
      const isTrezor = targetWalletType === HardwareWalletType.Trezor;

      if (
        (isLedger && !isWebHidAvailable) ||
        (isTrezor && !isWebUsbAvailable)
      ) {
        return false;
      }

      const granted = await requestHardwareWalletPermission(targetWalletType);
      setHardwareConnectionPermissionState(
        granted
          ? HardwareConnectionPermissionState.Granted
          : HardwareConnectionPermissionState.Denied,
      );
      return granted;
    },
    [
      isWebHidAvailable,
      isWebUsbAvailable,
      setHardwareConnectionPermissionState,
    ],
  );

  return {
    checkHardwareWalletPermissionAction,
    requestHardwareWalletPermissionAction,
  };
};
