import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { KeyringTypes } from '@metamask/keyring-controller';
import { showModal, hideModal } from '../../store/actions';
import { createHardwareWalletError, ErrorCode } from './errors';
import {
  HardwareWalletErrorProvider,
  useHardwareWalletError,
} from './HardwareWalletErrorProvider';
import { HardwareWalletType } from './types';

const mockStore = configureStore([]);

jest.mock('../../store/actions');

const mockShowModal = showModal as jest.Mock;
const mockHideModal = hideModal as jest.Mock;

// Mock showModal to return a proper action object
mockShowModal.mockImplementation((payload) => ({
  type: 'MODAL_OPEN',
  payload,
}));

// Mock hideModal to return a proper action object
mockHideModal.mockImplementation(() => ({
  type: 'MODAL_CLOSE',
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
});

const createWrapper =
  (store: ReturnType<typeof mockStore>) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <HardwareWalletErrorProvider>{children}</HardwareWalletErrorProvider>
    </Provider>
  );

describe('HardwareWalletErrorProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useHardwareWalletError', () => {
    it('throws error when used outside provider', () => {
      const { result } = renderHook(() => useHardwareWalletError());

      expect(result.error?.message).toContain(
        'useHardwareWalletError must be used within HardwareWalletErrorProvider',
      );
    });
  });

  describe('error modal functionality', () => {
    it('shows error modal when showErrorModal is called', () => {
      const store = mockStore(createMockState());
      const { result } = renderHook(() => useHardwareWalletError(), {
        wrapper: createWrapper(store),
      });

      const error = createHardwareWalletError(
        ErrorCode.DEVICE_STATE_001,
        HardwareWalletType.Ledger,
        'Device is locked',
      );

      act(() => {
        result.current.showErrorModal(error);
      });

      expect(mockShowModal).toHaveBeenCalledWith({
        name: 'HARDWARE_WALLET_ERROR',
        error,
        onRetry: expect.any(Function),
        onCancel: expect.any(Function),
        isOpen: true,
      });
    });

    it('dismisses error modal when dismissErrorModal is called', () => {
      const store = mockStore(createMockState());
      const { result } = renderHook(() => useHardwareWalletError(), {
        wrapper: createWrapper(store),
      });

      const error = createHardwareWalletError(
        ErrorCode.DEVICE_STATE_001,
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
      const { result } = renderHook(() => useHardwareWalletError(), {
        wrapper: createWrapper(store),
      });

      const error = createHardwareWalletError(
        ErrorCode.DEVICE_STATE_001,
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
      const { result } = renderHook(() => useHardwareWalletError(), {
        wrapper: createWrapper(store),
      });

      const error = createHardwareWalletError(
        ErrorCode.DEVICE_STATE_001,
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

      expect(hideModal).toHaveBeenCalled();
    });

    it('calls onCancel callback when cancel is triggered', () => {
      const store = mockStore(createMockState());
      const { result } = renderHook(() => useHardwareWalletError(), {
        wrapper: createWrapper(store),
      });

      const error = createHardwareWalletError(
        ErrorCode.DEVICE_STATE_001,
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
      const { result } = renderHook(() => useHardwareWalletError(), {
        wrapper: createWrapper(store),
      });

      const userCancelError = createHardwareWalletError(
        ErrorCode.USER_CANCEL_001,
        HardwareWalletType.Ledger,
        'User cancelled',
      );

      act(() => {
        result.current.showErrorModal(userCancelError);
      });

      expect(mockShowModal).toHaveBeenCalledWith({
        name: 'HARDWARE_WALLET_ERROR',
        error: userCancelError,
        onRetry: expect.any(Function),
        onCancel: expect.any(Function),
        isOpen: true,
      });
    });
  });
});
