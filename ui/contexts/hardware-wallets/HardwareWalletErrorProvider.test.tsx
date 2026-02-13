import React from 'react';
import { render, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { KeyringTypes } from '@metamask/keyring-controller';
import { ErrorCode } from '@metamask/hw-wallet-sdk';
import {
  showModal,
  hideModal,
  closeCurrentNotificationWindow,
} from '../../store/actions';
import {
  CONFIRM_TRANSACTION_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
} from '../../helpers/constants/routes';
import { createHardwareWalletError } from './errors';
import {
  HardwareWalletErrorProvider,
  useHardwareWalletError,
} from './HardwareWalletErrorProvider';
import { HardwareWalletType, ConnectionStatus } from './types';
import { HARDWARE_WALLET_ERROR_MODAL_NAME } from './constants';

const mockStore = configureStore([]);

jest.mock('../../store/actions');
const mockConnectionState: { current: { status: string; error?: unknown } } = {
  current: { status: 'ready' },
};

const mockClearError = jest.fn();

jest.mock('./HardwareWalletContext', () => ({
  HardwareWalletProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  useHardwareWalletConfig: () => ({ isHardwareWalletAccount: true }),
  useHardwareWalletState: () => ({
    connectionState: mockConnectionState.current,
  }),
  useHardwareWalletActions: () => ({
    ensureDeviceReady: jest.fn().mockResolvedValue(true),
    clearError: mockClearError,
  }),
}));

const mockShowModal = showModal as jest.Mock;
const mockHideModal = hideModal as jest.Mock;
const mockCloseCurrentNotificationWindow =
  closeCurrentNotificationWindow as jest.Mock;

// Mock showModal to return a proper action object
mockShowModal.mockImplementation((payload) => ({
  type: 'MODAL_OPEN',
  payload,
}));

// Mock hideModal to return a proper action object
mockHideModal.mockImplementation(() => ({
  type: 'MODAL_CLOSE',
}));

mockCloseCurrentNotificationWindow.mockImplementation(() => ({
  type: 'CLOSE_NOTIFICATION_WINDOW',
}));

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
  appState: {
    modal: {
      modalState: {
        name: null,
      },
    },
  },
});

const createWrapper =
  (
    store: ReturnType<typeof mockStore>,
    initialRoute: string = CONFIRM_TRANSACTION_ROUTE,
  ) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <HardwareWalletErrorProvider>{children}</HardwareWalletErrorProvider>
      </MemoryRouter>
    </Provider>
  );

const renderHardwareWalletErrorHook = (
  store: ReturnType<typeof mockStore>,
  initialRoute?: string,
) =>
  renderHook(() => useHardwareWalletError(), {
    wrapper: createWrapper(store, initialRoute),
  });

