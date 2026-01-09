import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { KeyringTypes } from '@metamask/keyring-controller';
import {
  HardwareWalletProvider,
  useHardwareWalletActions,
  useHardwareWalletState,
  useHardwareWalletConfig,
} from './HardwareWalletContext.split';
import {
  HardwareWalletType,
  HardwareConnectionPermissionState,
  ConnectionStatus,
} from './types';
import * as webHIDUtils from './webHIDUtils';
import { setupWebHIDUtilsMocks } from './__mocks__/webHIDUtils';
import { MockHardwareWalletAdapter } from './__mocks__/MockHardwareWalletAdapter';
import { LedgerAdapter } from './adapters/LedgerAdapter';

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
jest.mock('./adapters/LedgerAdapter');

const createWrapper =
  (store: ReturnType<typeof mockStore>) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <HardwareWalletProvider>{children}</HardwareWalletProvider>
    </Provider>
  );

const setupHooks = (wrapper: ReturnType<typeof createWrapper>) => {
  return renderHook(
    () => ({
      actions: useHardwareWalletActions(),
      state: useHardwareWalletState(),
      config: useHardwareWalletConfig(),
    }),
    { wrapper },
  );
};

const waitForAsync = async (ms = 10) => {
  await act(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  });
};

let mockAdapter: MockHardwareWalletAdapter;

const setupLedgerAdapterMock = () => {
  (LedgerAdapter as jest.MockedClass<typeof LedgerAdapter>).mockImplementation(
    (options) => {
      mockAdapter = new MockHardwareWalletAdapter(options);
      return mockAdapter as unknown as LedgerAdapter;
    },
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  setupWebHIDUtilsMocks();
  setupLedgerAdapterMock();
  // Reset mock adapter state between tests
  if (mockAdapter) {
    mockAdapter.reset();
  }
});

