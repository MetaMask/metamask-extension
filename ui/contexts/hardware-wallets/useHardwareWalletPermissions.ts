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

  const withHardwareWalletPermissions = useCallback(
    <ReturnType>(
      abortControllerRef: React.MutableRefObject<AbortController | null>,
      operation: (params: {
        abortController: AbortController;
        isAborted: () => boolean;
      }) => ReturnType,
    ): ReturnType => {
      // Abort any previous request (from effect re-runs or manual actions)
      // to prevent race conditions between initial check and manual actions
      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Check if the current (or previous) permission request has been aborted
      const isAborted = () =>
        abortController.signal.aborted ||
        Boolean(refs.abortControllerRef.current?.signal.aborted);

      // Run the operation. The operation must check if it's been aborted using
      // `isAborted` at any time before performing state updates.
      return operation({
        abortController,
        isAborted,
      });
    },
    [refs],
  );

  // Cleanup: abort any pending requests on unmount
  useEffect(() => {
    return () => {
      // We intentionally want the current ref values at cleanup time
      // to abort whatever is currently running
      // eslint-disable-next-line react-compiler/react-compiler, react-hooks/exhaustive-deps
      checkAbortControllerRef.current?.abort();
      // eslint-disable-next-line react-compiler/react-compiler, react-hooks/exhaustive-deps
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

    withHardwareWalletPermissions(
      checkAbortControllerRef,
      async ({ abortController: _abortController, isAborted }) => {
        try {
          const permissionState =
            await checkHardwareWalletPermission(walletType);

          if (!isAborted()) {
            setHardwareConnectionPermissionState(permissionState);
          }
        } catch {
          if (!isAborted()) {
            setHardwareConnectionPermissionState(
              HardwareConnectionPermissionState.Unknown,
            );
          }
        }
      },
    );

    return () => {
      // We intentionally want the current ref value at cleanup time
      // eslint-disable-next-line react-compiler/react-compiler, react-hooks/exhaustive-deps
      checkAbortControllerRef.current?.abort();
    };
    // Adding eslint ignore to exclude ref from dependencies
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isHardwareWalletAccount,
    walletType,
    setHardwareConnectionPermissionState,
    withHardwareWalletPermissions,
  ]);

  const checkHardwareWalletPermissionAction = useCallback(
    async (
      targetWalletType: HardwareWalletType,
    ): Promise<HardwareConnectionPermissionState> => {
      return withHardwareWalletPermissions(
        checkAbortControllerRef,
        async ({ isAborted }) => {
          const permissionState =
            await checkHardwareWalletPermission(targetWalletType);

          if (!isAborted()) {
            setHardwareConnectionPermissionState(permissionState);
          }

          return permissionState;
        },
      );
    },
    [setHardwareConnectionPermissionState, withHardwareWalletPermissions],
  );

  const requestHardwareWalletPermissionAction = useCallback(
    async (targetWalletType: HardwareWalletType): Promise<boolean> => {
      return withHardwareWalletPermissions(
        requestAbortControllerRef,
        async ({ isAborted }) => {
          const granted =
            await requestHardwareWalletPermission(targetWalletType);

          if (!isAborted()) {
            setHardwareConnectionPermissionState(
              granted
                ? HardwareConnectionPermissionState.Granted
                : HardwareConnectionPermissionState.Denied,
            );
          }

          return granted;
        },
      );
    },
    [setHardwareConnectionPermissionState, withHardwareWalletPermissions],
  );

  return {
    checkHardwareWalletPermissionAction,
    requestHardwareWalletPermissionAction,
  };
};
