import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { HardwareWalletErrorModal } from './hardware-wallet-error-modal';
import {
  ErrorCode,
  RetryStrategy,
  HardwareWalletError,
} from '../../../../contexts/hardware-wallets/errors';
import { HardwareWalletType } from '../../../../contexts/hardware-wallets/types';

// Mock the useI18nContext hook
const mockT = (key: string) => key;
jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => mockT,
}));

// Mock the useModalProps hook
const mockHideModal = jest.fn();
jest.mock('../../../../hooks/useModalProps', () => ({
  useModalProps: () => ({
    hideModal: mockHideModal,
    props: {},
  }),
}));

// Helper function to create error objects
const createError = (
  code: ErrorCode,
  message: string,
  userMessage: string,
  retryStrategy: RetryStrategy = RetryStrategy.RETRY,
  userActionable: boolean = true,
): HardwareWalletError => ({
  code,
  message,
  userMessage,
  retryStrategy,
  userActionable,
  timestamp: Date.now(),
});

describe('HardwareWalletErrorModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders error modal with title and error message', () => {
      const error = createError(
        ErrorCode.AUTH_LOCK_001,
        'Device is locked',
        'Your Ledger device is locked. Please unlock it to continue.',
      );

      const { getByText } = render(
        <HardwareWalletErrorModal
          error={error}
          walletType={HardwareWalletType.LEDGER}
        />,
      );

      expect(getByText('hardwareWalletErrorTitleDeviceLocked')).toBeInTheDocument();
      expect(
        getByText('Your Ledger device is locked. Please unlock it to continue.'),
      ).toBeInTheDocument();
    });

    it('renders device locked title for locked device errors', () => {
      const error = createError(
        ErrorCode.AUTH_LOCK_001,
        'Device is locked',
        'Your device is locked.',
      );

      const { getByText } = render(
        <HardwareWalletErrorModal
          error={error}
          walletType={HardwareWalletType.LEDGER}
        />,
      );

      expect(getByText('hardwareWalletErrorTitleDeviceLocked')).toBeInTheDocument();
    });

    it('uses user message when available', () => {
      const error = createError(
        ErrorCode.AUTH_LOCK_001,
        'Technical error message',
        'User-friendly error message',
      );

      const { getByText } = render(
        <HardwareWalletErrorModal
          error={error}
          walletType={HardwareWalletType.LEDGER}
        />,
      );

      expect(getByText('User-friendly error message')).toBeInTheDocument();
    });

    it('falls back to technical message when user message is not available', () => {
      const error: HardwareWalletError = {
        code: ErrorCode.AUTH_LOCK_001,
        message: 'Technical error message',
        userMessage: '',
        retryStrategy: RetryStrategy.RETRY,
        userActionable: true,
        timestamp: Date.now(),
      };

      const { getByText } = render(
        <HardwareWalletErrorModal
          error={error}
          walletType={HardwareWalletType.LEDGER}
        />,
      );

      expect(getByText('Technical error message')).toBeInTheDocument();
    });
  });

  describe('Recovery Instructions', () => {
    it('renders unlock recovery instructions for AUTH_LOCK_001', () => {
      const error = createError(
        ErrorCode.AUTH_LOCK_001,
        'Device is locked',
        'Your device is locked.',
      );

      const { getByText } = render(
        <HardwareWalletErrorModal
          error={error}
          walletType={HardwareWalletType.LEDGER}
        />,
      );

      expect(getByText('hardwareWalletErrorTitleDeviceLocked')).toBeInTheDocument();
      expect(
        getByText('hardwareWalletErrorRecoveryUnlock1'),
      ).toBeInTheDocument();
      expect(
        getByText('hardwareWalletErrorRecoveryUnlock2'),
      ).toBeInTheDocument();
      expect(
        getByText('hardwareWalletErrorRecoveryUnlock3'),
      ).toBeInTheDocument();
    });

    it('renders app recovery instructions for DEVICE_STATE_001', () => {
      const error = createError(
        ErrorCode.DEVICE_STATE_001,
        'Wrong app open',
        'Please open the Ethereum app.',
      );

      const { getByText } = render(
        <HardwareWalletErrorModal
          error={error}
          walletType={HardwareWalletType.LEDGER}
        />,
      );

      expect(getByText('hardwareWalletErrorTitleConnectYourDevice')).toBeInTheDocument();
      expect(getByText('hardwareWalletErrorRecoveryApp1')).toBeInTheDocument();
      expect(getByText('hardwareWalletErrorRecoveryApp2')).toBeInTheDocument();
      expect(getByText('hardwareWalletErrorRecoveryApp3')).toBeInTheDocument();
    });

    it('renders WebHID recovery instructions for CONN_TRANSPORT_001', () => {
      const error = createError(
        ErrorCode.CONN_TRANSPORT_001,
        'WebHID permission denied',
        'Browser permission required.',
      );

      const { getByText } = render(
        <HardwareWalletErrorModal
          error={error}
          walletType={HardwareWalletType.LEDGER}
        />,
      );

      expect(
        getByText('hardwareWalletErrorRecoveryWebHID1'),
      ).toBeInTheDocument();
      expect(
        getByText('hardwareWalletErrorRecoveryWebHID2'),
      ).toBeInTheDocument();
    });

    it('renders permission recovery instructions for CONFIG_PERM_001', () => {
      const error = createError(
        ErrorCode.CONFIG_PERM_001,
        'Device permission denied',
        'Permission required.',
      );

      const { getByText } = render(
        <HardwareWalletErrorModal
          error={error}
          walletType={HardwareWalletType.LEDGER}
        />,
      );

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

    it('renders connection recovery instructions for CONN_CLOSED_001', () => {
      const error = createError(
        ErrorCode.CONN_CLOSED_001,
        'Connection lost',
        'Connection lost.',
      );

      const { getByText } = render(
        <HardwareWalletErrorModal
          error={error}
          walletType={HardwareWalletType.LEDGER}
        />,
      );

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

    it('renders timeout recovery instructions for CONN_TIMEOUT_001', () => {
      const error = createError(
        ErrorCode.CONN_TIMEOUT_001,
        'Connection timeout',
        'Timeout.',
      );

      const { getByText } = render(
        <HardwareWalletErrorModal
          error={error}
          walletType={HardwareWalletType.LEDGER}
        />,
      );

      expect(
        getByText('hardwareWalletErrorRecoveryTimeout1'),
      ).toBeInTheDocument();
      expect(
        getByText('hardwareWalletErrorRecoveryTimeout2'),
      ).toBeInTheDocument();
    });

    it('renders user cancel recovery instructions for USER_CANCEL_001', () => {
      const error = createError(
        ErrorCode.USER_CANCEL_001,
        'User cancelled',
        'You cancelled.',
      );

      const { getByText } = render(
        <HardwareWalletErrorModal
          error={error}
          walletType={HardwareWalletType.LEDGER}
        />,
      );

      expect(
        getByText('hardwareWalletErrorRecoveryUserCancel'),
      ).toBeInTheDocument();
    });

    it('renders default recovery instructions for unknown errors', () => {
      const error = createError(
        ErrorCode.UNKNOWN,
        'Unknown error',
        'Unknown error.',
      );

      const { getByText } = render(
        <HardwareWalletErrorModal
          error={error}
          walletType={HardwareWalletType.LEDGER}
        />,
      );

      expect(
        getByText('hardwareWalletErrorRecoveryDefault1'),
      ).toBeInTheDocument();
      expect(
        getByText('hardwareWalletErrorRecoveryDefault2'),
      ).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('renders Cancel and Retry buttons for retryable errors', () => {
      const error = createError(
        ErrorCode.AUTH_LOCK_001,
        'Device is locked',
        'Your device is locked.',
      );
      const onRetry = jest.fn();
      const onCancel = jest.fn();

      const { getByText } = render(
        <HardwareWalletErrorModal
          error={error}
          walletType={HardwareWalletType.LEDGER}
          onRetry={onRetry}
          onCancel={onCancel}
        />,
      );

      expect(getByText('cancel')).toBeInTheDocument();
      expect(getByText('continue')).toBeInTheDocument();
    });

    it('renders only Close button for non-retryable errors', () => {
      const error = createError(
        ErrorCode.AUTH_LOCK_001,
        'Device is locked',
        'Your device is locked.',
        RetryStrategy.NO_RETRY,
        false,
      );
      const onCancel = jest.fn();

      const { getByText, queryByText } = render(
        <HardwareWalletErrorModal
          error={error}
          walletType={HardwareWalletType.LEDGER}
          onCancel={onCancel}
        />,
      );

      expect(getByText('close')).toBeInTheDocument();
      expect(queryByText('continue')).not.toBeInTheDocument();
      expect(queryByText('cancel')).not.toBeInTheDocument();
    });

    it('renders only Close button when onRetry is not provided', () => {
      const error = createError(
        ErrorCode.AUTH_LOCK_001,
        'Device is locked',
        'Your device is locked.',
      );
      const onCancel = jest.fn();

      const { getByText, queryByText } = render(
        <HardwareWalletErrorModal
          error={error}
          walletType={HardwareWalletType.LEDGER}
          onCancel={onCancel}
        />,
      );

      expect(getByText('close')).toBeInTheDocument();
      expect(queryByText('continue')).not.toBeInTheDocument();
    });

    it('calls onRetry and hideModal when Retry button is clicked', () => {
      const error = createError(
        ErrorCode.AUTH_LOCK_001,
        'Device is locked',
        'Your device is locked.',
      );
      const onRetry = jest.fn();
      const onCancel = jest.fn();

      const { getByText } = render(
        <HardwareWalletErrorModal
          error={error}
          walletType={HardwareWalletType.LEDGER}
          onRetry={onRetry}
          onCancel={onCancel}
        />,
      );

      fireEvent.click(getByText('continue'));

      expect(mockHideModal).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel and hideModal when Cancel button is clicked', () => {
      const error = createError(
        ErrorCode.AUTH_LOCK_001,
        'Device is locked',
        'Your device is locked.',
      );
      const onRetry = jest.fn();
      const onCancel = jest.fn();

      const { getByText } = render(
        <HardwareWalletErrorModal
          error={error}
          walletType={HardwareWalletType.LEDGER}
          onRetry={onRetry}
          onCancel={onCancel}
        />,
      );

      fireEvent.click(getByText('cancel'));

      expect(mockHideModal).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel and hideModal when Close button is clicked', () => {
      const error = createError(
        ErrorCode.AUTH_LOCK_001,
        'Device is locked',
        'Your device is locked.',
        RetryStrategy.NO_RETRY,
        false,
      );
      const onCancel = jest.fn();

      const { getByText } = render(
        <HardwareWalletErrorModal
          error={error}
          walletType={HardwareWalletType.LEDGER}
          onCancel={onCancel}
        />,
      );

      fireEvent.click(getByText('close'));

      expect(mockHideModal).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('does not throw error when onRetry is undefined', () => {
      const error = createError(
        ErrorCode.AUTH_LOCK_001,
        'Device is locked',
        'Your device is locked.',
      );

      const { getByText } = render(
        <HardwareWalletErrorModal
          error={error}
          walletType={HardwareWalletType.LEDGER}
        />,
      );

      expect(() => fireEvent.click(getByText('close'))).not.toThrow();
    });

    it('does not throw error when onCancel is undefined', () => {
      const error = createError(
        ErrorCode.AUTH_LOCK_001,
        'Device is locked',
        'Your device is locked.',
        RetryStrategy.NO_RETRY,
        false,
      );

      const { getByText } = render(
        <HardwareWalletErrorModal
          error={error}
          walletType={HardwareWalletType.LEDGER}
        />,
      );

      expect(() => fireEvent.click(getByText('close'))).not.toThrow();
    });
  });

  describe('Props Merging', () => {
    it('merges props from direct props and modal state', () => {
      const error = createError(
        ErrorCode.AUTH_LOCK_001,
        'Device is locked',
        'Your device is locked.',
      );

      const { getByText } = render(
        <HardwareWalletErrorModal
          error={error}
          walletType={HardwareWalletType.LEDGER}
        />,
      );

      expect(getByText('hardwareWalletErrorTitleDeviceLocked')).toBeInTheDocument();
    });
  });

  describe('Error Icons', () => {
    it('renders lock icon for AUTH_LOCK errors', () => {
      const error = createError(
        ErrorCode.AUTH_LOCK_001,
        'Device is locked',
        'Your device is locked.',
      );

      const { container } = render(
        <HardwareWalletErrorModal
          error={error}
          walletType={HardwareWalletType.LEDGER}
        />,
      );

      const icon = container.querySelector('[style*="lock.svg"]');
      expect(icon).toBeInTheDocument();
    });

    it('renders refresh icon for DEVICE_STATE_001', () => {
      const error = createError(
        ErrorCode.DEVICE_STATE_001,
        'Wrong app',
        'Wrong app.',
      );

      const { container } = render(
        <HardwareWalletErrorModal
          error={error}
          walletType={HardwareWalletType.LEDGER}
        />,
      );

      const icon = container.querySelector('[style*="refresh.svg"]');
      expect(icon).toBeInTheDocument();
    });

    it('renders plug icon for DEVICE_STATE_003', () => {
      const error = createError(
        ErrorCode.DEVICE_STATE_003,
        'Device disconnected',
        'Device disconnected.',
      );

      const { container } = render(
        <HardwareWalletErrorModal
          error={error}
          walletType={HardwareWalletType.LEDGER}
        />,
      );

      const icon = container.querySelector('[style*="plug.svg"]');
      expect(icon).toBeInTheDocument();
    });

    it('renders clock icon for CONN_TIMEOUT_001', () => {
      const error = createError(
        ErrorCode.CONN_TIMEOUT_001,
        'Timeout',
        'Timeout.',
      );

      const { container } = render(
        <HardwareWalletErrorModal
          error={error}
          walletType={HardwareWalletType.LEDGER}
        />,
      );

      const icon = container.querySelector('[style*="clock.svg"]');
      expect(icon).toBeInTheDocument();
    });
  });
});

