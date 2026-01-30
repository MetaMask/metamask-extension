import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { KeyringTypes } from '@metamask/keyring-controller';
import { useHardwareWalletStateManager } from './HardwareWalletStateManager';
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
    <Provider store={store}>{children}</Provider>
  );

describe('HardwareWalletStateManager', () => {
  describe('useHardwareWalletStateManager', () => {
    describe('initialization', () => {
      it('initializes with correct default state for non-hardware wallet account', () => {
        const store = mockStore(createMockState(KeyringTypes.hd));

        const { result } = renderHook(() => useHardwareWalletStateManager(), {
          wrapper: createWrapper(store),
        });

        expect(result.current.state).toEqual({
          deviceId: null,
          hardwareConnectionPermissionState:
            HardwareConnectionPermissionState.Unknown,
          connectionState: {
            status: 'disconnected',
          },
          walletType: null,
          isHardwareWalletAccount: false,
          accountAddress: '0x123',
        });
      });

      it('returns null walletType for unknown keyring types', () => {
        const store = mockStore(createMockState('unknown-keyring'));

        const { result } = renderHook(() => useHardwareWalletStateManager(), {
          wrapper: createWrapper(store),
        });

        expect(result.current.state.walletType).toBe(null);
        expect(result.current.state.isHardwareWalletAccount).toBe(false);
      });

      it('returns null walletType for account with no keyring type', () => {
        const store = mockStore(createMockState(null));

        const { result } = renderHook(() => useHardwareWalletStateManager(), {
          wrapper: createWrapper(store),
        });

        expect(result.current.state.walletType).toBe(null);
        expect(result.current.state.isHardwareWalletAccount).toBe(false);
      });
    });

    describe('hardware wallet type detection', () => {
      it('detects Ledger account from keyring type', () => {
        const store = mockStore(createMockState(KeyringTypes.ledger));

        const { result } = renderHook(() => useHardwareWalletStateManager(), {
          wrapper: createWrapper(store),
        });

        expect(result.current.state.walletType).toBe(HardwareWalletType.Ledger);
        expect(result.current.state.isHardwareWalletAccount).toBe(true);
      });

      it('detects Trezor account from keyring type', () => {
        const store = mockStore(createMockState(KeyringTypes.trezor));

        const { result } = renderHook(() => useHardwareWalletStateManager(), {
          wrapper: createWrapper(store),
        });

        expect(result.current.state.walletType).toBe(HardwareWalletType.Trezor);
        expect(result.current.state.isHardwareWalletAccount).toBe(true);
      });

      it('detects OneKey account from keyring type', () => {
        const store = mockStore(createMockState(KeyringTypes.oneKey));

        const { result } = renderHook(() => useHardwareWalletStateManager(), {
          wrapper: createWrapper(store),
        });

        expect(result.current.state.walletType).toBe(HardwareWalletType.OneKey);
        expect(result.current.state.isHardwareWalletAccount).toBe(true);
      });

      it('detects Lattice account from keyring type', () => {
        const store = mockStore(createMockState(KeyringTypes.lattice));

        const { result } = renderHook(() => useHardwareWalletStateManager(), {
          wrapper: createWrapper(store),
        });

        expect(result.current.state.walletType).toBe(
          HardwareWalletType.Lattice,
        );
        expect(result.current.state.isHardwareWalletAccount).toBe(true);
      });

      it('detects QR account from keyring type', () => {
        const store = mockStore(createMockState(KeyringTypes.qr));

        const { result } = renderHook(() => useHardwareWalletStateManager(), {
          wrapper: createWrapper(store),
        });

        expect(result.current.state.walletType).toBe(HardwareWalletType.Qr);
        expect(result.current.state.isHardwareWalletAccount).toBe(true);
      });
    });

    describe('refs initialization', () => {
      it('initializes all refs with correct default values', () => {
        const store = mockStore(createMockState(KeyringTypes.hd));

        const { result } = renderHook(() => useHardwareWalletStateManager(), {
          wrapper: createWrapper(store),
        });

        const { refs } = result.current;

        expect(refs.adapterRef).toEqual({ current: null });
        expect(refs.abortControllerRef).toEqual({ current: null });
        expect(refs.isConnectingRef).toEqual({ current: false });
        expect(refs.hasAutoConnectedRef).toEqual({ current: false });
        expect(refs.lastConnectedAccountRef).toEqual({ current: null });
        expect(refs.currentConnectionIdRef).toEqual({ current: null });
        expect(refs.connectRef).toEqual({ current: null });
        expect(refs.deviceIdRef).toEqual({ current: null });
        expect(refs.walletTypeRef).toEqual({ current: null });
        expect(refs.previousWalletTypeRef).toEqual({ current: null });
      });

      it('initializes walletTypeRef with current wallet type for hardware account', () => {
        const store = mockStore(createMockState(KeyringTypes.ledger));

        const { result } = renderHook(() => useHardwareWalletStateManager(), {
          wrapper: createWrapper(store),
        });

        expect(result.current.refs.walletTypeRef.current).toBe(
          HardwareWalletType.Ledger,
        );
      });

      it('initializes previousWalletTypeRef to null', () => {
        const store = mockStore(createMockState(KeyringTypes.ledger));

        const { result } = renderHook(() => useHardwareWalletStateManager(), {
          wrapper: createWrapper(store),
        });

        expect(result.current.refs.previousWalletTypeRef.current).toBe(null);
      });
    });

    describe('setters', () => {
      it('provides all required state setters', () => {
        const store = mockStore(createMockState(KeyringTypes.hd));

        const { result } = renderHook(() => useHardwareWalletStateManager(), {
          wrapper: createWrapper(store),
        });

        expect(typeof result.current.setters.setDeviceId).toBe('function');
        expect(
          typeof result.current.setters.setHardwareConnectionPermissionState,
        ).toBe('function');
        expect(typeof result.current.setters.setConnectionState).toBe(
          'function',
        );
        expect(typeof result.current.setters.cleanupAdapter).toBe('function');
        expect(typeof result.current.setters.abortAndCleanupController).toBe(
          'function',
        );
        expect(typeof result.current.setters.resetConnectionRefs).toBe(
          'function',
        );
        expect(typeof result.current.setters.resetAutoConnectState).toBe(
          'function',
        );
        expect(typeof result.current.setters.setAutoConnected).toBe('function');
        expect(typeof result.current.setters.setDeviceIdRef).toBe('function');
      });

      expect(typeof result.current.setters.setDeviceId).toBe('function');
      expect(
        typeof result.current.setters.setHardwareConnectionPermissionState,
      ).toBe('function');
      expect(typeof result.current.setters.setConnectionState).toBe('function');
      expect(typeof result.current.setters.resetAutoConnectState).toBe(
        'function',
      );
      expect(typeof result.current.setters.setAutoConnected).toBe('function');
      expect(typeof result.current.setters.setDeviceIdRef).toBe('function');
    });

    describe('ref synchronization', () => {
      it('syncs walletTypeRef with current wallet type', () => {
        const store = mockStore(createMockState(KeyringTypes.ledger));

        const { result } = renderHook(() => useHardwareWalletStateManager(), {
          wrapper: createWrapper(store),
        });

        expect(result.current.refs.walletTypeRef.current).toBe(
          HardwareWalletType.Ledger,
        );
      });

      it('syncs walletTypeRef to null for non-hardware accounts', () => {
        const store = mockStore(createMockState(KeyringTypes.hd));

      expect(refs.adapterRef).toEqual({ current: null });
      expect(refs.abortControllerRef).toEqual({ current: null });
      expect(refs.connectingPromiseRef).toEqual({ current: null });
      expect(refs.isConnectingRef).toEqual({ current: false });
      expect(refs.hasAutoConnectedRef).toEqual({ current: false });
      expect(refs.lastConnectedAccountRef).toEqual({ current: null });
      expect(refs.currentConnectionIdRef).toEqual({ current: null });
      expect(refs.connectRef).toEqual({ current: null });
      expect(refs.deviceIdRef).toEqual({ current: null });
      expect(refs.walletTypeRef).toEqual({ current: null });
      expect(refs.previousWalletTypeRef).toEqual({ current: null });
    });

        expect(result.current.refs.walletTypeRef.current).toBe(null);
      });
    });

    describe('resetAutoConnectState', () => {
      it('resets hasAutoConnectedRef and lastConnectedAccountRef', () => {
        const store = mockStore(createMockState(KeyringTypes.ledger));

        const { result } = renderHook(() => useHardwareWalletStateManager(), {
          wrapper: createWrapper(store),
        });

        // Set up initial state
        result.current.refs.hasAutoConnectedRef.current = true;
        result.current.refs.lastConnectedAccountRef.current = '0x123';

        // Call resetAutoConnectState
        act(() => {
          result.current.setters.resetAutoConnectState();
        });

        // Verify refs are reset
        expect(result.current.refs.hasAutoConnectedRef.current).toBe(false);
        expect(result.current.refs.lastConnectedAccountRef.current).toBe(null);
      });
    });

    describe('setAutoConnected', () => {
      it('marks auto-connect as completed with account and device info', () => {
        const store = mockStore(createMockState(KeyringTypes.ledger));

        const { result } = renderHook(() => useHardwareWalletStateManager(), {
          wrapper: createWrapper(store),
        });

        // Initially not auto-connected
        expect(result.current.refs.hasAutoConnectedRef.current).toBe(false);
        expect(result.current.refs.lastConnectedAccountRef.current).toBe(null);

        // Call setAutoConnected
        act(() => {
          result.current.setters.setAutoConnected('0xabc', 'device-456');
        });

        // Verify refs are updated
        expect(result.current.refs.hasAutoConnectedRef.current).toBe(true);
        expect(result.current.refs.lastConnectedAccountRef.current).toBe(
          '0xabc',
        );
        expect(result.current.refs.deviceIdRef.current).toBe('device-456');
      });

      it('handles null account address', () => {
        const store = mockStore(createMockState(KeyringTypes.ledger));

        const { result } = renderHook(() => useHardwareWalletStateManager(), {
          wrapper: createWrapper(store),
        });

        // Call setAutoConnected with null account
        act(() => {
          result.current.setters.setAutoConnected(null, 'device-789');
        });

        // Verify refs are updated
        expect(result.current.refs.hasAutoConnectedRef.current).toBe(true);
        expect(result.current.refs.lastConnectedAccountRef.current).toBe(null);
        expect(result.current.refs.deviceIdRef.current).toBe('device-789');
      });
    });

    describe('setDeviceIdRef', () => {
      it('updates deviceIdRef directly', () => {
        const store = mockStore(createMockState(KeyringTypes.ledger));

        const { result } = renderHook(() => useHardwareWalletStateManager(), {
          wrapper: createWrapper(store),
        });

        // Initially null
        expect(result.current.refs.deviceIdRef.current).toBe(null);

        // Call setDeviceIdRef
        act(() => {
          result.current.setters.setDeviceIdRef('new-device-id');
        });

        // Verify ref is updated
        expect(result.current.refs.deviceIdRef.current).toBe('new-device-id');
      });
    });

    describe('ref synchronization during render', () => {
      it('syncs walletTypeRef with current wallet type on initial render', () => {
        const store = mockStore(createMockState(KeyringTypes.ledger));

        const { result } = renderHook(() => useHardwareWalletStateManager(), {
          wrapper: createWrapper(store),
        });

        // walletTypeRef should match the current wallet type
        expect(result.current.refs.walletTypeRef.current).toBe(
          HardwareWalletType.Ledger,
        );
        // previousWalletTypeRef should be null on first render
        expect(result.current.refs.previousWalletTypeRef.current).toBe(null);
      });

      it('deviceIdRef is synced immediately when deviceId state changes', () => {
        const store = mockStore(createMockState(KeyringTypes.ledger));

        const { result } = renderHook(() => useHardwareWalletStateManager(), {
          wrapper: createWrapper(store),
        });

        // Set deviceId via state setter
        act(() => {
          result.current.setters.setDeviceId('synced-device-id');
        });

        // Ref should be synced immediately (not via useEffect)
        expect(result.current.refs.deviceIdRef.current).toBe(
          'synced-device-id',
        );
        expect(result.current.state.deviceId).toBe('synced-device-id');
      });
    });
  });
});
