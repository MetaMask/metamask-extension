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
import * as webHIDUtils from './webHIDUtils';
import { setupWebHIDUtilsMocks } from './__mocks__/webHIDUtils';

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

jest.mock('./webHIDUtils');

describe('Hardware Wallet Context - Provider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupWebHIDUtilsMocks();

    // Override defaults for provider tests (unknown permissions, no devices)
    (webHIDUtils.checkWebHIDPermission as jest.Mock).mockResolvedValue(
      HardwareConnectionPermissionState.Unknown,
    );
    (webHIDUtils.checkWebUSBPermission as jest.Mock).mockResolvedValue(
      HardwareConnectionPermissionState.Unknown,
    );
    (webHIDUtils.checkHardwareWalletPermission as jest.Mock).mockResolvedValue(
      HardwareConnectionPermissionState.Unknown,
    );
    (webHIDUtils.requestWebHIDPermission as jest.Mock).mockResolvedValue(false);
    (webHIDUtils.requestWebUSBPermission as jest.Mock).mockResolvedValue(false);
    (
      webHIDUtils.requestHardwareWalletPermission as jest.Mock
    ).mockResolvedValue(false);
    (webHIDUtils.getDeviceId as jest.Mock).mockResolvedValue(null);
    (webHIDUtils.getHardwareWalletDeviceId as jest.Mock).mockResolvedValue(
      null,
    );
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

      expect(result.current.walletType).toBeNull();
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

      expect(webHIDUtils.isWebHIDAvailable).toHaveBeenCalled();
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
      expect(result.current.detectedWalletType).toBe(HardwareWalletType.Ledger);
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
      expect(result.current.detectedWalletType).toBeNull();
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
      expect(result.current.detectedWalletType).toBeNull();
    });
  });

  describe('hardware wallet permission checking', () => {
    it('checks hardware wallet permission for Ledger accounts', async () => {
      (
        webHIDUtils.checkHardwareWalletPermission as jest.Mock
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

      expect(webHIDUtils.checkHardwareWalletPermission).toHaveBeenCalled();
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

      expect(webHIDUtils.checkHardwareWalletPermission).not.toHaveBeenCalled();
    });

    it('skips hardware wallet permission check when both WebHID and WebUSB are unavailable', () => {
      jest.clearAllMocks();
      (webHIDUtils.isWebHIDAvailable as jest.Mock).mockReturnValue(false);
      (webHIDUtils.isWebUSBAvailable as jest.Mock).mockReturnValue(false);
      (
        webHIDUtils.checkHardwareWalletPermission as jest.Mock
      ).mockResolvedValue(HardwareConnectionPermissionState.Unknown);
      (webHIDUtils.subscribeToWebHIDEvents as jest.Mock).mockReturnValue(
        jest.fn(),
      );
      (webHIDUtils.subscribeToWebUSBEvents as jest.Mock).mockReturnValue(
        jest.fn(),
      );
      (
        webHIDUtils.subscribeToHardwareWalletEvents as jest.Mock
      ).mockReturnValue(jest.fn());
      (webHIDUtils.getDeviceId as jest.Mock).mockResolvedValue(null);
      (webHIDUtils.getHardwareWalletDeviceId as jest.Mock).mockResolvedValue(
        null,
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

      expect(result.current.isWebHidAvailable).toBe(false);
      expect(result.current.isWebUsbAvailable).toBe(false);
      expect(webHIDUtils.checkHardwareWalletPermission).not.toHaveBeenCalled();
    });
  });

  describe('error conditions', () => {
    it('handles WebHID permission check failure gracefully', async () => {
      const mockError = new Error('Permission denied');
      (
        webHIDUtils.checkHardwareWalletPermission as jest.Mock
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
      (webHIDUtils.checkWebUSBPermission as jest.Mock).mockRejectedValueOnce(
        mockError,
      );

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
      (webHIDUtils.getDeviceId as jest.Mock).mockRejectedValueOnce(mockError);

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
