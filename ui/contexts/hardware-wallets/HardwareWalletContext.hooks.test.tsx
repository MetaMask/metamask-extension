import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { KeyringTypes } from '@metamask/keyring-controller';
import {
  HardwareWalletProvider,
  useHardwareWalletConfig,
  useHardwareWalletState,
  useHardwareWalletActions,
  useHardwareWallet,
} from './HardwareWalletContext.split';
import { HardwareWalletType, HardwareConnectionPermissionState } from './types';
import * as webHIDUtils from './webHIDUtils';
import { setupWebHIDUtilsMocks } from './__mocks__/webHIDUtils';

jest.mock('./webHIDUtils');

const mockStore = configureStore([]);

const createMockState = (isHardwareWallet = false) => ({
  metamask: {
    internalAccounts: {
      accounts: {
        'account-1': {
          id: 'account-1',
          address: '0x123',
          metadata: {
            keyring: {
              type: isHardwareWallet ? KeyringTypes.ledger : KeyringTypes.hd,
            },
          },
        },
      },
      selectedAccount: 'account-1',
    },
  },
});

describe('Hardware Wallet Context - Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupWebHIDUtilsMocks();
    // Override defaults for hooks tests (unavailable APIs, unknown permissions, no devices)
    (webHIDUtils.isWebHIDAvailable as jest.Mock).mockReturnValue(false);
    (webHIDUtils.isWebUSBAvailable as jest.Mock).mockReturnValue(false);
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
    ).mockResolvedValue(false);
    (webHIDUtils.requestWebHIDPermission as jest.Mock).mockResolvedValue(false);
    (webHIDUtils.requestWebUSBPermission as jest.Mock).mockResolvedValue(false);
    (webHIDUtils.getDeviceId as jest.Mock).mockResolvedValue(null);
    (webHIDUtils.getHardwareWalletDeviceId as jest.Mock).mockResolvedValue(
      null,
    );
  });

  describe('useHardwareWalletConfig', () => {
    it('should throw error when used outside provider', () => {
      const { result } = renderHook(() => useHardwareWalletConfig());

      expect(result.error).toEqual(
        Error(
          'useHardwareWalletConfig must be used within HardwareWalletProvider',
        ),
      );
    });

    it('should return config values when used inside provider', () => {
      const store = mockStore(createMockState(true));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(() => useHardwareWalletConfig(), {
        wrapper,
      });

      expect(result.current).toMatchObject({
        isHardwareWalletAccount: true,
        walletType: HardwareWalletType.Ledger,
        deviceId: null,
        hardwareConnectionPermissionState: 'unknown',
        isWebHidAvailable: expect.any(Boolean),
        isWebUsbAvailable: expect.any(Boolean),
        currentAppName: null,
      });
    });

    it('should detect non-hardware wallet account', () => {
      const store = mockStore(createMockState(false));

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

  describe('useHardwareWalletState', () => {
    it('should throw error when used outside provider', () => {
      const { result } = renderHook(() => useHardwareWalletState());

      expect(result.error).toEqual(
        Error(
          'useHardwareWalletState must be used within HardwareWalletProvider',
        ),
      );
    });

    it('should return initial state when used inside provider', () => {
      const store = mockStore(createMockState(true));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(() => useHardwareWalletState(), {
        wrapper,
      });

      expect(result.current.connectionState).toMatchObject({
        status: 'disconnected',
      });
    });
  });

  describe('useHardwareWalletActions', () => {
    it('should throw error when used outside provider', () => {
      const { result } = renderHook(() => useHardwareWalletActions());

      expect(result.error).toEqual(
        Error(
          'useHardwareWalletActions must be used within HardwareWalletProvider',
        ),
      );
    });

    it('should return action functions when used inside provider', () => {
      const store = mockStore(createMockState(true));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(() => useHardwareWalletActions(), {
        wrapper,
      });

      expect(result.current).toMatchObject({
        connect: expect.any(Function),
        disconnect: expect.any(Function),
        clearError: expect.any(Function),
        checkHardwareWalletPermission: expect.any(Function),
        requestHardwareWalletPermission: expect.any(Function),
        ensureDeviceReady: expect.any(Function),
      });
    });

    it('keeps action references stable when config state changes', async () => {
      const store = mockStore(createMockState(true));

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

      const initialActions = result.current.actions;
      expect(result.current.config.hardwareConnectionPermissionState).toBe(
        HardwareConnectionPermissionState.Unknown,
      );

      await act(async () => {
        await result.current.actions.checkHardwareWalletPermission(
          HardwareWalletType.Ledger,
        );
      });

      expect(result.current.actions).toBe(initialActions);
    });
  });

  describe('useHardwareWallet', () => {
    it('should combine all contexts', () => {
      const store = mockStore(createMockState(true));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(() => useHardwareWallet(), { wrapper });

      // Should have config properties
      expect(result.current.isHardwareWalletAccount).toBeDefined();
      expect(result.current.walletType).toBeDefined();

      // Should have state properties
      expect(result.current.connectionState).toBeDefined();

      // Should have action functions
      expect(result.current.connect).toBeInstanceOf(Function);
      expect(result.current.disconnect).toBeInstanceOf(Function);
    });
  });
});
