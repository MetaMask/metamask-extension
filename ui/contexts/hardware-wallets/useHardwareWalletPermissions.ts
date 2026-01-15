import { useCallback, useEffect, useRef } from 'react';
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
};

export const useHardwareWalletPermissions = ({
  state,
  refs,
  setHardwareConnectionPermissionState,
}: UseHardwareWalletPermissionsParams) => {
  const { isHardwareWalletAccount, walletType } = state;

  // AbortControllers to prevent race conditions in permission actions
  const checkAbortControllerRef = useRef<AbortController | null>(null);
  const requestAbortControllerRef = useRef<AbortController | null>(null);

  // Cleanup: abort any pending requests on unmount
  useEffect(() => {
    return () => {
      checkAbortControllerRef.current?.abort();
      requestAbortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!isHardwareWalletAccount || !walletType) {
      return;
    }

    if (refs.abortControllerRef.current?.signal.aborted) {
      return;
    }

    let cancelled = false;

    checkHardwareWalletPermission(walletType)
      .then((permissionState) => {
        // Only update state if effect hasn't been cleaned up and not externally aborted
        if (!cancelled && !refs.abortControllerRef.current?.signal.aborted) {
          setHardwareConnectionPermissionState(permissionState);
        }
      })
      .catch(() => {
        // Only update state if effect hasn't been cleaned up and not externally aborted
        if (!cancelled && !refs.abortControllerRef.current?.signal.aborted) {
          setHardwareConnectionPermissionState(
            HardwareConnectionPermissionState.Unknown,
          );
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isHardwareWalletAccount,
    walletType,
    setHardwareConnectionPermissionState,
  ]);

  const checkHardwareWalletPermissionAction = useCallback(
    async (
      targetWalletType: HardwareWalletType,
    ): Promise<HardwareConnectionPermissionState> => {
      // Abort any previous check request to prevent race conditions
      checkAbortControllerRef.current?.abort();
      const abortController = new AbortController();
      checkAbortControllerRef.current = abortController;

      const permissionState =
        await checkHardwareWalletPermission(targetWalletType);

      // Only update state if this request wasn't aborted by a newer one
      if (!abortController.signal.aborted) {
        setHardwareConnectionPermissionState(permissionState);
      }

      return permissionState;
    },
    [setHardwareConnectionPermissionState],
  );

  const requestHardwareWalletPermissionAction = useCallback(
    async (targetWalletType: HardwareWalletType): Promise<boolean> => {
      // Abort any previous request to prevent race conditions
      requestAbortControllerRef.current?.abort();
      const abortController = new AbortController();
      requestAbortControllerRef.current = abortController;

      const granted = await requestHardwareWalletPermission(targetWalletType);

      // Only update state if this request wasn't aborted by a newer one
      if (!abortController.signal.aborted) {
        setHardwareConnectionPermissionState(
          granted
            ? HardwareConnectionPermissionState.Granted
            : HardwareConnectionPermissionState.Denied,
        );
      }

      return granted;
    },
    [setHardwareConnectionPermissionState],
  );

  return {
    checkHardwareWalletPermissionAction,
    requestHardwareWalletPermissionAction,
  };
};
