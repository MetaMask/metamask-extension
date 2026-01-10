import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { KeyringTypes } from '@metamask/keyring-controller';
import {
  HardwareWalletProvider,
  useHardwareWallet,
} from './HardwareWalletContext';
import { HardwareWalletType, HardwareConnectionPermissionState } from './types';
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

const createWrapper =
  (store: ReturnType<typeof mockStore>) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <HardwareWalletProvider>{children}</HardwareWalletProvider>
    </Provider>
  );

jest.mock('./webHIDUtils');

describe('HardwareWalletContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupWebHIDUtilsMocks();
    // Default to unavailable APIs
    (webHIDUtils.isWebHIDAvailable as jest.Mock).mockReturnValue(false);
    (webHIDUtils.isWebUSBAvailable as jest.Mock).mockReturnValue(false);
    (webHIDUtils.checkHardwareWalletPermission as jest.Mock).mockResolvedValue(
      HardwareConnectionPermissionState.Unknown,
    );
  });

  describe('useHardwareWallet', () => {
    it('throws error when used outside provider', () => {
      const { result } = renderHook(() => useHardwareWallet());

      expect(result.error?.message).toContain(
        'useHardwareWallet must be used within HardwareWalletProvider',
      );
    });
  });

  describe('HardwareWalletProvider', () => {
    it('provides initial state for non-hardware wallet account', () => {
      const store = mockStore(createMockState(KeyringTypes.hd));

      const { result } = renderHook(() => useHardwareWallet(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.isHardwareWalletAccount).toBe(false);
      expect(result.current.walletType).toBe(null);
      expect(result.current.connectionState.status).toBe('disconnected');
      expect(result.current.deviceId).toBe(null);
      expect(result.current.hardwareConnectionPermissionState).toBe(
        HardwareConnectionPermissionState.Unknown,
      );
    });

    it('detects Ledger hardware wallet account', () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));

      const { result } = renderHook(() => useHardwareWallet(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.isHardwareWalletAccount).toBe(true);
      expect(result.current.walletType).toBe(HardwareWalletType.Ledger);
    });

    it('detects Trezor hardware wallet account', () => {
      const store = mockStore(createMockState(KeyringTypes.trezor));

      const { result } = renderHook(() => useHardwareWallet(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.isHardwareWalletAccount).toBe(true);
      expect(result.current.walletType).toBe(HardwareWalletType.Trezor);
    });

    it('provides stable action functions', () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));

      const { result } = renderHook(() => useHardwareWallet(), {
        wrapper: createWrapper(store),
      });

      const actions = result.current;

      expect(typeof actions.connect).toBe('function');
      expect(typeof actions.disconnect).toBe('function');
      expect(typeof actions.clearError).toBe('function');
      expect(typeof actions.checkHardwareWalletPermission).toBe('function');
      expect(typeof actions.requestHardwareWalletPermission).toBe('function');
      expect(typeof actions.ensureDeviceReady).toBe('function');
    });

    it('handles account switching between wallet types', () => {
      const ledgerStore = mockStore(createMockState(KeyringTypes.ledger));
      const ledgerRender = renderHook(() => useHardwareWallet(), {
        wrapper: createWrapper(ledgerStore),
      });

      expect(ledgerRender.result.current.walletType).toBe(
        HardwareWalletType.Ledger,
      );

      ledgerRender.unmount();

      const trezorStore = mockStore(createMockState(KeyringTypes.trezor));
      const trezorRender = renderHook(() => useHardwareWallet(), {
        wrapper: createWrapper(trezorStore),
      });

      expect(trezorRender.result.current.walletType).toBe(
        HardwareWalletType.Trezor,
      );
    });

    it('resets state when switching to non-hardware wallet account', () => {
      const ledgerStore = mockStore(createMockState(KeyringTypes.ledger));
      const ledgerRender = renderHook(() => useHardwareWallet(), {
        wrapper: createWrapper(ledgerStore),
      });

      expect(ledgerRender.result.current.isHardwareWalletAccount).toBe(true);

      ledgerRender.unmount();

      const hdStore = mockStore(createMockState(KeyringTypes.hd));
      const hdRender = renderHook(() => useHardwareWallet(), {
        wrapper: createWrapper(hdStore),
      });

      expect(hdRender.result.current.isHardwareWalletAccount).toBe(false);
      expect(hdRender.result.current.walletType).toBe(null);
    });

    it('exposes API availability', () => {
      (webHIDUtils.isWebHIDAvailable as jest.Mock).mockReturnValue(true);
      (webHIDUtils.isWebUSBAvailable as jest.Mock).mockReturnValue(false);

      const store = mockStore(createMockState(KeyringTypes.ledger));

      const { result } = renderHook(() => useHardwareWallet(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.isWebHidAvailable).toBe(true);
      expect(result.current.isWebUsbAvailable).toBe(false);
    });
  });

  describe('Permission Management', () => {
    it('checks permissions for hardware wallet accounts', async () => {
      (
        webHIDUtils.checkHardwareWalletPermission as jest.Mock
      ).mockResolvedValue(HardwareConnectionPermissionState.Granted);

      const store = mockStore(createMockState(KeyringTypes.ledger));

      const { result } = renderHook(() => useHardwareWallet(), {
        wrapper: createWrapper(store),
      });

      await act(async () => {
        const permission = await result.current.checkHardwareWalletPermission(
          HardwareWalletType.Ledger,
        );
        expect(permission).toBe(HardwareConnectionPermissionState.Granted);
      });
    });

    it('requests permissions when API unavailable', async () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));

      const { result } = renderHook(() => useHardwareWallet(), {
        wrapper: createWrapper(store),
      });

      await act(async () => {
        const granted = await result.current.requestHardwareWalletPermission(
          HardwareWalletType.Ledger,
        );
        expect(granted).toBe(false);
      });
    });
  });

  describe('State Stability', () => {
    it('maintains stable action references across rerenders', () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));

      const { result, rerender } = renderHook(() => useHardwareWallet(), {
        wrapper: createWrapper(store),
      });

      const initialActions = {
        connect: result.current.connect,
        disconnect: result.current.disconnect,
        clearError: result.current.clearError,
      };

      rerender();

      // Actions should be stable
      expect(result.current.connect).toBe(initialActions.connect);
      expect(result.current.disconnect).toBe(initialActions.disconnect);
      expect(result.current.clearError).toBe(initialActions.clearError);
    });
  });
});
