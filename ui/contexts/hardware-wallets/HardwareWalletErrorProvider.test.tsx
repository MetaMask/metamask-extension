import React from 'react';
import { render, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { KeyringTypes } from '@metamask/keyring-controller';
import { ErrorCode } from '@metamask/hw-wallet-sdk';
import {
  showModal,
  hideModal,
  setPendingHardwareWalletSigning,
  closeCurrentNotificationWindow,
} from '../../store/actions';
import { createHardwareWalletError } from './errors';
import {
  HardwareWalletErrorProvider,
  useHardwareWalletError,
} from './HardwareWalletErrorProvider';
import { HardwareWalletType } from './types';
import { HARDWARE_WALLET_ERROR_MODAL_NAME } from './constants';

const mockStore = configureStore([]);

jest.mock('../../store/actions');
jest.mock('./HardwareWalletContext', () => ({
  HardwareWalletProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  useHardwareWalletConfig: () => ({ isHardwareWalletAccount: true }),
  useHardwareWalletState: () => ({
    connectionState: { status: 'ready' },
  }),
  useHardwareWalletActions: () => ({
    ensureDeviceReady: jest.fn().mockResolvedValue(true),
    clearError: jest.fn(),
  }),
}));

const mockShowModal = showModal as jest.Mock;
const mockHideModal = hideModal as jest.Mock;
const mocksetPendingHardwareWalletSigning =
  setPendingHardwareWalletSigning as jest.Mock;
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

mocksetPendingHardwareWalletSigning.mockImplementation((payload) => ({
  type: 'SET_PENDING_HARDWARE_WALLET_SIGNING',
  payload,
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
  (store: ReturnType<typeof mockStore>) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <HardwareWalletErrorProvider>{children}</HardwareWalletErrorProvider>
    </Provider>
  );

const renderHardwareWalletErrorHook = (store: ReturnType<typeof mockStore>) =>
  renderHook(() => useHardwareWalletError(), {
    wrapper: createWrapper(store),
  });

describe('HardwareWalletErrorProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

      expect(mocksetPendingHardwareWalletSigning).toHaveBeenCalledWith(false);
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

    it('resets pending hardware signing state on unmount when modal is open', () => {
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
      mocksetPendingHardwareWalletSigning.mockClear();

      // Unmount the component
      act(() => {
        unmount();
      });

      // Verify that both hideModal and setPendingHardwareWalletSigning(false) were called
      expect(mockHideModal).toHaveBeenCalled();
      expect(mocksetPendingHardwareWalletSigning).toHaveBeenCalledWith(false);
    });

    it('does not reset pending hardware signing state on unmount when modal is not open', () => {
      const store = mockStore(createMockState());
      const { unmount } = renderHardwareWalletErrorHook(store);

      // Clear mock calls before unmount
      mockHideModal.mockClear();
      mocksetPendingHardwareWalletSigning.mockClear();

      // Unmount the component without showing a modal
      act(() => {
        unmount();
      });

      // Verify that neither hideModal nor setPendingHardwareWalletSigning were called
      expect(mockHideModal).not.toHaveBeenCalled();
      expect(mocksetPendingHardwareWalletSigning).not.toHaveBeenCalled();
    });
  });
});
