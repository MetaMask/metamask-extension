/**
 * Hardware Wallet Context - Hardware Wallet Permissions Tests
 *
 * Tests for:
 * - Hardware wallet permission checking (WebHID for Ledger, WebUSB for Trezor)
 * - Hardware wallet permission requesting
 * - Permission state updates
 * - Protocol availability (WebHID/WebUSB)
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { KeyringTypes } from '@metamask/keyring-controller';
import {
  HardwareWalletProvider,
  useHardwareWalletActions,
  useHardwareWalletConfig,
} from './HardwareWalletContext';
import { HardwareWalletType, HardwareConnectionPermissionState } from './types';
import * as webHIDUtils from './webHIDUtils';
import { setupWebHIDUtilsMocks } from './__mocks__/webHIDUtils';

const mockStore = configureStore([]);

const createMockState = (
  keyringType: string | null = KeyringTypes.ledger,
  address = '0x123',
) => ({
  metamask: {
    internalAccounts: {
      accounts: {
        'account-1': {
          id: 'account-1',
          address,
          metadata: {
            keyring: {
              type: keyringType,
            },
          },
        },
      },
      selectedAccount: 'account-1',
    },
  },
});

jest.mock('./webHIDUtils');

describe('Hardware Wallet Context - Hardware Wallet Permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupWebHIDUtilsMocks();
    // Override defaults for permissions tests (unknown permissions, successful requests, no devices)
    (webHIDUtils.checkHardwareWalletPermission as jest.Mock).mockResolvedValue(
      HardwareConnectionPermissionState.Unknown,
    );
    (webHIDUtils.checkWebHIDPermission as jest.Mock).mockResolvedValue(
      HardwareConnectionPermissionState.Unknown,
    );
    (webHIDUtils.checkWebUSBPermission as jest.Mock).mockResolvedValue(
      HardwareConnectionPermissionState.Unknown,
    );
    (
      webHIDUtils.requestHardwareWalletPermission as jest.Mock
    ).mockResolvedValue(true);
    (webHIDUtils.requestWebHIDPermission as jest.Mock).mockResolvedValue(true);
    (webHIDUtils.requestWebUSBPermission as jest.Mock).mockResolvedValue(true);
    (webHIDUtils.getDeviceId as jest.Mock).mockResolvedValue(null);
    (webHIDUtils.getHardwareWalletDeviceId as jest.Mock).mockResolvedValue(
      null,
    );
  });

  describe('checkHardwareWalletPermission', () => {
    it('checks and returns permission state for Ledger wallet', async () => {
      (
        webHIDUtils.checkHardwareWalletPermission as jest.Mock
      ).mockResolvedValue(HardwareConnectionPermissionState.Granted);

      const store = mockStore(createMockState(KeyringTypes.ledger));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(
        () => ({
          actions: useHardwareWalletActions(),
          config: useHardwareWalletConfig(),
        }),
        { wrapper },
      );

      let permissionState: HardwareConnectionPermissionState | undefined;
      await act(async () => {
        permissionState =
          await result.current.actions.checkHardwareWalletPermission(
            HardwareWalletType.Ledger,
          );
      });

      expect(permissionState).toBe(HardwareConnectionPermissionState.Granted);
      expect(result.current.config.hardwareConnectionPermissionState).toBe(
        HardwareConnectionPermissionState.Granted,
      );
    });

    it('returns DENIED when WebHID is not available for Ledger', async () => {
      (webHIDUtils.isWebHIDAvailable as jest.Mock).mockReturnValue(false);

      const store = mockStore(createMockState(KeyringTypes.ledger));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(
        () => ({
          actions: useHardwareWalletActions(),
          config: useHardwareWalletConfig(),
        }),
        { wrapper },
      );

      let permissionState: HardwareConnectionPermissionState | undefined;
      await act(async () => {
        permissionState =
          await result.current.actions.checkHardwareWalletPermission(
            HardwareWalletType.Ledger,
          );
      });

      expect(permissionState).toBe(HardwareConnectionPermissionState.Denied);
      expect(result.current.config.isWebHidAvailable).toBe(false);
    });

    it('handles permission check with PROMPT state', async () => {
      (webHIDUtils.isWebHIDAvailable as jest.Mock).mockReturnValue(true);
      (
        webHIDUtils.checkHardwareWalletPermission as jest.Mock
      ).mockResolvedValue(HardwareConnectionPermissionState.Prompt);

      const store = mockStore(createMockState(KeyringTypes.ledger));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(
        () => ({
          actions: useHardwareWalletActions(),
          config: useHardwareWalletConfig(),
        }),
        { wrapper },
      );

      let permissionState: HardwareConnectionPermissionState | undefined;
      await act(async () => {
        permissionState =
          await result.current.actions.checkHardwareWalletPermission(
            HardwareWalletType.Ledger,
          );
      });

      expect(permissionState).toBe(HardwareConnectionPermissionState.Prompt);
      expect(result.current.config.hardwareConnectionPermissionState).toBe(
        HardwareConnectionPermissionState.Prompt,
      );
    });

    it('returns DENIED when WebUSB is not available for Trezor', async () => {
      (webHIDUtils.isWebUSBAvailable as jest.Mock).mockReturnValue(false);

      const store = mockStore(createMockState(KeyringTypes.trezor));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(
        () => ({
          actions: useHardwareWalletActions(),
          config: useHardwareWalletConfig(),
        }),
        { wrapper },
      );

      let permissionState: HardwareConnectionPermissionState | undefined;
      await act(async () => {
        permissionState =
          await result.current.actions.checkHardwareWalletPermission(
            HardwareWalletType.Trezor,
          );
      });

      expect(permissionState).toBe(HardwareConnectionPermissionState.Denied);
      expect(result.current.config.isWebUsbAvailable).toBe(false);
    });
  });

  describe('requestHardwareWalletPermission', () => {
    it('requests and grants permission for Ledger wallet', async () => {
      (webHIDUtils.isWebHIDAvailable as jest.Mock).mockReturnValue(true);
      (
        webHIDUtils.requestHardwareWalletPermission as jest.Mock
      ).mockResolvedValue(true);

      const store = mockStore(createMockState(KeyringTypes.ledger));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(
        () => ({
          actions: useHardwareWalletActions(),
          config: useHardwareWalletConfig(),
        }),
        { wrapper },
      );

      let granted: boolean | undefined;
      await act(async () => {
        granted = await result.current.actions.requestHardwareWalletPermission(
          HardwareWalletType.Ledger,
        );
      });

      expect(granted).toBe(true);
      expect(result.current.config.hardwareConnectionPermissionState).toBe(
        HardwareConnectionPermissionState.Granted,
      );
      expect(webHIDUtils.requestHardwareWalletPermission).toHaveBeenCalledWith(
        HardwareWalletType.Ledger,
      );
    });

    it('handles denied permission for Ledger wallet', async () => {
      (webHIDUtils.isWebHIDAvailable as jest.Mock).mockReturnValue(true);
      (
        webHIDUtils.requestHardwareWalletPermission as jest.Mock
      ).mockResolvedValue(false);

      const store = mockStore(createMockState(KeyringTypes.ledger));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(
        () => ({
          actions: useHardwareWalletActions(),
          config: useHardwareWalletConfig(),
        }),
        { wrapper },
      );

      let granted: boolean | undefined;
      await act(async () => {
        granted = await result.current.actions.requestHardwareWalletPermission(
          HardwareWalletType.Ledger,
        );
      });

      expect(granted).toBe(false);
      expect(result.current.config.hardwareConnectionPermissionState).toBe(
        HardwareConnectionPermissionState.Denied,
      );
    });

    it('returns false when WebHID is not available for Ledger', async () => {
      (webHIDUtils.isWebHIDAvailable as jest.Mock).mockReturnValue(false);

      const store = mockStore(createMockState(KeyringTypes.ledger));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(
        () => ({
          actions: useHardwareWalletActions(),
          config: useHardwareWalletConfig(),
        }),
        { wrapper },
      );

      let granted: boolean | undefined;
      await act(async () => {
        granted = await result.current.actions.requestHardwareWalletPermission(
          HardwareWalletType.Ledger,
        );
      });

      expect(granted).toBe(false);
      expect(result.current.config.isWebHidAvailable).toBe(false);
      expect(
        webHIDUtils.requestHardwareWalletPermission,
      ).not.toHaveBeenCalled();
    });

    it('requests and grants permission for Trezor wallet using WebUSB', async () => {
      (webHIDUtils.isWebUSBAvailable as jest.Mock).mockReturnValue(true);
      (
        webHIDUtils.requestHardwareWalletPermission as jest.Mock
      ).mockResolvedValue(true);

      const store = mockStore(createMockState(KeyringTypes.trezor));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(
        () => ({
          actions: useHardwareWalletActions(),
          config: useHardwareWalletConfig(),
        }),
        { wrapper },
      );

      let granted: boolean | undefined;
      await act(async () => {
        granted = await result.current.actions.requestHardwareWalletPermission(
          HardwareWalletType.Trezor,
        );
      });

      expect(granted).toBe(true);
      expect(result.current.config.hardwareConnectionPermissionState).toBe(
        HardwareConnectionPermissionState.Granted,
      );
      expect(webHIDUtils.requestHardwareWalletPermission).toHaveBeenCalledWith(
        HardwareWalletType.Trezor,
      );
    });

    it('returns false when WebUSB is not available for Trezor', async () => {
      (webHIDUtils.isWebUSBAvailable as jest.Mock).mockReturnValue(false);

      const store = mockStore(createMockState(KeyringTypes.trezor));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(
        () => ({
          actions: useHardwareWalletActions(),
          config: useHardwareWalletConfig(),
        }),
        { wrapper },
      );

      let granted: boolean | undefined;
      await act(async () => {
        granted = await result.current.actions.requestHardwareWalletPermission(
          HardwareWalletType.Trezor,
        );
      });

      expect(granted).toBe(false);
      expect(result.current.config.isWebUsbAvailable).toBe(false);
      expect(
        webHIDUtils.requestHardwareWalletPermission,
      ).not.toHaveBeenCalled();
    });
  });

  describe('Protocol availability', () => {
    it('detects WebHID availability for Ledger', () => {
      (webHIDUtils.isWebHIDAvailable as jest.Mock).mockReturnValue(true);

      const store = mockStore(createMockState(KeyringTypes.ledger));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(() => useHardwareWalletConfig(), {
        wrapper,
      });

      expect(result.current.isWebHidAvailable).toBe(true);
    });

    it('detects WebHID unavailability', () => {
      (webHIDUtils.isWebHIDAvailable as jest.Mock).mockReturnValue(false);

      const store = mockStore(createMockState(KeyringTypes.ledger));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(() => useHardwareWalletConfig(), {
        wrapper,
      });

      expect(result.current.isWebHidAvailable).toBe(false);
    });

    it('detects WebUSB availability for Trezor', () => {
      (webHIDUtils.isWebUSBAvailable as jest.Mock).mockReturnValue(true);

      const store = mockStore(createMockState(KeyringTypes.trezor));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(() => useHardwareWalletConfig(), {
        wrapper,
      });

      expect(result.current.isWebUsbAvailable).toBe(true);
    });

    it('detects WebUSB unavailability', () => {
      (webHIDUtils.isWebUSBAvailable as jest.Mock).mockReturnValue(false);

      const store = mockStore(createMockState(KeyringTypes.trezor));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(() => useHardwareWalletConfig(), {
        wrapper,
      });

      expect(result.current.isWebUsbAvailable).toBe(false);
    });
  });

  describe('permission state initialization', () => {
    it('initializes with UNKNOWN permission state', () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(() => useHardwareWalletConfig(), {
        wrapper,
      });

      expect(result.current.hardwareConnectionPermissionState).toBe(
        HardwareConnectionPermissionState.Unknown,
      );
    });

    it('auto-checks permission for Ledger wallet accounts', async () => {
      (webHIDUtils.isWebHIDAvailable as jest.Mock).mockReturnValue(true);
      (
        webHIDUtils.checkHardwareWalletPermission as jest.Mock
      ).mockResolvedValue(HardwareConnectionPermissionState.Granted);

      const store = mockStore(createMockState(KeyringTypes.ledger));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(() => useHardwareWalletConfig(), {
        wrapper,
      });

      expect(webHIDUtils.checkHardwareWalletPermission).toHaveBeenCalledWith(
        HardwareWalletType.Ledger,
      );

      // Flush any pending promises and state updates
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.hardwareConnectionPermissionState).toBe(
        HardwareConnectionPermissionState.Granted,
      );
    });

    it('auto-checks permission for Trezor wallet accounts', async () => {
      (webHIDUtils.isWebUSBAvailable as jest.Mock).mockReturnValue(true);
      (
        webHIDUtils.checkHardwareWalletPermission as jest.Mock
      ).mockResolvedValue(HardwareConnectionPermissionState.Granted);

      const store = mockStore(createMockState(KeyringTypes.trezor));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(() => useHardwareWalletConfig(), {
        wrapper,
      });

      expect(webHIDUtils.checkHardwareWalletPermission).toHaveBeenCalledWith(
        HardwareWalletType.Trezor,
      );

      // Flush any pending promises and state updates
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.hardwareConnectionPermissionState).toBe(
        HardwareConnectionPermissionState.Granted,
      );
    });
  });

  describe('permission updates after account switch', () => {
    it('re-checks permission when switching to hardware wallet account', async () => {
      (webHIDUtils.isWebHIDAvailable as jest.Mock).mockReturnValue(true);
      (
        webHIDUtils.checkHardwareWalletPermission as jest.Mock
      ).mockResolvedValue(HardwareConnectionPermissionState.Granted);

      // Start with non-hardware account
      const initialStore = mockStore(createMockState(KeyringTypes.hd));

      const InitialWrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={initialStore}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      renderHook(() => useHardwareWalletConfig(), {
        wrapper: InitialWrapper,
      });

      expect(webHIDUtils.checkHardwareWalletPermission).not.toHaveBeenCalled();

      // Switch to hardware wallet account - create new hook instance
      const updatedStore = mockStore(createMockState(KeyringTypes.ledger));

      const UpdatedWrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={updatedStore}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(() => useHardwareWalletConfig(), {
        wrapper: UpdatedWrapper,
      });

      expect(result.current.isHardwareWalletAccount).toBe(true);
      expect(webHIDUtils.checkHardwareWalletPermission).toHaveBeenCalledWith(
        HardwareWalletType.Ledger,
      );

      // Flush any pending promises and state updates
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.hardwareConnectionPermissionState).toBe(
        HardwareConnectionPermissionState.Granted,
      );
    });
  });
});
