import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { KeyringTypes } from '@metamask/keyring-controller';
import { useHardwareWalletStateManager } from './HardwareWalletStateManager';
import { HardwareWalletType, HardwareConnectionPermissionState } from './types';

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

    it('initializes with correct state for Ledger account', () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));

      const { result } = renderHook(() => useHardwareWalletStateManager(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.state.walletType).toBe(HardwareWalletType.Ledger);
      expect(result.current.state.isHardwareWalletAccount).toBe(true);
    });

    it('initializes with correct state for Trezor account', () => {
      const store = mockStore(createMockState(KeyringTypes.trezor));

      const { result } = renderHook(() => useHardwareWalletStateManager(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.state.walletType).toBe(HardwareWalletType.Trezor);
      expect(result.current.state.isHardwareWalletAccount).toBe(true);
    });

    it('provides state setters', () => {
      const store = mockStore(createMockState(KeyringTypes.hd));

      const { result } = renderHook(() => useHardwareWalletStateManager(), {
        wrapper: createWrapper(store),
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

    it('provides all required refs', () => {
      const store = mockStore(createMockState(KeyringTypes.hd));

      const { result } = renderHook(() => useHardwareWalletStateManager(), {
        wrapper: createWrapper(store),
      });

      const { refs } = result.current;

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

    it('syncs deviceId with deviceIdRef', () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));

      const { result } = renderHook(() => useHardwareWalletStateManager(), {
        wrapper: createWrapper(store),
      });

      // Initially null
      expect(result.current.refs.deviceIdRef.current).toBe(null);

      // Update deviceId
      act(() => {
        result.current.setters.setDeviceId('test-device-123');
      });

      // Ref should be updated
      expect(result.current.refs.deviceIdRef.current).toBe('test-device-123');
    });

    it('syncs walletType with walletTypeRef', () => {
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

      // previousWalletTypeRef should start as null since there's no previous value
      expect(result.current.refs.previousWalletTypeRef.current).toBe(null);
    });

    it('returns null walletType for unknown keyring types', () => {
      const store = mockStore(createMockState('unknown-keyring'));

      const { result } = renderHook(() => useHardwareWalletStateManager(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.state.walletType).toBe(null);
      expect(result.current.state.isHardwareWalletAccount).toBe(false);
    });

    it('handles account with no keyring type', () => {
      const store = mockStore(createMockState(null));

      const { result } = renderHook(() => useHardwareWalletStateManager(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.state.walletType).toBe(null);
      expect(result.current.state.isHardwareWalletAccount).toBe(false);
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
