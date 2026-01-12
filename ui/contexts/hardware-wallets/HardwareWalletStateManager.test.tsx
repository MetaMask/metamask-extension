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
        currentAppName: null,
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
      expect(typeof result.current.setters.setCurrentAppName).toBe('function');
      expect(typeof result.current.setters.setConnectionState).toBe('function');
    });

    it('provides all required refs', () => {
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
  });
});
