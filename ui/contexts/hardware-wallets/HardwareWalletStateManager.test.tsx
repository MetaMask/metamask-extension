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

      describe('setDeviceId', () => {
        it('updates deviceId state and syncs with deviceIdRef', () => {
          const store = mockStore(createMockState(KeyringTypes.ledger));

          const { result } = renderHook(() => useHardwareWalletStateManager(), {
            wrapper: createWrapper(store),
          });

          act(() => {
            result.current.setters.setDeviceId('test-device-123');
          });

          expect(result.current.state.deviceId).toBe('test-device-123');
          expect(result.current.refs.deviceIdRef.current).toBe(
            'test-device-123',
          );
        });
      });

      describe('setHardwareConnectionPermissionState', () => {
        it('updates permission state to Granted', () => {
          const store = mockStore(createMockState(KeyringTypes.ledger));

          const { result } = renderHook(() => useHardwareWalletStateManager(), {
            wrapper: createWrapper(store),
          });

          act(() => {
            result.current.setters.setHardwareConnectionPermissionState(
              HardwareConnectionPermissionState.Granted,
            );
          });

          expect(result.current.state.hardwareConnectionPermissionState).toBe(
            HardwareConnectionPermissionState.Granted,
          );
        });

        it('updates permission state to Denied', () => {
          const store = mockStore(createMockState(KeyringTypes.ledger));

          const { result } = renderHook(() => useHardwareWalletStateManager(), {
            wrapper: createWrapper(store),
          });

          act(() => {
            result.current.setters.setHardwareConnectionPermissionState(
              HardwareConnectionPermissionState.Denied,
            );
          });

          expect(result.current.state.hardwareConnectionPermissionState).toBe(
            HardwareConnectionPermissionState.Denied,
          );
        });
      });

      describe('setConnectionState', () => {
        it('updates connection state to connecting', () => {
          const store = mockStore(createMockState(KeyringTypes.ledger));

          const { result } = renderHook(() => useHardwareWalletStateManager(), {
            wrapper: createWrapper(store),
          });

          act(() => {
            result.current.setters.setConnectionState({
              status: ConnectionStatus.Connecting,
            });
          });

          expect(result.current.state.connectionState.status).toBe(
            ConnectionStatus.Connecting,
          );
        });

        it('updates connection state to error with reason and error object', () => {
          const store = mockStore(createMockState(KeyringTypes.ledger));

          const { result } = renderHook(() => useHardwareWalletStateManager(), {
            wrapper: createWrapper(store),
          });

          const testError = new Error('Connection failed');

          act(() => {
            result.current.setters.setConnectionState({
              status: ConnectionStatus.ErrorState,
              reason: 'Device disconnected',
              error: testError,
            });
          });

          const { connectionState } = result.current.state;
          expect(connectionState.status).toBe(ConnectionStatus.ErrorState);
          if (connectionState.status === ConnectionStatus.ErrorState) {
            expect(connectionState.reason).toBe('Device disconnected');
            expect(connectionState.error).toBe(testError);
          }
        });
      });

      describe('cleanupAdapter', () => {
        it('calls destroy on adapter and nullifies reference', () => {
          const store = mockStore(createMockState(KeyringTypes.ledger));

          const { result } = renderHook(() => useHardwareWalletStateManager(), {
            wrapper: createWrapper(store),
          });

          const mockDestroy = jest.fn();
          const mockAdapter = { destroy: mockDestroy };
          result.current.refs.adapterRef.current =
            mockAdapter as unknown as typeof result.current.refs.adapterRef.current;

          act(() => {
            result.current.setters.cleanupAdapter();
          });

          expect(mockDestroy).toHaveBeenCalledTimes(1);
          expect(result.current.refs.adapterRef.current).toBe(null);
        });

        it('does nothing when adapterRef is null', () => {
          const store = mockStore(createMockState(KeyringTypes.ledger));

          const { result } = renderHook(() => useHardwareWalletStateManager(), {
            wrapper: createWrapper(store),
          });

          expect(result.current.refs.adapterRef.current).toBe(null);

          act(() => {
            result.current.setters.cleanupAdapter();
          });

          expect(result.current.refs.adapterRef.current).toBe(null);
        });
      });

      describe('abortAndCleanupController', () => {
        it('calls abort on controller and nullifies reference', () => {
          const store = mockStore(createMockState(KeyringTypes.ledger));

          const { result } = renderHook(() => useHardwareWalletStateManager(), {
            wrapper: createWrapper(store),
          });

          const mockAbort = jest.fn();
          const mockController = { abort: mockAbort };
          result.current.refs.abortControllerRef.current =
            mockController as unknown as AbortController;

          act(() => {
            result.current.setters.abortAndCleanupController();
          });

          expect(mockAbort).toHaveBeenCalledTimes(1);
          expect(result.current.refs.abortControllerRef.current).toBe(null);
        });

        it('does nothing when abortControllerRef is null', () => {
          const store = mockStore(createMockState(KeyringTypes.ledger));

          const { result } = renderHook(() => useHardwareWalletStateManager(), {
            wrapper: createWrapper(store),
          });

          expect(result.current.refs.abortControllerRef.current).toBe(null);

          act(() => {
            result.current.setters.abortAndCleanupController();
          });

          expect(result.current.refs.abortControllerRef.current).toBe(null);
        });
      });

      describe('resetConnectionRefs', () => {
        it('resets isConnectingRef and currentConnectionIdRef to initial values', () => {
          const store = mockStore(createMockState(KeyringTypes.ledger));

          const { result } = renderHook(() => useHardwareWalletStateManager(), {
            wrapper: createWrapper(store),
          });

          result.current.refs.isConnectingRef.current = true;
          result.current.refs.currentConnectionIdRef.current = 12345;

          act(() => {
            result.current.setters.resetConnectionRefs();
          });

          expect(result.current.refs.isConnectingRef.current).toBe(false);
          expect(result.current.refs.currentConnectionIdRef.current).toBe(null);
        });
      });

      describe('resetAutoConnectState', () => {
        it('resets hasAutoConnectedRef and lastConnectedAccountRef to initial values', () => {
          const store = mockStore(createMockState(KeyringTypes.ledger));

          const { result } = renderHook(() => useHardwareWalletStateManager(), {
            wrapper: createWrapper(store),
          });

          result.current.refs.hasAutoConnectedRef.current = true;
          result.current.refs.lastConnectedAccountRef.current = '0xabc';

          act(() => {
            result.current.setters.resetAutoConnectState();
          });

          expect(result.current.refs.hasAutoConnectedRef.current).toBe(false);
          expect(result.current.refs.lastConnectedAccountRef.current).toBe(
            null,
          );
        });
      });

      describe('setAutoConnected', () => {
        it('sets auto-connected state with account address and device ID', () => {
          const store = mockStore(createMockState(KeyringTypes.ledger));

          const { result } = renderHook(() => useHardwareWalletStateManager(), {
            wrapper: createWrapper(store),
          });

          act(() => {
            result.current.setters.setAutoConnected(
              '0x456',
              'connected-device-id',
            );
          });

          expect(result.current.refs.hasAutoConnectedRef.current).toBe(true);
          expect(result.current.refs.lastConnectedAccountRef.current).toBe(
            '0x456',
          );
          expect(result.current.refs.deviceIdRef.current).toBe(
            'connected-device-id',
          );
        });

        it('accepts null account address', () => {
          const store = mockStore(createMockState(KeyringTypes.ledger));

          const { result } = renderHook(() => useHardwareWalletStateManager(), {
            wrapper: createWrapper(store),
          });

          act(() => {
            result.current.setters.setAutoConnected(null, 'device-id');
          });

          expect(result.current.refs.hasAutoConnectedRef.current).toBe(true);
          expect(result.current.refs.lastConnectedAccountRef.current).toBe(
            null,
          );
          expect(result.current.refs.deviceIdRef.current).toBe('device-id');
        });
      });

      describe('setDeviceIdRef', () => {
        it('sets deviceIdRef directly', () => {
          const store = mockStore(createMockState(KeyringTypes.ledger));

          const { result } = renderHook(() => useHardwareWalletStateManager(), {
            wrapper: createWrapper(store),
          });

          act(() => {
            result.current.setters.setDeviceIdRef('direct-device-id');
          });

          expect(result.current.refs.deviceIdRef.current).toBe(
            'direct-device-id',
          );
        });
      });
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

        const { result } = renderHook(() => useHardwareWalletStateManager(), {
          wrapper: createWrapper(store),
        });

        expect(result.current.refs.walletTypeRef.current).toBe(null);
      });
    });
  });
});
