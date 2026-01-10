import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { KeyringTypes } from '@metamask/keyring-controller';
import { HardwareWalletProvider } from './HardwareWalletContext';
import {
  useHardwareWalletActions,
  useHardwareWalletState,
} from './HardwareWalletContext.hooks';
import { ConnectionStatus, DeviceEvent } from './types';
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

describe('Hardware Wallet Context - Device Events', () => {
  let mockAdapter: MockHardwareWalletAdapter;
  let connectCallback: ((device: HIDDevice) => void) | undefined;
  let disconnectCallback: ((device: HIDDevice) => void) | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    setupWebHIDUtilsMocks();

    // Override defaults for events tests (granted permissions, test device)
    (webHIDUtils.subscribeToWebHIDEvents as jest.Mock).mockImplementation(
      (onConnect, onDisconnect) => {
        connectCallback = onConnect;
        disconnectCallback = onDisconnect;
        return jest.fn();
      },
    );

    (
      LedgerAdapter as jest.MockedClass<typeof LedgerAdapter>
    ).mockImplementation((options) => {
      mockAdapter = new MockHardwareWalletAdapter(options);
      return mockAdapter as unknown as LedgerAdapter;
    });
  });

  describe('device events via adapter', () => {
    it('should handle DEVICE_LOCKED event', async () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(
        () => ({
          actions: useHardwareWalletActions(),
          state: useHardwareWalletState(),
        }),
        { wrapper },
      );

      await act(async () => {
        await result.current.actions.connect();
      });

      act(() => {
        mockAdapter.simulateDeviceLocked();
      });

      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
      });

      expect(result.current.state.connectionState.status).toBe(
        ConnectionStatus.ErrorState,
      );
      expect(
        (
          result.current.state.connectionState as {
            status: ConnectionStatus.ErrorState;
            reason: string;
            error: Error;
          }
        ).reason,
      ).toBe('locked');
    });

    it('should handle APP_NOT_OPEN event', async () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(
        () => ({
          actions: useHardwareWalletActions(),
          state: useHardwareWalletState(),
        }),
        { wrapper },
      );

      await act(async () => {
        await result.current.actions.connect();
      });

      act(() => {
        mockAdapter.simulateAppNotOpen();
      });

      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
      });

      expect(result.current.state.connectionState.status).toBe(
        ConnectionStatus.AwaitingApp,
      );
      expect(
        (
          result.current.state.connectionState as {
            status: ConnectionStatus.AwaitingApp;
            reason: string;
            appName?: string;
          }
        ).reason,
      ).toBe('not_open');
    });

    it('should handle DISCONNECTED event', async () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(
        () => ({
          actions: useHardwareWalletActions(),
          state: useHardwareWalletState(),
        }),
        { wrapper },
      );

      // Connect first
      await act(async () => {
        await result.current.actions.connect();
      });

      // Simulate disconnect
      act(() => {
        const options = mockAdapter.getOptions();
        options.onDeviceEvent?.({
          event: DeviceEvent.Disconnected,
        });
      });

      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
      });

      expect(result.current.state.connectionState.status).toBe(
        ConnectionStatus.Disconnected,
      );
    });

    it('should handle APP_CHANGED event', async () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(
        () => ({
          actions: useHardwareWalletActions(),
          state: useHardwareWalletState(),
        }),
        { wrapper },
      );

      await act(async () => {
        await result.current.actions.connect();
      });

      act(() => {
        const options = mockAdapter.getOptions();
        options.onDeviceEvent?.({
          event: DeviceEvent.AppChanged,
          currentAppName: 'Bitcoin',
        });
      });

      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
      });

      expect(result.current.state.connectionState.status).toBe(
        ConnectionStatus.AwaitingApp,
      );
      expect(
        (
          result.current.state.connectionState as {
            status: ConnectionStatus.AwaitingApp;
            reason: string;
            appName?: string;
          }
        ).reason,
      ).toBe('wrong_app');
      expect(
        (
          result.current.state.connectionState as {
            status: ConnectionStatus.AwaitingApp;
            reason: string;
            appName?: string;
          }
        ).appName,
      ).toBe('Bitcoin');
    });

    it('should handle CONNECTION_FAILED event', async () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(
        () => ({
          actions: useHardwareWalletActions(),
          state: useHardwareWalletState(),
        }),
        { wrapper },
      );

      await act(async () => {
        await result.current.actions.connect();
      });

      const error = new Error('Connection failed');
      act(() => {
        const options = mockAdapter.getOptions();
        options.onDeviceEvent?.({
          event: DeviceEvent.ConnectionFailed,
          error,
        });
      });

      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
      });

      expect(result.current.state.connectionState.status).toBe(
        ConnectionStatus.ErrorState,
      );
      expect(
        (
          result.current.state.connectionState as {
            status: ConnectionStatus.ErrorState;
            reason: string;
            error: Error;
          }
        ).reason,
      ).toBe('connection_failed');
    });
  });

  describe('WebHID native events', () => {
    it('keeps WebHID subscription stable when deviceId changes', async () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      renderHook(
        () => ({
          actions: useHardwareWalletActions(),
          state: useHardwareWalletState(),
        }),
        { wrapper },
      );

      expect(webHIDUtils.subscribeToWebHIDEvents).toHaveBeenCalledTimes(1);

      await act(async () => {
        connectCallback?.({
          productId: 123,
          vendorId: 456,
        } as HIDDevice);

        await new Promise((resolve) => {
          setTimeout(resolve, 25);
        });
      });

      expect(webHIDUtils.subscribeToWebHIDEvents).toHaveBeenCalledTimes(1);
    });

    it('should handle native HID connect event', async () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      renderHook(
        () => ({
          actions: useHardwareWalletActions(),
          state: useHardwareWalletState(),
        }),
        { wrapper },
      );

      // Simulate native connect event
      await act(async () => {
        connectCallback?.({
          productId: 123,
          vendorId: 456,
        } as HIDDevice);

        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
      });

      // Should trigger auto-connection
      expect(mockAdapter?.connectMock).toHaveBeenCalled();
    });

    it('disconnects when native HID device disconnects', async () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      // Mock device discovery to return matching device ID
      (webHIDUtils.getHardwareWalletDeviceId as jest.Mock).mockResolvedValue(
        '123',
      );

      const { result } = renderHook(
        () => ({
          actions: useHardwareWalletActions(),
          state: useHardwareWalletState(),
        }),
        { wrapper },
      );

      // Connect first
      await act(async () => {
        (webHIDUtils.getHardwareWalletDeviceId as jest.Mock).mockResolvedValue(
          '123',
        );
        await result.current.actions.connect();
      });

      // Simulate native disconnect event with matching productId
      await act(async () => {
        disconnectCallback?.({
          productId: 123,
          vendorId: 456,
        } as HIDDevice);

        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
      });

      expect(result.current.state.connectionState.status).toBe(
        ConnectionStatus.Disconnected,
      );
    });

    it('should not disconnect on unrelated device disconnect', async () => {
      const store = mockStore(createMockState(KeyringTypes.ledger));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <HardwareWalletProvider>{children}</HardwareWalletProvider>
        </Provider>
      );

      const { result } = renderHook(
        () => ({
          actions: useHardwareWalletActions(),
          state: useHardwareWalletState(),
        }),
        { wrapper },
      );

      // Connect first
      await act(async () => {
        await result.current.actions.connect();
      });

      // Simulate disconnect of different device
      await act(async () => {
        disconnectCallback?.({
          productId: 999, // Different device
          vendorId: 456,
        } as HIDDevice);

        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
      });

      // Should still be connected
      expect(result.current.state.connectionState.status).toBe(
        ConnectionStatus.Connected,
      );
    });
  });
});
