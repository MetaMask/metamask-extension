import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import { ErrorCode, type HardwareWalletError } from '@metamask/hw-wallet-sdk';
import { createHardwareWalletError } from '../../../../contexts/hardware-wallets/errors';
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
const mockUseHardwareWalletConfig = jest.fn();
jest.mock('../../../../contexts/hardware-wallets', () => {
  const actual = jest.requireActual('../../../../contexts/hardware-wallets');

  return {
    ...actual,
    useHardwareWalletConfig: () => mockUseHardwareWalletConfig(),
    useHardwareWalletActions: () => ({
      ensureDeviceReady: mockEnsureDeviceReady,
      clearError: mockClearError,
    }),
  };
});

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
    mockUseHardwareWalletConfig.mockReturnValue({
      deviceId: 'test-device-id',
      walletType: HardwareWalletType.Ledger,
    });
  });

  describe('Error Display', () => {
    it('renders device locked title and recovery instructions', () => {
      const error = createTestError(
        ErrorCode.AuthenticationDeviceLocked,
        'Device is locked',
        'Your Ledger device is locked. Please unlock it to continue.',
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

    it('renders nothing when error is not provided', () => {
      const onClose = jest.fn();
      const { container } = render(
        <HardwareWalletErrorModal onClose={onClose} />,
      );

      expect(container.firstChild).toBeNull();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('renders with fallback wallet type when not available', () => {
      const error = createTestError(
        ErrorCode.AuthenticationDeviceLocked,
        'Device is locked',
        'Your device is locked.',
      );

      mockUseHardwareWalletConfig.mockReturnValue({
        deviceId: null,
        walletType: null,
      });

      const { getByText } = render(<HardwareWalletErrorModal error={error} />);

      expect(
        getByText('[hardwareWalletErrorTitleDeviceLocked]'),
      ).toBeInTheDocument();
    });
  });

  describe('Recovery Instructions', () => {
    it('displays unlock instructions for AuthenticationDeviceLocked', () => {
      const error = createTestError(
        ErrorCode.AuthenticationDeviceLocked,
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

    it('displays blind signing instructions for DeviceStateBlindSignNotSupported', () => {
      const error = createTestError(
        ErrorCode.DeviceStateBlindSignNotSupported,
        'Blind sign not supported',
        'Blind sign not supported.',
      );

      const { getByText } = render(<HardwareWalletErrorModal error={error} />);

      expect(
        getByText('[hardwareWalletErrorTitleConnectYourDevice]'),
      ).toBeInTheDocument();
      expect(
        getByText(
          '[hardwareWalletErrorTitleBlindSignNotSupportedInstruction1]',
        ),
      ).toBeInTheDocument();
      expect(
        getByText(
          '[hardwareWalletErrorTitleBlindSignNotSupportedInstruction2]',
        ),
      ).toBeInTheDocument();
      expect(
        getByText(
          '[hardwareWalletErrorTitleBlindSignNotSupportedInstruction3]',
        ),
      ).toBeInTheDocument();
    });

    it('displays app instructions for DeviceStateEthAppClosed', () => {
      const error = createTestError(
        ErrorCode.DeviceStateEthAppClosed,
        'Wrong app open',
        'Please open the Ethereum app.',
      );

      const { getByText } = render(<HardwareWalletErrorModal error={error} />);

      expect(
        getByText('[hardwareWalletErrorTitleConnectYourDevice]'),
      ).toBeInTheDocument();
      expect(
        getByText('[hardwareWalletEthAppNotOpenDescription]'),
      ).toBeInTheDocument();
    });

    it('displays connection instructions for DeviceDisconnected', () => {
      const error = createTestError(
        ErrorCode.DeviceDisconnected,
        'Device disconnected',
        'Device not found.',
      );

      const { getByText } = render(<HardwareWalletErrorModal error={error} />);

      expect(
        getByText('[hardwareWalletErrorTitleConnectYourDevice]'),
      ).toBeInTheDocument();
      expect(
        getByText('[hardwareWalletErrorRecoveryConnection1]'),
      ).toBeInTheDocument();
      expect(
        getByText('[hardwareWalletErrorRecoveryConnection2]'),
      ).toBeInTheDocument();
      expect(
        getByText('[hardwareWalletErrorRecoveryConnection3]'),
      ).toBeInTheDocument();
    });

    it('displays unlock instructions for ConnectionClosed', () => {
      const error = createTestError(
        ErrorCode.ConnectionClosed,
        'Connection lost',
        'Connection lost.',
      );

      const { getByText } = render(<HardwareWalletErrorModal error={error} />);

      expect(
        getByText('[hardwareWalletErrorTitleConnectYourDevice]'),
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

    it('displays description for unknown errors', () => {
      const error = createTestError(
        ErrorCode.Unknown,
        'Unknown error',
        'Unknown error.',
      );

      const { getByText } = render(<HardwareWalletErrorModal error={error} />);

      expect(
        getByText('[hardwareWalletErrorUnknownErrorDescription]'),
      ).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('displays Reconnect button for retryable errors', () => {
      const error = createTestError(
        ErrorCode.AuthenticationDeviceLocked,
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
        getByText('[hardwareWalletErrorReconnectButton]'),
      ).toBeInTheDocument();
      expect(queryByText('[confirm]')).not.toBeInTheDocument();
    });

    it('displays Continue button for device disconnected', () => {
      const error = createTestError(
        ErrorCode.DeviceDisconnected,
        'Device disconnected',
        'Device not found.',
      );
      const onCancel = jest.fn();

      const { getByText, queryByText } = render(
        <HardwareWalletErrorModal error={error} onCancel={onCancel} />,
      );

      expect(
        getByText('[hardwareWalletErrorContinueButton]'),
      ).toBeInTheDocument();
      expect(queryByText('[confirm]')).not.toBeInTheDocument();
    });

    it('displays only Confirm button for non-retryable errors', () => {
      const error = createTestError(
        ErrorCode.UserCancelled,
        'User cancelled',
        'You cancelled the operation.',
      );
      const onCancel = jest.fn();

      const { getByText, queryByText } = render(
        <HardwareWalletErrorModal error={error} onCancel={onCancel} />,
      );

      expect(getByText('[confirm]')).toBeInTheDocument();
      expect(
        queryByText('[hardwareWalletErrorReconnectButton]'),
      ).not.toBeInTheDocument();
    });

    it('handles Continue button click for retryable errors', async () => {
      const error = createTestError(
        ErrorCode.AuthenticationDeviceLocked,
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
        fireEvent.click(getByText('[hardwareWalletErrorReconnectButton]'));
      });

      await waitFor(() => {
        expect(mockEnsureDeviceReady).toHaveBeenCalledWith('test-device-id');
      });
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('handles Confirm button click for non-retryable errors', async () => {
      const error = createTestError(
        ErrorCode.UserCancelled,
        'User cancelled',
        'You cancelled the operation.',
      );
      const onCancel = jest.fn();

      const { getByText } = render(
        <HardwareWalletErrorModal error={error} onCancel={onCancel} />,
      );

      await act(async () => {
        fireEvent.click(getByText('[confirm]'));
      });

      expect(mockHideModal).toHaveBeenCalledTimes(1);
      expect(mockClearError).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Recovery Success State', () => {
    it('displays success modal when device recovery succeeds', async () => {
      const error = createTestError(
        ErrorCode.AuthenticationDeviceLocked,
        'Device is locked',
        'Your device is locked.',
      );

      mockEnsureDeviceReady.mockResolvedValueOnce(true);

      const { getByText, rerender } = render(
        <HardwareWalletErrorModal error={error} />,
      );

      await act(async () => {
        fireEvent.click(getByText('[hardwareWalletErrorReconnectButton]'));
      });

      rerender(<HardwareWalletErrorModal error={error} />);

      expect(getByText('[hardwareWalletTypeConnected]')).toBeInTheDocument();
    });

    it('clears error when success modal is closed', async () => {
      const error = createTestError(
        ErrorCode.AuthenticationDeviceLocked,
        'Device is locked',
        'Your device is locked.',
      );

      mockEnsureDeviceReady.mockResolvedValueOnce(true);

      const { getByText, getByLabelText } = render(
        <HardwareWalletErrorModal error={error} />,
      );

      await act(async () => {
        fireEvent.click(getByText('[hardwareWalletErrorReconnectButton]'));
      });

      const closeButton = getByLabelText('[close]');
      await act(async () => {
        fireEvent.click(closeButton);
      });

      expect(mockClearError).toHaveBeenCalledTimes(1);
      expect(mockHideModal).toHaveBeenCalledTimes(1);
    });
  });

  describe('Props Merging', () => {
    it('merges props from direct props and modal state', () => {
      const error = createTestError(
        ErrorCode.AuthenticationDeviceLocked,
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
