import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { HardwareWalletErrorModal } from './hardware-wallet-error-modal';
import {
  ErrorCode,
  RetryStrategy,
  HardwareWalletError,
} from '../../../../contexts/hardware-wallets/errors';
import { HardwareWalletType } from '../../../../contexts/hardware-wallets/types';
import { HardwareWalletProvider } from '../../../../contexts/hardware-wallets/HardwareWalletContext.split';

const meta: Meta<typeof HardwareWalletErrorModal> = {
  title: 'Components/App/Modals/HardwareWalletErrorModal',
  component: HardwareWalletErrorModal,
  decorators: [
    (Story) => (
      <HardwareWalletProvider>
        <div
          style={{
            maxWidth: '500px',
            margin: '40px auto',
            padding: '20px',
            backgroundColor: 'var(--color-background-default)',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          }}
        >
          <Story />
        </div>
      </HardwareWalletProvider>
    ),
  ],
  argTypes: {
    onRetry: { action: 'retry clicked' },
    onCancel: { action: 'cancel clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof HardwareWalletErrorModal>;

// Helper function to create error objects
const createError = (
  code: ErrorCode,
  message: string,
  userMessage: string,
  retryStrategy: RetryStrategy = RetryStrategy.RETRY,
  userActionable: boolean = true,
): HardwareWalletError =>
  new HardwareWalletError(message, {
    code,
    severity: 'error' as any,
    category: 'unknown' as any,
    retryStrategy,
    userActionable,
    userMessage,
  });

/**
 * Device Locked Error - User needs to unlock their device
 */
export const DeviceLocked: Story = {
  args: {
    error: createError(
      ErrorCode.AUTH_LOCK_001,
      'Device is locked',
      'Your Ledger device is locked. Please unlock it to continue.',
    ),
    walletType: HardwareWalletType.Ledger,
    onRetry: () => console.log('Retry clicked'),
    onCancel: () => console.log('Cancel clicked'),
  },
};

/**
 * Wrong App Open - User needs to open the correct app
 */
export const WrongAppOpen: Story = {
  args: {
    error: createError(
      ErrorCode.DEVICE_STATE_001,
      'Wrong app open',
      'Please open the Ethereum app on your Ledger device.',
    ),
    walletType: HardwareWalletType.Ledger,
    onRetry: () => console.log('Retry clicked'),
    onCancel: () => console.log('Cancel clicked'),
  },
};

/**
 * WebHID Permission Error - Browser permissions issue
 */
export const WebHIDPermissionError: Story = {
  args: {
    error: createError(
      ErrorCode.CONN_TRANSPORT_001,
      'WebHID permission denied',
      'Browser permission is required to connect to your hardware wallet.',
    ),
    walletType: HardwareWalletType.Ledger,
    onRetry: () => console.log('Retry clicked'),
    onCancel: () => console.log('Cancel clicked'),
  },
};

/**
 * Device Permission Error - Device permissions not granted
 */
export const DevicePermissionError: Story = {
  args: {
    error: createError(
      ErrorCode.CONFIG_PERM_001,
      'Device permission denied',
      'Please grant permission to access your Ledger device.',
    ),
    walletType: HardwareWalletType.Ledger,
    onRetry: () => console.log('Retry clicked'),
    onCancel: () => console.log('Cancel clicked'),
  },
};

/**
 * Connection Lost - Device disconnected
 */
export const ConnectionLost: Story = {
  args: {
    error: createError(
      ErrorCode.CONN_CLOSED_001,
      'Connection lost',
      'The connection to your hardware wallet was lost. Please reconnect.',
    ),
    walletType: HardwareWalletType.Ledger,
    onRetry: () => console.log('Retry clicked'),
    onCancel: () => console.log('Cancel clicked'),
  },
};

/**
 * Connection Timeout - Operation took too long
 */
export const ConnectionTimeout: Story = {
  args: {
    error: createError(
      ErrorCode.CONN_TIMEOUT_001,
      'Connection timeout',
      'The operation timed out. Please try again.',
    ),
    walletType: HardwareWalletType.Ledger,
    onRetry: () => console.log('Retry clicked'),
    onCancel: () => console.log('Cancel clicked'),
  },
};

/**
 * User Cancelled - User rejected the operation on device
 */
export const UserCancelled: Story = {
  args: {
    error: createError(
      ErrorCode.USER_CANCEL_001,
      'User cancelled',
      'You cancelled the operation on your device.',
      RetryStrategy.RETRY,
      true,
    ),
    walletType: HardwareWalletType.Ledger,
    onRetry: () => console.log('Retry clicked'),
    onCancel: () => console.log('Cancel clicked'),
  },
};

/**
 * Unknown Error - Generic error with default recovery instructions
 */
export const UnknownError: Story = {
  args: {
    error: createError(
      ErrorCode.UNKNOWN_001,
      'Unknown error occurred',
      'An unexpected error occurred. Please try again.',
    ),
    walletType: HardwareWalletType.Ledger,
    onRetry: () => console.log('Retry clicked'),
    onCancel: () => console.log('Cancel clicked'),
  },
};

/**
 * Non-Retryable Error - Shows only Close button
 */
export const NonRetryableError: Story = {
  args: {
    error: createError(
      ErrorCode.AUTH_LOCK_001,
      'Device is locked',
      'Your Ledger device is locked. Please unlock it to continue.',
      RetryStrategy.NO_RETRY,
      false,
    ),
    walletType: HardwareWalletType.Ledger,
    onCancel: () => console.log('Close clicked'),
  },
};

/**
 * Device Disconnected - Connection issue with different error code
 */
export const DeviceDisconnected: Story = {
  args: {
    error: createError(
      ErrorCode.DEVICE_STATE_003,
      'Device disconnected',
      'Your device was disconnected. Please reconnect and try again.',
    ),
    walletType: HardwareWalletType.Ledger,
    onRetry: () => console.log('Retry clicked'),
    onCancel: () => console.log('Cancel clicked'),
  },
};

/**
 * Long Error Message - Tests text wrapping
 */
export const LongErrorMessage: Story = {
  args: {
    error: createError(
      ErrorCode.UNKNOWN_001,
      'A very long error message that should wrap properly',
      'This is a very long error message that should wrap to multiple lines and still display correctly in the modal. It contains important information that the user needs to read carefully before proceeding.',
    ),
    walletType: HardwareWalletType.Ledger,
    onRetry: () => console.log('Retry clicked'),
    onCancel: () => console.log('Cancel clicked'),
  },
};
