import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import {
  ErrorCode,
  HardwareWalletError,
  createHardwareWalletError,
} from '../../../../contexts/hardware-wallets/errors';
import { HardwareWalletType } from '../../../../contexts/hardware-wallets/types';
import { HardwareWalletErrorModal } from './hardware-wallet-error-modal';

const mockHideModal = jest.fn();
jest.mock('../../../../hooks/useModalProps', () => ({
  useModalProps: () => ({
    hideModal: mockHideModal,
    props: {},
  }),
}));

const mockEnsureDeviceReady = jest.fn();
const mockClearError = jest.fn();
jest.mock('../../../../contexts/hardware-wallets', () => ({
  useHardwareWalletConfig: () => ({
    deviceId: 'test-device-id',
    walletType: 'ledger',
    detectedWalletType: 'ledger',
  }),
  useHardwareWalletActions: () => ({
    ensureDeviceReady: mockEnsureDeviceReady,
    clearError: mockClearError,
  }),
}));

// Helper function to create test errors
const createTestError = (
  code: ErrorCode,
  message: string,
  userMessage?: string,
): HardwareWalletError => {
  return createHardwareWalletError(
    code,
    'ledger' as HardwareWalletType,
    userMessage || message,
  );
};

describe('HardwareWalletErrorModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnsureDeviceReady.mockResolvedValue(true);
  });

  describe('Error Display', () => {
    it('displays error modal with title and error message', () => {
      const error = createTestError(
        ErrorCode.AUTH_LOCK_001,
        'Device is locked',
        'Your Ledger device is locked. Please unlock it to continue.',
      );

      const { getByText } = render(<HardwareWalletErrorModal error={error} />);

      expect(
        getByText('[hardwareWalletErrorTitleDeviceLocked]'),
      ).toBeInTheDocument();
      expect(
        getByText('Please unlock your hardware wallet device'),
      ).toBeInTheDocument();
    });

    it('displays device locked title for AUTH_LOCK_001', () => {
      const error = createTestError(
        ErrorCode.AUTH_LOCK_001,
        'Device is locked',
        'Your device is locked.',
      );

      const { getByText } = render(<HardwareWalletErrorModal error={error} />);

      expect(
        getByText('[hardwareWalletErrorTitleDeviceLocked]'),
      ).toBeInTheDocument();
    });

    it('displays user message when available', () => {
      const error = createTestError(
        ErrorCode.AUTH_LOCK_001,
        'Technical error message',
        'User-friendly error message',
      );

      const { getByText } = render(<HardwareWalletErrorModal error={error} />);

      expect(
        getByText('Please unlock your hardware wallet device'),
      ).toBeInTheDocument();
    });

    it('falls back to technical message when user message unavailable', () => {
      const error = createTestError(
        ErrorCode.AUTH_LOCK_001,
        'Technical error message',
        '',
      );

      const { getByText } = render(<HardwareWalletErrorModal error={error} />);

      expect(
        getByText('Please unlock your hardware wallet device'),
      ).toBeInTheDocument();
    });

    it('renders nothing when error is not provided', () => {
      const { container } = render(<HardwareWalletErrorModal />);

      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when wallet type is not available', () => {
      const error = createTestError(
        ErrorCode.AUTH_LOCK_001,
        'Device is locked',
        'Your device is locked.',
      );

      // Mock the hook to return no wallet type
      jest.doMock('../../../../contexts/hardware-wallets', () => ({
        useHardwareWalletConfig: () => ({
          deviceId: null,
          walletType: null,
          detectedWalletType: null,
        }),
        useHardwareWalletActions: () => ({
          ensureDeviceReady: mockEnsureDeviceReady,
          clearError: mockClearError,
        }),
      }));

      const { container } = render(<HardwareWalletErrorModal error={error} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Recovery Instructions', () => {
    it('displays unlock instructions for AUTH_LOCK_001', () => {
      const error = createTestError(
        ErrorCode.AUTH_LOCK_001,
        'Device is locked',
        'Your device is locked.',
      );

      const { getByText } = render(<HardwareWalletErrorModal error={error} />);

      expect(
        getByText('[hardwareWalletErrorTitleDeviceLocked]'),
      ).toBeInTheDocument();
      expect(
        getByText('[hardwareWalletErrorRecoveryUnlock1]'),
      ).toBeInTheDocument();
      expect(
        getByText('[hardwareWalletErrorRecoveryUnlock2]'),
      ).toBeInTheDocument();
      expect(
        getByText('[hardwareWalletErrorRecoveryUnlock3]'),
      ).toBeInTheDocument();
    });

    it('displays unlock instructions for AUTH_LOCK_002', () => {
      const error = createTestError(
        ErrorCode.AUTH_LOCK_002,
        'Device is locked',
        'Your device is locked.',
      );

      const { getByText } = render(<HardwareWalletErrorModal error={error} />);

      expect(
        getByText('[hardwareWalletErrorTitleDeviceLocked]'),
      ).toBeInTheDocument();
      expect(
        getByText('[hardwareWalletErrorRecoveryUnlock1]'),
      ).toBeInTheDocument();
    });

    it('displays app instructions for DEVICE_STATE_001', () => {
      const error = createTestError(
        ErrorCode.DEVICE_STATE_001,
        'Wrong app open',
        'Please open the Ethereum app.',
      );

      const { getByText } = render(<HardwareWalletErrorModal error={error} />);

      expect(
        getByText('hardwareWalletErrorTitleConnectYourDevice'),
      ).toBeInTheDocument();
      expect(
        getByText('[hardwareWalletErrorRecoveryApp1]'),
      ).toBeInTheDocument();
      expect(
        getByText('[hardwareWalletErrorRecoveryApp2]'),
      ).toBeInTheDocument();
      expect(
        getByText('[hardwareWalletErrorRecoveryApp3]'),
      ).toBeInTheDocument();
    });

    it('displays connection instructions for DEVICE_STATE_002', () => {
      const error = createTestError(
        ErrorCode.DEVICE_STATE_002,
        'Device disconnected',
        'Device not found.',
      );

      const { getByText } = render(<HardwareWalletErrorModal error={error} />);

      expect(
        getByText('hardwareWalletErrorTitleConnectYourDevice'),
      ).toBeInTheDocument();
      expect(
        getByText('hardwareWalletErrorRecoveryConnection1'),
      ).toBeInTheDocument();
      expect(
        getByText('hardwareWalletErrorRecoveryConnection2'),
      ).toBeInTheDocument();
    });

    it('displays connection instructions for DEVICE_STATE_003', () => {
      const error = createTestError(
        ErrorCode.DEVICE_STATE_003,
        'Device disconnected',
        'Device not found.',
      );

      const { getByText } = render(<HardwareWalletErrorModal error={error} />);

      expect(
        getByText('hardwareWalletErrorTitleConnectYourDevice'),
      ).toBeInTheDocument();
      expect(
        getByText('hardwareWalletErrorRecoveryConnection1'),
      ).toBeInTheDocument();
    });

    it('displays WebHID instructions for CONN_TRANSPORT_001', () => {
      const error = createTestError(
        ErrorCode.CONN_TRANSPORT_001,
        'WebHID permission denied',
        'Browser permission required.',
      );

      const { getByText } = render(<HardwareWalletErrorModal error={error} />);

      expect(
        getByText('hardwareWalletErrorRecoveryWebHID1'),
      ).toBeInTheDocument();
      expect(
        getByText('hardwareWalletErrorRecoveryWebHID2'),
      ).toBeInTheDocument();
    });

    it('displays permission instructions for CONFIG_PERM_001', () => {
      const error = createTestError(
        ErrorCode.CONFIG_PERM_001,
        'Device permission denied',
        'Permission required.',
      );

      const { getByText } = render(<HardwareWalletErrorModal error={error} />);

      expect(
        getByText('hardwareWalletErrorRecoveryPermission1'),
      ).toBeInTheDocument();
      expect(
        getByText('hardwareWalletErrorRecoveryPermission2'),
      ).toBeInTheDocument();
      expect(
        getByText('hardwareWalletErrorRecoveryPermission3'),
      ).toBeInTheDocument();
    });

    it('displays connection instructions for CONN_CLOSED_001', () => {
      const error = createTestError(
        ErrorCode.CONN_CLOSED_001,
        'Connection lost',
        'Connection lost.',
      );

      const { getByText } = render(<HardwareWalletErrorModal error={error} />);

      expect(
        getByText('hardwareWalletErrorRecoveryConnection1'),
      ).toBeInTheDocument();
      expect(
        getByText('hardwareWalletErrorRecoveryConnection2'),
      ).toBeInTheDocument();
      expect(
        getByText('hardwareWalletErrorRecoveryConnection3'),
      ).toBeInTheDocument();
    });

    it('displays timeout instructions for CONN_TIMEOUT_001', () => {
      const error = createTestError(
        ErrorCode.CONN_TIMEOUT_001,
        'Connection timeout',
        'Timeout.',
      );

      const { getByText } = render(<HardwareWalletErrorModal error={error} />);

      expect(
        getByText('hardwareWalletErrorRecoveryTimeout1'),
      ).toBeInTheDocument();
      expect(
        getByText('hardwareWalletErrorRecoveryTimeout2'),
      ).toBeInTheDocument();
    });

    it('displays cancel message for USER_CANCEL_001', () => {
      const error = createTestError(
        ErrorCode.USER_CANCEL_001,
        'User cancelled',
        'You cancelled.',
      );

      const { getByText } = render(<HardwareWalletErrorModal error={error} />);

      expect(
        getByText('hardwareWalletErrorRecoveryUserCancel'),
      ).toBeInTheDocument();
    });

    it('displays cancel message for USER_CANCEL_002', () => {
      const error = createTestError(
        ErrorCode.USER_CANCEL_002,
        'User cancelled',
        'You cancelled.',
      );

      const { getByText } = render(<HardwareWalletErrorModal error={error} />);

      expect(
        getByText('hardwareWalletErrorRecoveryUserCancel'),
      ).toBeInTheDocument();
    });

    it('displays default instructions for unknown errors', () => {
      const error = createTestError(
        'UNKNOWN_ERROR' as ErrorCode,
        'Unknown error',
        'Unknown error.',
      );

      const { getByText } = render(<HardwareWalletErrorModal error={error} />);

      expect(
        getByText('hardwareWalletErrorRecoveryDefault1'),
      ).toBeInTheDocument();
      expect(
        getByText('hardwareWalletErrorRecoveryDefault2'),
      ).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('displays Continue button for retryable errors', () => {
      const error = createTestError(
        ErrorCode.AUTH_LOCK_001,
        'Device is locked',
        'Your device is locked.',
      );
      const onRetry = jest.fn();
      const onCancel = jest.fn();

      const { getByText, queryByText } = render(
        <HardwareWalletErrorModal
          error={error}
          onRetry={onRetry}
          onCancel={onCancel}
        />,
      );

      expect(
        getByText('[hardwareWalletErrorContinueButton]'),
      ).toBeInTheDocument();
      expect(queryByText('Close')).not.toBeInTheDocument();
    });

    it('displays only Close button for non-retryable errors', () => {
      const error = createTestError(
        ErrorCode.USER_CANCEL_001,
        'User cancelled',
        'You cancelled the operation.',
      );
      const onCancel = jest.fn();

      const { getByText, queryByText } = render(
        <HardwareWalletErrorModal error={error} onCancel={onCancel} />,
      );

      expect(getByText('[close]')).toBeInTheDocument();
      expect(queryByText('Continue')).not.toBeInTheDocument();
    });

    it('displays only Close button when error not user actionable', () => {
      const error = createTestError(
        ErrorCode.CONN_TRANSPORT_001,
        'WebHID permission denied',
        'Browser permission required.',
      );
      const onCancel = jest.fn();

      const { getByText, queryByText } = render(
        <HardwareWalletErrorModal error={error} onCancel={onCancel} />,
      );

      expect(getByText('[close]')).toBeInTheDocument();
      expect(queryByText('Continue')).not.toBeInTheDocument();
    });

    it('handles Continue button click for retryable errors', async () => {
      const error = createTestError(
        ErrorCode.AUTH_LOCK_001,
        'Device is locked',
        'Your device is locked.',
      );
      const onRetry = jest.fn();
      const onCancel = jest.fn();

      const { getByText } = render(
        <HardwareWalletErrorModal
          error={error}
          onRetry={onRetry}
          onCancel={onCancel}
        />,
      );

      await act(async () => {
        fireEvent.click(getByText('[hardwareWalletErrorContinueButton]'));
      });

      await waitFor(() => {
        expect(mockEnsureDeviceReady).toHaveBeenCalledWith('test-device-id');
      });
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(mockHideModal).toHaveBeenCalledTimes(1);
    });

    it('handles Close button click for non-retryable errors', async () => {
      const error = createTestError(
        ErrorCode.USER_CANCEL_001,
        'User cancelled',
        'You cancelled the operation.',
      );
      const onCancel = jest.fn();

      const { getByText } = render(
        <HardwareWalletErrorModal error={error} onCancel={onCancel} />,
      );

      await act(async () => {
        fireEvent.click(getByText('[close]'));
      });

      expect(mockHideModal).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('handles undefined onRetry callback gracefully', async () => {
      const error = createTestError(
        ErrorCode.AUTH_LOCK_001,
        'Device is locked',
        'Your device is locked.',
      );

      const { getByText } = render(<HardwareWalletErrorModal error={error} />);

      await act(async () => {
        fireEvent.click(getByText('[close]'));
      });

      expect(mockEnsureDeviceReady).toHaveBeenCalledWith('test-device-id');
      expect(mockClearError).toHaveBeenCalledTimes(1);
    });

    it('handles undefined onCancel callback gracefully', async () => {
      const error = createTestError(
        ErrorCode.USER_CANCEL_001,
        'User cancelled',
        'You cancelled the operation.',
      );

      const { getByText } = render(<HardwareWalletErrorModal error={error} />);

      await act(async () => {
        fireEvent.click(getByText('[close]'));
      });

      expect(mockHideModal).toHaveBeenCalledTimes(1);
      expect(mockClearError).toHaveBeenCalledTimes(1);
    });
  });

  describe('Recovery Success State', () => {
    it('displays success modal when device recovery succeeds', async () => {
      const error = createTestError(
        ErrorCode.AUTH_LOCK_001,
        'Device is locked',
        'Your device is locked.',
      );

      mockEnsureDeviceReady.mockResolvedValueOnce(true);

      const { getByText, rerender } = render(
        <HardwareWalletErrorModal error={error} />,
      );

      await act(async () => {
        fireEvent.click(getByText('[hardwareWalletErrorContinueButton]'));
      });

      rerender(<HardwareWalletErrorModal error={error} />);

      expect(getByText('[hardwareWalletTypeConnected]')).toBeInTheDocument();
    });

    it('clears error when success modal is closed', async () => {
      const error = createTestError(
        ErrorCode.AUTH_LOCK_001,
        'Device is locked',
        'Your device is locked.',
      );

      mockEnsureDeviceReady.mockResolvedValueOnce(true);

      const { getByText } = render(<HardwareWalletErrorModal error={error} />);

      await act(async () => {
        fireEvent.click(getByText('[hardwareWalletErrorContinueButton]'));
      });

      const closeButton = getByText('Close');
      await act(async () => {
        fireEvent.click(closeButton);
      });

      expect(mockClearError).toHaveBeenCalledTimes(2); // Once for success, once for close
      expect(mockHideModal).toHaveBeenCalledTimes(2);
    });
  });

  describe('Props Merging', () => {
    it('merges props from direct props and modal state', () => {
      const error = createTestError(
        ErrorCode.AUTH_LOCK_001,
        'Device is locked',
        'Your device is locked.',
      );

      const { getByText } = render(<HardwareWalletErrorModal error={error} />);

      expect(
        getByText('[hardwareWalletErrorTitleDeviceLocked]'),
      ).toBeInTheDocument();
    });
  });
});
