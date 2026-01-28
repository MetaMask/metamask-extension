import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { KeyringTypes } from '@metamask/keyring-controller';
import {
  HardwareWalletProvider,
  useHardwareWallet,
  useHardwareWalletConfig,
  useHardwareWalletState,
  useHardwareWalletActions,
} from './HardwareWalletContext';
import {
  HardwareWalletType,
  HardwareConnectionPermissionState,
  ConnectionStatus,
} from './types';

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

// Mock webConnectionUtils
jest.mock('./webConnectionUtils', () => ({
  isWebHidAvailable: jest.fn().mockReturnValue(false),
  isWebUsbAvailable: jest.fn().mockReturnValue(false),
  checkHardwareWalletPermission: jest.fn().mockResolvedValue('unknown'),
  requestHardwareWalletPermission: jest.fn().mockResolvedValue(false),
  checkWebHidPermission: jest.fn().mockResolvedValue('unknown'),
  checkWebUsbPermission: jest.fn().mockResolvedValue('unknown'),
  getHardwareWalletDeviceId: jest.fn().mockResolvedValue(null),
  subscribeToHardwareWalletEvents: jest.fn().mockReturnValue(jest.fn()),
}));

// Mock the hooks used by HardwareWalletProvider
jest.mock('./HardwareWalletEventHandlers', () => ({
  useDeviceEventHandlers: jest.fn().mockReturnValue({
    updateConnectionState: jest.fn(),
    handleDeviceEvent: jest.fn(),
    handleDisconnect: jest.fn(),
  }),
}));

jest.mock('./useHardwareWalletPermissions', () => ({
  useHardwareWalletPermissions: jest.fn().mockReturnValue({
    checkHardwareWalletPermissionAction: jest.fn().mockResolvedValue('unknown'),
    requestHardwareWalletPermissionAction: jest.fn().mockResolvedValue(false),
  }),
}));

jest.mock('./useHardwareWalletConnection', () => ({
  useHardwareWalletConnection: jest.fn().mockReturnValue({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    clearError: jest.fn(),
    ensureDeviceReady: jest.fn().mockResolvedValue(true),
  }),
}));

jest.mock('./useHardwareWalletAutoConnect', () => ({
  useHardwareWalletAutoConnect: jest.fn(),
}));

