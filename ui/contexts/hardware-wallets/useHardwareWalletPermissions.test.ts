import { renderHook, act } from '@testing-library/react-hooks';
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
    abortControllerRef: { current: AbortController | null };
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

  const setupHook = () => {
    return renderHook(() =>
      useHardwareWalletPermissions({
        state: mockState,
        refs: mockRefs,
        setHardwareConnectionPermissionState:
          mockSetHardwareConnectionPermissionState,
      }),
    );
  };

  describe('initial permission check effect', () => {
    it('checks permissions for hardware wallet accounts', async () => {
      let resolvePermission: (value: HardwareConnectionPermissionState) => void;
      (
        webConnectionUtils.checkHardwareWalletPermission as jest.Mock
      ).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePermission = resolve;
          }),
      );

      setupHook();

      // Resolve the permission check
      await act(async () => {
        resolvePermission(HardwareConnectionPermissionState.Granted);
      });

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

      // Give effect time to run (or not run)
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(
        webConnectionUtils.checkHardwareWalletPermission,
      ).not.toHaveBeenCalled();
    });

    it('handles permission check errors gracefully', async () => {
      let rejectPermission: (error: Error) => void;
      (
        webConnectionUtils.checkHardwareWalletPermission as jest.Mock
      ).mockImplementation(
        () =>
          new Promise((_, reject) => {
            rejectPermission = reject;
          }),
      );

      setupHook();

      // Reject the permission check
      await act(async () => {
        rejectPermission(new Error('Permission check failed'));
      });

      expect(mockSetHardwareConnectionPermissionState).toHaveBeenCalledWith(
        HardwareConnectionPermissionState.Unknown,
      );
    });

    it('does not update state when AbortController is aborted before effect runs', async () => {
      mockRefs.abortControllerRef.current?.abort();

      setupHook();

      // Give effect time to check abort status
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(mockSetHardwareConnectionPermissionState).not.toHaveBeenCalled();
    });

    it('does not update state when component unmounts during permission check', async () => {
      let resolvePermissionCheck: (
        value: HardwareConnectionPermissionState,
      ) => void;
      (
        webConnectionUtils.checkHardwareWalletPermission as jest.Mock
      ).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePermissionCheck = resolve;
          }),
      );

      const { unmount } = setupHook();

      // Unmount before the permission check resolves
      unmount();

      // Resolve the permission check after unmount
      await act(async () => {
        resolvePermissionCheck(HardwareConnectionPermissionState.Granted);
      });

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

      const { result } = setupHook();

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
        jest.clearAllMocks();
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
      }
    });

    it('prevents race conditions when called successively', async () => {
      // Disable the initial effect to isolate this test
      mockState.isHardwareWalletAccount = false;
      mockState.walletType = null;

      let firstResolve: (value: HardwareConnectionPermissionState) => void;
      let secondResolve: (value: HardwareConnectionPermissionState) => void;

      const mockCheckPermission =
        webConnectionUtils.checkHardwareWalletPermission as jest.Mock;

      // First call returns a promise we control
      mockCheckPermission.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            firstResolve = resolve;
          }),
      );

      // Second call returns a promise we control
      mockCheckPermission.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            secondResolve = resolve;
          }),
      );

      const { result } = setupHook();

      // Start first request (Ledger)
      const firstPromise = result.current.checkHardwareWalletPermissionAction(
        HardwareWalletType.Ledger,
      );

      // Start second request (Trezor) - this should abort the first
      const secondPromise = result.current.checkHardwareWalletPermissionAction(
        HardwareWalletType.Trezor,
      );

      // Resolve second request first
      await act(async () => {
        secondResolve(HardwareConnectionPermissionState.Prompt);
      });

      // Resolve first request after (stale)
      await act(async () => {
        firstResolve(HardwareConnectionPermissionState.Granted);
      });

      await act(async () => {
        await Promise.all([firstPromise, secondPromise]);
      });

      // Only the second (most recent) request should have updated state
      expect(mockSetHardwareConnectionPermissionState).toHaveBeenCalledTimes(1);
      expect(mockSetHardwareConnectionPermissionState).toHaveBeenCalledWith(
        HardwareConnectionPermissionState.Prompt,
      );
    });
  });

  describe('requestHardwareWalletPermissionAction', () => {
    it('requests and grants permission for Ledger', async () => {
      (
        webConnectionUtils.requestHardwareWalletPermission as jest.Mock
      ).mockResolvedValue(true);

      const { result } = setupHook();

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

    it('requests and grants permission for Trezor', async () => {
      (
        webConnectionUtils.requestHardwareWalletPermission as jest.Mock
      ).mockResolvedValue(true);

      const { result } = setupHook();

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

    it('handles denied permission request', async () => {
      (
        webConnectionUtils.requestHardwareWalletPermission as jest.Mock
      ).mockResolvedValue(false);

      const { result } = setupHook();

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

      const { result } = setupHook();

      await expect(
        result.current.requestHardwareWalletPermissionAction(
          HardwareWalletType.Ledger,
        ),
      ).rejects.toThrow('Request failed');
    });

    it('prevents race conditions when called successively', async () => {
      // Disable the initial effect to isolate this test
      mockState.isHardwareWalletAccount = false;
      mockState.walletType = null;

      let firstResolve: (value: boolean) => void;
      let secondResolve: (value: boolean) => void;

      const mockRequestPermission =
        webConnectionUtils.requestHardwareWalletPermission as jest.Mock;

      // First call returns a promise we control
      mockRequestPermission.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            firstResolve = resolve;
          }),
      );

      // Second call returns a promise we control
      mockRequestPermission.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            secondResolve = resolve;
          }),
      );

      const { result } = setupHook();

      // Start first request
      const firstPromise = result.current.requestHardwareWalletPermissionAction(
        HardwareWalletType.Ledger,
      );

      // Start second request - this should abort the first
      const secondPromise =
        result.current.requestHardwareWalletPermissionAction(
          HardwareWalletType.Trezor,
        );

      // Resolve second request first with denied
      await act(async () => {
        secondResolve(false);
      });

      // Resolve first request after with granted (stale)
      await act(async () => {
        firstResolve(true);
      });

      await act(async () => {
        await Promise.all([firstPromise, secondPromise]);
      });

      // Only the second (most recent) request should have updated state
      expect(mockSetHardwareConnectionPermissionState).toHaveBeenCalledTimes(1);
      expect(mockSetHardwareConnectionPermissionState).toHaveBeenCalledWith(
        HardwareConnectionPermissionState.Denied,
      );
    });
  });

  describe('cleanup on unmount', () => {
    it('aborts pending check requests on unmount', async () => {
      let resolveCheck: (value: HardwareConnectionPermissionState) => void;
      (
        webConnectionUtils.checkHardwareWalletPermission as jest.Mock
      ).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveCheck = resolve;
          }),
      );

      const { result, unmount } = setupHook();

      // Start a check request
      const checkPromise = result.current.checkHardwareWalletPermissionAction(
        HardwareWalletType.Ledger,
      );

      // Unmount the component
      unmount();

      // Resolve the request after unmount
      await act(async () => {
        resolveCheck(HardwareConnectionPermissionState.Granted);
        await checkPromise;
      });

      // State should not be updated since component unmounted
      expect(mockSetHardwareConnectionPermissionState).not.toHaveBeenCalled();
    });

    it('aborts pending request actions on unmount', async () => {
      let resolveRequest: (value: boolean) => void;
      (
        webConnectionUtils.requestHardwareWalletPermission as jest.Mock
      ).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveRequest = resolve;
          }),
      );

      const { result, unmount } = setupHook();

      // Start a request
      const requestPromise =
        result.current.requestHardwareWalletPermissionAction(
          HardwareWalletType.Ledger,
        );

      // Unmount the component
      unmount();

      // Resolve the request after unmount
      await act(async () => {
        resolveRequest(true);
        await requestPromise;
      });

      // State should not be updated since component unmounted
      expect(mockSetHardwareConnectionPermissionState).not.toHaveBeenCalled();
    });
  });
});
