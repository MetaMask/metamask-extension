import { renderHook } from '@testing-library/react-hooks';
import { useHardwareWalletPermissions } from './useHardwareWalletPermissions';
import {
  HardwareWalletType,
  HardwareConnectionPermissionState,
  type HardwareWalletConnectionState,
} from './types';
import { ConnectionState } from './connectionState';
import * as webConnectionUtils from './webConnectionUtils';
import { resetwebConnectionUtilsMocks } from './__mocks__/webConnectionUtils';

jest.mock('./webConnectionUtils');

describe('useHardwareWalletPermissions', () => {
  let mockState: {
    deviceId: string | null;
    hardwareConnectionPermissionState: HardwareConnectionPermissionState;
    currentAppName: string | null;
    connectionState: HardwareWalletConnectionState;
    walletType: HardwareWalletType | null;
    isHardwareWalletAccount: boolean;
    accountAddress: string | null;
  };
  let mockRefs: {
    abortControllerRef: { current: AbortController };
  };
  let mockSetHardwareConnectionPermissionState: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    resetwebConnectionUtilsMocks();

    mockSetHardwareConnectionPermissionState = jest.fn();

    mockState = {
      deviceId: null,
      hardwareConnectionPermissionState:
        HardwareConnectionPermissionState.Unknown,
      currentAppName: null,
      connectionState: ConnectionState.disconnected(),
      walletType: HardwareWalletType.Ledger,
      isHardwareWalletAccount: true,
      accountAddress: null,
    };

    mockRefs = {
      abortControllerRef: { current: new AbortController() },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const setupHook = (isWebHidAvailable = true, isWebUsbAvailable = false) => {
    return renderHook(() =>
      useHardwareWalletPermissions({
        state: mockState,
        refs: mockRefs,
        setHardwareConnectionPermissionState:
          mockSetHardwareConnectionPermissionState,
        isWebHidAvailable,
        isWebUsbAvailable,
      }),
    );
  };

  describe('initial permission check effect', () => {
    it('checks permissions for hardware wallet accounts', async () => {
      (
        webConnectionUtils.checkHardwareWalletPermission as jest.Mock
      ).mockResolvedValue(HardwareConnectionPermissionState.Granted);

      setupHook();

      // Wait for useEffect to run
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(
        webConnectionUtils.checkHardwareWalletPermission,
      ).toHaveBeenCalledWith(HardwareWalletType.Ledger);
      expect(mockSetHardwareConnectionPermissionState).toHaveBeenCalledWith(
        HardwareConnectionPermissionState.Granted,
      );
    });

    it('does not check permissions for non-hardware wallet accounts', async () => {
      mockState.isHardwareWalletAccount = false;
      mockState.walletType = null;

      setupHook();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(
        webConnectionUtils.checkHardwareWalletPermission,
      ).not.toHaveBeenCalled();
    });

    it('handles permission check errors gracefully', async () => {
      (
        webConnectionUtils.checkHardwareWalletPermission as jest.Mock
      ).mockRejectedValue(new Error('Permission check failed'));

      setupHook();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockSetHardwareConnectionPermissionState).toHaveBeenCalledWith(
        HardwareConnectionPermissionState.Unknown,
      );
    });

    it('aborts when AbortController is aborted', async () => {
      mockRefs.abortControllerRef.current.abort();

      setupHook();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockSetHardwareConnectionPermissionState).not.toHaveBeenCalled();
    });

    it('aborts when AbortController is aborted during error handling', async () => {
      (
        webConnectionUtils.checkHardwareWalletPermission as jest.Mock
      ).mockRejectedValue(new Error('Permission check failed'));

      mockRefs.abortControllerRef.current.abort();

      setupHook();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockSetHardwareConnectionPermissionState).not.toHaveBeenCalled();
    });
  });

  describe('checkHardwareWalletPermissionAction', () => {
    it('checks and returns permission state for Ledger', async () => {
      (
        webConnectionUtils.checkHardwareWalletPermission as jest.Mock
      ).mockResolvedValue(HardwareConnectionPermissionState.Granted);

      const { result } = setupHook();

      const permissionState =
        await result.current.checkHardwareWalletPermissionAction(
          HardwareWalletType.Ledger,
        );

      expect(permissionState).toBe(HardwareConnectionPermissionState.Granted);
      expect(mockSetHardwareConnectionPermissionState).toHaveBeenCalledWith(
        HardwareConnectionPermissionState.Granted,
      );
      expect(
        webConnectionUtils.checkHardwareWalletPermission,
      ).toHaveBeenCalledWith(HardwareWalletType.Ledger);
    });

    it('checks and returns permission state for Trezor', async () => {
      (
        webConnectionUtils.checkHardwareWalletPermission as jest.Mock
      ).mockResolvedValue(HardwareConnectionPermissionState.Denied);

      const { result } = setupHook(false, true);

      const permissionState =
        await result.current.checkHardwareWalletPermissionAction(
          HardwareWalletType.Trezor,
        );

      expect(permissionState).toBe(HardwareConnectionPermissionState.Denied);
      expect(mockSetHardwareConnectionPermissionState).toHaveBeenCalledWith(
        HardwareConnectionPermissionState.Denied,
      );
    });

    it('handles different permission states', async () => {
      const testCases = [
        HardwareConnectionPermissionState.Granted,
        HardwareConnectionPermissionState.Denied,
        HardwareConnectionPermissionState.Prompt,
        HardwareConnectionPermissionState.Unknown,
      ];

      for (const state of testCases) {
        (
          webConnectionUtils.checkHardwareWalletPermission as jest.Mock
        ).mockResolvedValue(state);

        const { result } = setupHook();

        const permissionState =
          await result.current.checkHardwareWalletPermissionAction(
            HardwareWalletType.Ledger,
          );

        expect(permissionState).toBe(state);
        expect(mockSetHardwareConnectionPermissionState).toHaveBeenCalledWith(
          state,
        );

        jest.clearAllMocks();
      }
    });
  });

  describe('requestHardwareWalletPermissionAction', () => {
    it('requests and grants permission for Ledger when WebHID is available', async () => {
      (
        webConnectionUtils.requestHardwareWalletPermission as jest.Mock
      ).mockResolvedValue(true);

      const { result } = setupHook(true, false);

      const granted =
        await result.current.requestHardwareWalletPermissionAction(
          HardwareWalletType.Ledger,
        );

      expect(granted).toBe(true);
      expect(mockSetHardwareConnectionPermissionState).toHaveBeenCalledWith(
        HardwareConnectionPermissionState.Granted,
      );
      expect(
        webConnectionUtils.requestHardwareWalletPermission,
      ).toHaveBeenCalledWith(HardwareWalletType.Ledger);
    });

    it('requests and grants permission for Trezor when WebUSB is available', async () => {
      (
        webConnectionUtils.requestHardwareWalletPermission as jest.Mock
      ).mockResolvedValue(true);

      const { result } = setupHook(false, true);

      const granted =
        await result.current.requestHardwareWalletPermissionAction(
          HardwareWalletType.Trezor,
        );

      expect(granted).toBe(true);
      expect(mockSetHardwareConnectionPermissionState).toHaveBeenCalledWith(
        HardwareConnectionPermissionState.Granted,
      );
      expect(
        webConnectionUtils.requestHardwareWalletPermission,
      ).toHaveBeenCalledWith(HardwareWalletType.Trezor);
    });

    it('denies permission when WebHID is not available for Ledger', async () => {
      mockState.isHardwareWalletAccount = false;
      mockState.walletType = null;

      const { result } = setupHook(false, false);

      const granted =
        await result.current.requestHardwareWalletPermissionAction(
          HardwareWalletType.Ledger,
        );

      expect(granted).toBe(false);
      expect(mockSetHardwareConnectionPermissionState).not.toHaveBeenCalled();
      expect(
        webConnectionUtils.requestHardwareWalletPermission,
      ).not.toHaveBeenCalled();
    });

    it('denies permission when WebUSB is not available for Trezor', async () => {
      mockState.isHardwareWalletAccount = false;
      mockState.walletType = null;

      const { result } = setupHook(false, false);

      const granted =
        await result.current.requestHardwareWalletPermissionAction(
          HardwareWalletType.Trezor,
        );

      expect(granted).toBe(false);
      expect(mockSetHardwareConnectionPermissionState).not.toHaveBeenCalled();
      expect(
        webConnectionUtils.requestHardwareWalletPermission,
      ).not.toHaveBeenCalled();
    });

    it('handles denied permission request', async () => {
      (
        webConnectionUtils.requestHardwareWalletPermission as jest.Mock
      ).mockResolvedValue(false);

      const { result } = setupHook(true, false);

      const granted =
        await result.current.requestHardwareWalletPermissionAction(
          HardwareWalletType.Ledger,
        );

      expect(granted).toBe(false);
      expect(mockSetHardwareConnectionPermissionState).toHaveBeenCalledWith(
        HardwareConnectionPermissionState.Denied,
      );
    });

    it('handles permission request errors', async () => {
      (
        webConnectionUtils.checkHardwareWalletPermission as jest.Mock
      ).mockResolvedValue(HardwareConnectionPermissionState.Granted);
      (
        webConnectionUtils.requestHardwareWalletPermission as jest.Mock
      ).mockRejectedValue(new Error('Request failed'));

      const { result } = setupHook(true, false);

      await expect(
        result.current.requestHardwareWalletPermissionAction(
          HardwareWalletType.Ledger,
        ),
      ).rejects.toThrow('Request failed');

      // Permission state should only be updated by the initial check, not by the failed request
      expect(mockSetHardwareConnectionPermissionState).toHaveBeenCalledTimes(1);
      expect(mockSetHardwareConnectionPermissionState).toHaveBeenCalledWith(
        HardwareConnectionPermissionState.Granted,
      );
    });
  });
});