describe('HardwareWalletContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useHardwareWallet', () => {
    it('throws error when used outside provider', () => {
      const { result } = renderHook(() => useHardwareWallet());

      expect(result.error?.message).toContain(
        'useHardwareWallet must be used within HardwareWalletProvider',
      );
    });
  });

  describe('useHardwareWalletConfig', () => {
    it('throws error when used outside provider', () => {
      const { result } = renderHook(() => useHardwareWalletConfig());

      expect(result.error?.message).toContain(
        'useHardwareWalletConfig must be used within HardwareWalletProvider',
      );
    });
  });

  describe('useHardwareWalletState', () => {
    it('throws error when used outside provider', () => {
      const { result } = renderHook(() => useHardwareWalletState());

      expect(result.error?.message).toContain(
        'useHardwareWalletState must be used within HardwareWalletProvider',
      );
    });
  });

  describe('useHardwareWalletActions', () => {
    it('throws error when used outside provider', () => {
      const { result } = renderHook(() => useHardwareWalletActions());

      expect(result.error?.message).toContain(
        'useHardwareWalletActions must be used within HardwareWalletProvider',
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
      expect(result.current.connectionState.status).toBe(
        ConnectionStatus.Disconnected,
      );
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
      // Override the mock for this specific test
      const webConnectionUtils = jest.requireMock('./webConnectionUtils');
      webConnectionUtils.isWebHidAvailable.mockReturnValue(true);
      webConnectionUtils.isWebUsbAvailable.mockReturnValue(false);

      const store = mockStore(createMockState(KeyringTypes.ledger));

      const { result } = renderHook(() => useHardwareWallet(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.isWebHidAvailable).toBe(true);
      expect(result.current.isWebUsbAvailable).toBe(false);
    });
  });

  describe('useHardwareWalletConfig hook', () => {
    it('provides config context with correct values', () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));

      const { result } = renderHook(() => useHardwareWalletConfig(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.isHardwareWalletAccount).toBe(true);
      expect(result.current.walletType).toBe(HardwareWalletType.Ledger);
      expect(result.current.hardwareConnectionPermissionState).toBe(
        HardwareConnectionPermissionState.Unknown,
      );
      expect(typeof result.current.isWebHidAvailable).toBe('boolean');
      expect(typeof result.current.isWebUsbAvailable).toBe('boolean');
    });

    it('includes device ID in config', () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));

      const { result } = renderHook(() => useHardwareWalletConfig(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.deviceId).toBe(null);
    });
  });

  describe('useHardwareWalletState hook', () => {
    it('provides state context with connection state', () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));

      const { result } = renderHook(() => useHardwareWalletState(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.connectionState).toEqual(
        expect.objectContaining({
          status: ConnectionStatus.Disconnected,
        }),
      );
    });

    it('provides disconnected status by default', () => {
      const store = mockStore(createMockState(KeyringTypes.hd));

      const { result } = renderHook(() => useHardwareWalletState(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.connectionState.status).toBe(
        ConnectionStatus.Disconnected,
      );
    });
  });

  describe('useHardwareWalletActions hook', () => {
    it('provides actions context with stable functions', () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));

      const { result } = renderHook(() => useHardwareWalletActions(), {
        wrapper: createWrapper(store),
      });

      expect(typeof result.current.connect).toBe('function');
      expect(typeof result.current.disconnect).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
      expect(typeof result.current.checkHardwareWalletPermission).toBe(
        'function',
      );
      expect(typeof result.current.requestHardwareWalletPermission).toBe(
        'function',
      );
      expect(typeof result.current.ensureDeviceReady).toBe('function');
    });

    it('provides all required action methods', () => {
      const store = mockStore(createMockState(KeyringTypes.trezor));

      const { result } = renderHook(() => useHardwareWalletActions(), {
        wrapper: createWrapper(store),
      });

      expect(result.current).toHaveProperty('connect');
      expect(result.current).toHaveProperty('disconnect');
      expect(result.current).toHaveProperty('clearError');
      expect(result.current).toHaveProperty('checkHardwareWalletPermission');
      expect(result.current).toHaveProperty('requestHardwareWalletPermission');
      expect(result.current).toHaveProperty('ensureDeviceReady');
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

    it('maintains stable actions context references across rerenders', () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));

      const { result, rerender } = renderHook(
        () => useHardwareWalletActions(),
        {
          wrapper: createWrapper(store),
        },
      );

      const initialActions = {
        connect: result.current.connect,
        disconnect: result.current.disconnect,
        clearError: result.current.clearError,
        checkHardwareWalletPermission:
          result.current.checkHardwareWalletPermission,
        requestHardwareWalletPermission:
          result.current.requestHardwareWalletPermission,
        ensureDeviceReady: result.current.ensureDeviceReady,
      };

      rerender();

      expect(result.current.connect).toBe(initialActions.connect);
      expect(result.current.disconnect).toBe(initialActions.disconnect);
      expect(result.current.clearError).toBe(initialActions.clearError);
      expect(result.current.checkHardwareWalletPermission).toBe(
        initialActions.checkHardwareWalletPermission,
      );
      expect(result.current.requestHardwareWalletPermission).toBe(
        initialActions.requestHardwareWalletPermission,
      );
      expect(result.current.ensureDeviceReady).toBe(
        initialActions.ensureDeviceReady,
      );
    });
  });

  describe('Hardware Wallet Type Detection', () => {
    it('detects OneKey hardware wallet account', () => {
      const store = mockStore(createMockState(KeyringTypes.oneKey));

      const { result } = renderHook(() => useHardwareWallet(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.isHardwareWalletAccount).toBe(true);
      expect(result.current.walletType).toBe(HardwareWalletType.OneKey);
    });

    it('detects Lattice hardware wallet account', () => {
      const store = mockStore(createMockState(KeyringTypes.lattice));

      const { result } = renderHook(() => useHardwareWallet(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.isHardwareWalletAccount).toBe(true);
      expect(result.current.walletType).toBe(HardwareWalletType.Lattice);
    });

    it('detects QR hardware wallet account', () => {
      const store = mockStore(createMockState(KeyringTypes.qr));

      const { result } = renderHook(() => useHardwareWallet(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.isHardwareWalletAccount).toBe(true);
      expect(result.current.walletType).toBe(HardwareWalletType.Qr);
    });

    it('returns null wallet type for unknown keyring', () => {
      const store = mockStore(createMockState('unknown-keyring'));

      const { result } = renderHook(() => useHardwareWallet(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.isHardwareWalletAccount).toBe(false);
      expect(result.current.walletType).toBe(null);
    });
  });
});
