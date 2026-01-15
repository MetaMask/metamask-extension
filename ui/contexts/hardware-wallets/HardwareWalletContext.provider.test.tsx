import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { KeyringTypes } from '@metamask/keyring-controller';
import {
  HardwareWalletProvider,
  useHardwareWalletConfig,
  useHardwareWalletState,
} from './HardwareWalletContext.split';
import {
  HardwareWalletType,
  HardwareConnectionPermissionState,
  ConnectionStatus,
} from './types';
import * as webConnectionUtils from './webConnectionUtils';
import { setupWebConnectionUtilsMocks } from './__mocks__/webConnectionUtils';

const mockStore = configureStore([]);

const createMockState = (
  keyringType: string | null = null,
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

jest.mock('./webConnectionUtils');

describe('Hardware Wallet Context - Provider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupWebConnectionUtilsMocks();

    // Override defaults for provider tests (unknown permissions, no devices)
    (webConnectionUtils.checkWebHIDPermission as jest.Mock).mockResolvedValue(
      HardwareConnectionPermissionState.Unknown,
    );
    (webConnectionUtils.checkWebUSBPermission as jest.Mock).mockResolvedValue(
      HardwareConnectionPermissionState.Unknown,
    );
    (
      webConnectionUtils.checkHardwareWalletPermission as jest.Mock
    ).mockResolvedValue(HardwareConnectionPermissionState.Unknown);
    (webConnectionUtils.requestWebHIDPermission as jest.Mock).mockResolvedValue(
      false,
    );
    (webConnectionUtils.requestWebUSBPermission as jest.Mock).mockResolvedValue(
      false,
    );
    (
      webConnectionUtils.requestHardwareWalletPermission as jest.Mock
    ).mockResolvedValue(false);
    (webConnectionUtils.getDeviceId as jest.Mock).mockResolvedValue(null);
    (
      webConnectionUtils.getHardwareWalletDeviceId as jest.Mock
    ).mockResolvedValue(null);
  });

  describe('initialization', () => {
    it('initializes with disconnected state', () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(() => useHardwareWalletState(), {
        wrapper,
      });

      expect(result.current.connectionState.status).toBe(
        ConnectionStatus.Disconnected,
      );
    });

    it('initializes with null wallet type and device ID', () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(() => useHardwareWalletConfig(), {
        wrapper,
      });

      expect(result.current.walletType).toBe(HardwareWalletType.Ledger);
      expect(result.current.deviceId).toBeNull();
    });

    it('detects WebHID availability on mount', () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      renderHook(() => useHardwareWalletConfig(), { wrapper });

      expect(webConnectionUtils.isWebHIDAvailable).toHaveBeenCalled();
    });
  });

  describe('account type detection', () => {
    it('detects Ledger hardware wallet account', () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(() => useHardwareWalletConfig(), {
        wrapper,
      });

      expect(result.current.isHardwareWalletAccount).toBe(true);
      expect(result.current.walletType).toBe(HardwareWalletType.Ledger);
    });

    it('detects non-hardware wallet account', () => {
      const store = mockStore(createMockState(KeyringTypes.hd));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(() => useHardwareWalletConfig(), {
        wrapper,
      });

      expect(result.current.isHardwareWalletAccount).toBe(false);
      expect(result.current.walletType).toBeNull();
    });

    it('handles account with no keyring type', () => {
      const store = mockStore(createMockState(null));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(() => useHardwareWalletConfig(), {
        wrapper,
      });

      expect(result.current.isHardwareWalletAccount).toBe(false);
      expect(result.current.walletType).toBeNull();
    });
  });

  describe('hardware wallet permission checking', () => {
    it('checks hardware wallet permission for Ledger accounts', async () => {
      (
        webConnectionUtils.checkHardwareWalletPermission as jest.Mock
      ).mockResolvedValue(HardwareConnectionPermissionState.Granted);

      const store = mockStore(createMockState(KeyringTypes.ledger));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result, waitForNextUpdate } = renderHook(
        () => useHardwareWalletConfig(),
        { wrapper },
      );

      await act(async () => {
        await waitForNextUpdate({ timeout: 1000 });
      });

      expect(
        webConnectionUtils.checkHardwareWalletPermission,
      ).toHaveBeenCalled();
      expect(result.current.hardwareConnectionPermissionState).toBe(
        HardwareConnectionPermissionState.Granted,
      );
    });

    it('skips hardware wallet permission check for non-hardware wallet accounts', () => {
      const store = mockStore(createMockState(KeyringTypes.hd));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      renderHook(() => useHardwareWalletConfig(), { wrapper });

      expect(
        webConnectionUtils.checkHardwareWalletPermission,
      ).not.toHaveBeenCalled();
    });

    it('skips hardware wallet permission check when both WebHID and WebUSB are unavailable', () => {
      jest.clearAllMocks();
      (webConnectionUtils.isWebHIDAvailable as jest.Mock).mockReturnValue(
        false,
      );
      (webConnectionUtils.isWebUSBAvailable as jest.Mock).mockReturnValue(
        false,
      );
      (
        webConnectionUtils.checkHardwareWalletPermission as jest.Mock
      ).mockResolvedValue(HardwareConnectionPermissionState.Unknown);
      (webConnectionUtils.subscribeToWebHIDEvents as jest.Mock).mockReturnValue(
        jest.fn(),
      );
      (webConnectionUtils.subscribeToWebUSBEvents as jest.Mock).mockReturnValue(
        jest.fn(),
      );
      (
        webConnectionUtils.subscribeToHardwareWalletEvents as jest.Mock
      ).mockReturnValue(jest.fn());
      (webConnectionUtils.getDeviceId as jest.Mock).mockResolvedValue(null);
      (
        webConnectionUtils.getHardwareWalletDeviceId as jest.Mock
      ).mockResolvedValue(null);

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
      expect(result.current.isWebUsbAvailable).toBe(false);
      expect(
        webConnectionUtils.checkHardwareWalletPermission,
      ).not.toHaveBeenCalled();
    });
  });

  describe('error conditions', () => {
    it('handles WebHID permission check failure gracefully', async () => {
      const mockError = new Error('Permission denied');
      (
        webConnectionUtils.checkHardwareWalletPermission as jest.Mock
      ).mockRejectedValueOnce(mockError);

      const store = mockStore(createMockState(KeyringTypes.ledger));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(() => useHardwareWalletConfig(), {
        wrapper,
      });

      // The permission state should remain Unknown when the check fails
      expect(result.current.hardwareConnectionPermissionState).toBe(
        HardwareConnectionPermissionState.Unknown,
      );
    });

    it('handles WebUSB permission check failure gracefully', async () => {
      const mockError = new Error('USB permission denied');
      (
        webConnectionUtils.checkWebUSBPermission as jest.Mock
      ).mockRejectedValueOnce(mockError);

      const store = mockStore(createMockState(KeyringTypes.trezor));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(() => useHardwareWalletConfig(), {
        wrapper,
      });

      // The permission state should remain Unknown when the check fails
      expect(result.current.hardwareConnectionPermissionState).toBe(
        HardwareConnectionPermissionState.Unknown,
      );
    });

    it('handles device ID retrieval failure gracefully', () => {
      const mockError = new Error('Device ID unavailable');
      (webConnectionUtils.getDeviceId as jest.Mock).mockRejectedValueOnce(
        mockError,
      );

      const store = mockStore(createMockState(KeyringTypes.ledger));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(() => useHardwareWalletConfig(), {
        wrapper,
      });

      // Device ID should remain null when retrieval fails
      expect(result.current.deviceId).toBeNull();
    });
  });
});