describe('HardwareWalletErrorProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectionState.current = { status: 'ready' };
  });

  describe('useHardwareWalletError', () => {
    it('throws error when used outside provider', () => {
      const HookConsumer = () => {
        useHardwareWalletError();
        return null;
      };

      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      try {
        expect(() => render(<HookConsumer />)).toThrow(
          'useHardwareWalletError must be used within HardwareWalletErrorProvider',
        );
      } finally {
        consoleError.mockRestore();
      }
    });
  });

  describe('error modal functionality', () => {
    it('shows error modal when showErrorModal is called', () => {
      const store = mockStore(createMockState());
      const { result } = renderHardwareWalletErrorHook(store);

      const error = createHardwareWalletError(
        ErrorCode.AuthenticationDeviceLocked,
        HardwareWalletType.Ledger,
        'Device is locked',
      );

      act(() => {
        result.current.showErrorModal(error);
      });

      expect(mockShowModal).toHaveBeenCalledWith({
        name: HARDWARE_WALLET_ERROR_MODAL_NAME,
        error,
        onRetry: expect.any(Function),
        onCancel: expect.any(Function),
        isOpen: true,
      });
    });

    it('dismisses error modal when dismissErrorModal is called', () => {
      const store = mockStore(createMockState());
      const { result } = renderHardwareWalletErrorHook(store);

      const error = createHardwareWalletError(
        ErrorCode.AuthenticationDeviceLocked,
        HardwareWalletType.Ledger,
        'Device is locked',
      );

      // First show a modal
      act(() => {
        result.current.showErrorModal(error);
      });

      // Then dismiss it
      act(() => {
        result.current.dismissErrorModal();
      });

      expect(mockHideModal).toHaveBeenCalled();
    });

    it('reports modal visibility state', () => {
      const store = mockStore(createMockState());
      const { result } = renderHardwareWalletErrorHook(store);

      const error = createHardwareWalletError(
        ErrorCode.AuthenticationDeviceLocked,
        HardwareWalletType.Ledger,
        'Device is locked',
      );

      expect(result.current.isErrorModalVisible).toBe(false);

      act(() => {
        result.current.showErrorModal(error);
      });

      expect(result.current.isErrorModalVisible).toBe(true);

      act(() => {
        result.current.dismissErrorModal();
      });

      expect(result.current.isErrorModalVisible).toBe(false);
    });

    it('calls onRetry callback when retry is triggered', async () => {
      const store = mockStore(createMockState());
      const { result } = renderHardwareWalletErrorHook(store);

      const error = createHardwareWalletError(
        ErrorCode.AuthenticationDeviceLocked,
        HardwareWalletType.Ledger,
        'Device is locked',
      );

      act(() => {
        result.current.showErrorModal(error);
      });

      const { onRetry } = (showModal as jest.Mock).mock.calls[0][0];

      await act(async () => {
        await onRetry();
      });

      expect(mockHideModal).not.toHaveBeenCalled();
    });

    it('calls onCancel callback when cancel is triggered', () => {
      const store = mockStore(createMockState());
      const { result } = renderHardwareWalletErrorHook(store);

      const error = createHardwareWalletError(
        ErrorCode.AuthenticationDeviceLocked,
        HardwareWalletType.Ledger,
        'Device is locked',
      );

      act(() => {
        result.current.showErrorModal(error);
      });

      const { onCancel } = (showModal as jest.Mock).mock.calls[0][0];

      act(() => {
        onCancel();
      });

      expect(hideModal).toHaveBeenCalled();
    });

    it('shows modal for user cancellation errors when called manually', () => {
      const store = mockStore(createMockState());
      const { result } = renderHardwareWalletErrorHook(store);

      const userCancelError = createHardwareWalletError(
        ErrorCode.UserCancelled,
        HardwareWalletType.Ledger,
        'User cancelled',
      );

      act(() => {
        result.current.showErrorModal(userCancelError);
      });

      expect(mockShowModal).toHaveBeenCalledWith({
        name: HARDWARE_WALLET_ERROR_MODAL_NAME,
        error: userCancelError,
        onRetry: expect.any(Function),
        onCancel: expect.any(Function),
        isOpen: true,
      });
    });

    it('hides modal on unmount when modal is open', () => {
      const store = mockStore(createMockState());
      const { result, unmount } = renderHardwareWalletErrorHook(store);

      const error = createHardwareWalletError(
        ErrorCode.AuthenticationDeviceLocked,
        HardwareWalletType.Ledger,
        'Device is locked',
      );

      // Show a modal
      act(() => {
        result.current.showErrorModal(error);
      });

      expect(mockShowModal).toHaveBeenCalled();

      // Clear mock calls before unmount
      mockHideModal.mockClear();

      // Unmount the component
      act(() => {
        unmount();
      });

      // Verify that hideModal was called
      expect(mockHideModal).toHaveBeenCalled();
    });

    it('does not hide modal on unmount when modal is not open', () => {
      const store = mockStore(createMockState());
      const { unmount } = renderHardwareWalletErrorHook(store);

      // Clear mock calls before unmount
      mockHideModal.mockClear();

      // Unmount the component without showing a modal
      act(() => {
        unmount();
      });

      // Verify that hideModal was not called
      expect(mockHideModal).not.toHaveBeenCalled();
    });
  });

  describe('route-based error filtering', () => {
    it('does not auto-show errors on the home page', () => {
      const error = createHardwareWalletError(
        ErrorCode.AuthenticationDeviceLocked,
        HardwareWalletType.Ledger,
        'Device is locked',
      );

      mockConnectionState.current = {
        status: ConnectionStatus.ErrorState,
        error,
      };

      const store = mockStore(createMockState());
      renderHardwareWalletErrorHook(store, '/');

      // Auto-show should NOT trigger on the home page
      expect(mockShowModal).not.toHaveBeenCalled();
    });

    it('auto-shows errors on the confirm-transaction page', () => {
      const error = createHardwareWalletError(
        ErrorCode.AuthenticationDeviceLocked,
        HardwareWalletType.Ledger,
        'Device is locked',
      );

      mockConnectionState.current = {
        status: ConnectionStatus.ErrorState,
        error,
      };

      const store = mockStore(createMockState());
      renderHardwareWalletErrorHook(store, CONFIRM_TRANSACTION_ROUTE);

      expect(mockShowModal).toHaveBeenCalledWith(
        expect.objectContaining({
          name: HARDWARE_WALLET_ERROR_MODAL_NAME,
          error,
        }),
      );
    });

    it('auto-shows errors on the bridge page', () => {
      const error = createHardwareWalletError(
        ErrorCode.AuthenticationDeviceLocked,
        HardwareWalletType.Ledger,
        'Device is locked',
      );

      mockConnectionState.current = {
        status: ConnectionStatus.ErrorState,
        error,
      };

      const store = mockStore(createMockState());
      renderHardwareWalletErrorHook(store, CROSS_CHAIN_SWAP_ROUTE);

      expect(mockShowModal).toHaveBeenCalledWith(
        expect.objectContaining({
          name: HARDWARE_WALLET_ERROR_MODAL_NAME,
          error,
        }),
      );
    });

    it('still allows manual showErrorModal on any page', () => {
      mockConnectionState.current = { status: 'ready' };

      const store = mockStore(createMockState());
      const { result } = renderHardwareWalletErrorHook(store, '/');

      const error = createHardwareWalletError(
        ErrorCode.AuthenticationDeviceLocked,
        HardwareWalletType.Ledger,
        'Device is locked',
      );

      // Manual showErrorModal should work regardless of route
      act(() => {
        result.current.showErrorModal(error);
      });

      expect(mockShowModal).toHaveBeenCalledWith(
        expect.objectContaining({
          name: HARDWARE_WALLET_ERROR_MODAL_NAME,
          error,
        }),
      );
    });
  });
});