describe('Hardware Wallet Context - Connection', () => {
  describe('connect', () => {
    it('connects successfully to a Ledger device', async () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));
      const { result } = setupHooks(createWrapper(store));

      await act(async () => {
        await result.current.actions.connect(
          HardwareWalletType.Ledger,
          'test-device-id',
        );
      });

      expect(result.current.state.connectionState.status).toBe(
        ConnectionStatus.Connected,
      );
      expect(result.current.config.walletType).toBe(HardwareWalletType.Ledger);
      expect(result.current.config.deviceId).toBe('test-device-id');
      expect(mockAdapter.connectMock).toHaveBeenCalledWith('test-device-id');
    });

    it('sets connecting state during connection', async () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));
      const { result } = setupHooks(createWrapper(store));

      let capturedConnectingState = false;
      mockAdapter.connectMock.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              capturedConnectingState =
                result.current.state.connectionState.status ===
                ConnectionStatus.Connecting;
              resolve(undefined);
            }, 50);
          }),
      );

      await act(async () => {
        await result.current.actions.connect(
          HardwareWalletType.Ledger,
          'test-device-id',
        );
      });

      expect(capturedConnectingState).toBe(true);
      expect(result.current.state.connectionState.status).toBe(
        ConnectionStatus.Connected,
      );
    });

    it('handles connection errors', async () => {
      const connectionError = new Error('Failed to connect');
      (
        LedgerAdapter as jest.MockedClass<typeof LedgerAdapter>
      ).mockImplementationOnce((options) => {
        const adapter = new MockHardwareWalletAdapter(options);
        adapter.connectMock.mockRejectedValue(connectionError);
        return adapter as unknown as LedgerAdapter;
      });
      const store = mockStore(createMockState(KeyringTypes.ledger));
      const { result } = setupHooks(createWrapper(store));

      await act(async () => {
        await result.current.actions.connect(
          HardwareWalletType.Ledger,
          'test-device-id',
        );
      });
      await waitForAsync();

      expect(result.current.state.connectionState.status).toBe(
        ConnectionStatus.ErrorState,
      );
    });

    it('destroys existing adapter before new connection', async () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));
      const { result } = setupHooks(createWrapper(store));

      await act(async () => {
        await result.current.actions.connect(
          HardwareWalletType.Ledger,
          'device-1',
        );
      });
      const firstDestroySpy = mockAdapter.destroyMock;

      await act(async () => {
        await result.current.actions.connect(
          HardwareWalletType.Ledger,
          'device-2',
        );
      });

      expect(firstDestroySpy).toHaveBeenCalled();
    });

    it('handles device discovery failure', async () => {
      (webHIDUtils.getHardwareWalletDeviceId as jest.Mock).mockRejectedValue(
        new Error('Discovery failed'),
      );
      const store = mockStore(createMockState(KeyringTypes.ledger));
      const { result } = setupHooks(createWrapper(store));

      await act(async () => {
        await result.current.actions.connect(HardwareWalletType.Ledger);
      });

      expect(result.current.state.connectionState.status).toBe(
        ConnectionStatus.ErrorState,
      );
      expect(mockAdapter.connectMock).not.toHaveBeenCalled();
    });

    it('handles device discovery when no device found', async () => {
      (webHIDUtils.getHardwareWalletDeviceId as jest.Mock).mockResolvedValue(
        null,
      );
      const store = mockStore(createMockState(KeyringTypes.ledger));
      const { result } = setupHooks(createWrapper(store));

      await act(async () => {
        await result.current.actions.connect(HardwareWalletType.Ledger);
      });

      expect(result.current.state.connectionState.status).toBe(
        ConnectionStatus.ErrorState,
      );
      expect(mockAdapter.connectMock).not.toHaveBeenCalled();
    });

    it('aborts first connection when second connection starts', async () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));
      const { result } = setupHooks(createWrapper(store));

      let secondConnectionCompleted = false;

      // Mock first connection to be slow
      mockAdapter.connectMock.mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('Connection aborted'));
            }, 100);
          }),
      );

      // Start first connection
      const firstConnectPromise = result.current.actions.connect(
        HardwareWalletType.Ledger,
        'device-1',
      );

      // Mock second connection to be fast
      mockAdapter.connectMock.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              secondConnectionCompleted = true;
              resolve(undefined);
            }, 50);
          }),
      );

      // Start second connection before first completes
      await act(async () => {
        await result.current.actions.connect(
          HardwareWalletType.Ledger,
          'device-2',
        );
      });

      // First connection should be aborted
      await expect(firstConnectPromise).rejects.toThrow('Connection aborted');
      expect(secondConnectionCompleted).toBe(true);
      expect(result.current.config.deviceId).toBe('device-2');
    });

    it('handles adapter creation failure', async () => {
      const adapterError = new Error('Failed to create adapter');
      (
        LedgerAdapter as jest.MockedClass<typeof LedgerAdapter>
      ).mockImplementation(() => {
        throw adapterError;
      });

      const store = mockStore(createMockState(KeyringTypes.ledger));
      const { result } = setupHooks(createWrapper(store));

      await act(async () => {
        await result.current.actions.connect(
          HardwareWalletType.Ledger,
          'test-device-id',
        );
      });

      expect(result.current.state.connectionState.status).toBe(
        ConnectionStatus.ErrorState,
      );
    });
  });

  describe('disconnect', () => {
    it('disconnects successfully', async () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));
      const { result } = setupHooks(createWrapper(store));

      await act(async () => {
        await result.current.actions.connect(
          HardwareWalletType.Ledger,
          'test-device-id',
        );
      });
      expect(result.current.state.connectionState.status).toBe(
        ConnectionStatus.Connected,
      );

      await act(async () => {
        await result.current.actions.disconnect();
      });

      expect(result.current.state.connectionState.status).toBe(
        ConnectionStatus.Disconnected,
      );
      expect(result.current.config.walletType).toBeNull();
      expect(result.current.config.deviceId).toBeNull();
      expect(mockAdapter.disconnectMock).toHaveBeenCalled();
      expect(mockAdapter.destroyMock).toHaveBeenCalled();
    });
  });

  describe('auto-connection', () => {
    it('auto-connects when hardware wallet account is detected with permission', async () => {
      (webHIDUtils.getDeviceId as jest.Mock).mockResolvedValue(
        'auto-device-id',
      );
      const store = mockStore(createMockState(KeyringTypes.ledger));
      const { result } = setupHooks(createWrapper(store));

      // Wait for auto-connection to complete
      await waitForAsync(200);

      expect(result.current.state.connectionState.status).toBe(
        ConnectionStatus.Connected,
      );
      expect(result.current.config.deviceId).toBe('auto-device-id');
    });

    it('does not auto-connect without hardware wallet permission', async () => {
      (webHIDUtils.checkWebHIDPermission as jest.Mock).mockResolvedValue(
        HardwareConnectionPermissionState.Denied,
      );
      (
        webHIDUtils.checkHardwareWalletPermission as jest.Mock
      ).mockResolvedValue(HardwareConnectionPermissionState.Denied);
      (webHIDUtils.getDeviceId as jest.Mock).mockResolvedValue(
        'auto-device-id',
      );
      (webHIDUtils.getHardwareWalletDeviceId as jest.Mock).mockResolvedValue(
        'auto-device-id',
      );
      const store = mockStore(createMockState(KeyringTypes.ledger));
      const { result } = setupHooks(createWrapper(store));

      await waitForAsync(100);

      expect(result.current.state.connectionState.status).toBe(
        ConnectionStatus.Disconnected,
      );
    });

    it('does not auto-connect for non-hardware wallet accounts', async () => {
      (webHIDUtils.getDeviceId as jest.Mock).mockResolvedValue('device-id');
      const store = mockStore(createMockState(KeyringTypes.hd));
      const { result } = setupHooks(createWrapper(store));

      await waitForAsync(100);

      expect(result.current.state.connectionState.status).toBe(
        ConnectionStatus.Disconnected,
      );
    });
  });

  describe('ensureDeviceReady', () => {
    it('connects if not connected and calls ensureDeviceReady', async () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));
      const { result } = setupHooks(createWrapper(store));

      await act(async () => {
        await result.current.actions.ensureDeviceReady(
          result.current.config.deviceId || 'test-device-id',
        );
      });

      expect(mockAdapter.connectMock).toHaveBeenCalled();
      expect([ConnectionStatus.Ready, ConnectionStatus.Connected]).toContain(
        result.current.state.connectionState.status,
      );
    });

    it('only verifies if already connected', async () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));
      const { result } = setupHooks(createWrapper(store));

      await act(async () => {
        await result.current.actions.connect(
          HardwareWalletType.Ledger,
          'test-device-id',
        );
      });
      mockAdapter.connectMock.mockClear();
      mockAdapter.verifyDeviceReadyMock.mockResolvedValue(true);

      await act(async () => {
        await result.current.actions.ensureDeviceReady('test-device-id');
      });

      expect(mockAdapter.connectMock).not.toHaveBeenCalled();
      expect(mockAdapter.verifyDeviceReadyMock).toHaveBeenCalled();
    });

    it('returns false when device verification fails', async () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));
      const { result } = setupHooks(createWrapper(store));

      await act(async () => {
        await result.current.actions.connect(
          HardwareWalletType.Ledger,
          'test-device-id',
        );
      });
      mockAdapter.verifyDeviceReadyMock.mockRejectedValue(
        new Error('Device not ready'),
      );

      let resultReady: boolean | undefined;
      await act(async () => {
        resultReady =
          await result.current.actions.ensureDeviceReady('test-device-id');
      });

      expect(resultReady).toBe(false);
      expect(result.current.state.connectionState.status).toBe(
        ConnectionStatus.ErrorState,
      );
    });

    it('connects when not connected during ensureDeviceReady', async () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));
      const { result } = setupHooks(createWrapper(store));

      mockAdapter.isConnectedMock.mockReturnValue(false);
      mockAdapter.verifyDeviceReadyMock.mockResolvedValue(true);

      let resultReady: boolean | undefined;
      await act(async () => {
        resultReady =
          await result.current.actions.ensureDeviceReady('test-device-id');
      });

      expect(resultReady).toBe(true);
      expect(mockAdapter.connectMock).toHaveBeenCalledWith('test-device-id');
      expect(result.current.state.connectionState.status).toBe(
        ConnectionStatus.Ready,
      );
    });
  });

  describe('clearError', () => {
    it('clears error and restores connected state', async () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));
      const { result } = setupHooks(createWrapper(store));

      await act(async () => {
        await result.current.actions.connect(
          HardwareWalletType.Ledger,
          'test-device-id',
        );
      });
      mockAdapter.isConnectedMock.mockReturnValue(true);
      mockAdapter.simulateDeviceLocked();
      await waitForAsync();
      expect(result.current.state.connectionState.status).toBe(
        ConnectionStatus.ErrorState,
      );

      act(() => {
        result.current.actions.clearError();
      });

      expect(result.current.state.connectionState.status).toBe(
        ConnectionStatus.Connected,
      );
    });

    it('restores disconnected state if not connected', async () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));
      const { result } = setupHooks(createWrapper(store));

      mockAdapter.isConnectedMock.mockReturnValue(false);

      await act(async () => {
        result.current.actions.clearError();
      });

      expect(result.current.state.connectionState.status).toBe(
        ConnectionStatus.Disconnected,
      );
    });
  });

  describe('permission management', () => {
    it('checks hardware wallet permission', async () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));
      const { result } = setupHooks(createWrapper(store));

      const permissionState =
        await result.current.actions.checkHardwareWalletPermission(
          HardwareWalletType.Ledger,
        );

      expect(permissionState).toBe(HardwareConnectionPermissionState.Granted);
      expect(webHIDUtils.checkHardwareWalletPermission).toHaveBeenCalledWith(
        HardwareWalletType.Ledger,
      );
    });

    it('requests hardware wallet permission', async () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));
      const { result } = setupHooks(createWrapper(store));

      const granted =
        await result.current.actions.requestHardwareWalletPermission(
          HardwareWalletType.Ledger,
        );

      expect(granted).toBe(true);
      expect(webHIDUtils.requestHardwareWalletPermission).toHaveBeenCalledWith(
        HardwareWalletType.Ledger,
      );
    });

    it('denies permission when WebHID unavailable for Ledger', async () => {
      (webHIDUtils.isWebHIDAvailable as jest.Mock).mockReturnValue(false);
      const store = mockStore(createMockState(KeyringTypes.ledger));
      const { result } = setupHooks(createWrapper(store));

      const permissionState =
        await result.current.actions.checkHardwareWalletPermission(
          HardwareWalletType.Ledger,
        );

      expect(permissionState).toBe(HardwareConnectionPermissionState.Denied);
    });
  });
});
