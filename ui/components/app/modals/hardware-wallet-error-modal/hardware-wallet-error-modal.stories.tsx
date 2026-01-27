import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { ErrorCode, HardwareWalletError } from '@metamask/hw-wallet-sdk';
import { HardwareWalletErrorModal } from './hardware-wallet-error-modal';
import {
  createHardwareWalletError,
  HardwareWalletType,
  HardwareWalletProvider,
} from '../../../../contexts/hardware-wallets';

const meta: Meta<typeof HardwareWalletErrorModal> = {
  title: 'Components/App/Modals/HardwareWalletErrorModal',
  component: HardwareWalletErrorModal,
  decorators: [
    (Story) => (
      <HardwareWalletProvider>
        <Story />
      </HardwareWalletProvider>
    ),
  ],
  argTypes: {
    onRetry: { action: 'retry clicked' },
    onCancel: { action: 'cancel clicked' },
    onClose: { action: 'close clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof HardwareWalletErrorModal>;

const createTestError = (
  code: ErrorCode,
  message: string,
  userMessage: string,
): HardwareWalletError => {
  return createHardwareWalletError(
    code,
    HardwareWalletType.Ledger,
    userMessage || message,
  );
};

/**
 * Device Locked Error - User needs to unlock their device
 */
export const DeviceLocked: Story = {
  args: {
    isOpen: true,
    error: createTestError(
      ErrorCode.AuthenticationDeviceLocked,
      'Device is locked',
      'Your Ledger device is locked. Please unlock it to continue.',
    ),
    onRetry: () => console.log('Retry clicked'),
    onCancel: () => console.log('Cancel clicked'),
    onClose: () => console.log('Close clicked'),
  },
};

/**
 * Wrong App Open - User needs to open the correct app
 */
export const WrongAppOpen: Story = {
  args: {
    isOpen: true,
    error: createTestError(
      ErrorCode.DeviceStateEthAppClosed,
      'Wrong app open',
      'Please open the Ethereum app on your Ledger device.',
    ),
    onRetry: () => console.log('Retry clicked'),
    onCancel: () => console.log('Cancel clicked'),
    onClose: () => console.log('Close clicked'),
  },
};

/**
 * Device Disconnected - Device not connected
 */
export const DeviceDisconnected: Story = {
  args: {
    isOpen: true,
    error: createTestError(
      ErrorCode.DeviceDisconnected,
      'Device disconnected',
      'Your device is not connected. Please check the connection.',
    ),
    onRetry: () => console.log('Retry clicked'),
    onCancel: () => console.log('Cancel clicked'),
    onClose: () => console.log('Close clicked'),
  },
};

/**
 * WebHID Permission Error - Browser permissions issue
 */
export const WebHIDPermissionError: Story = {
  args: {
    isOpen: true,
    error: createTestError(
      ErrorCode.ConnectionTransportMissing,
      'WebHID permission denied',
      'Browser permission is required to connect to your hardware wallet.',
    ),
    onRetry: () => console.log('Retry clicked'),
    onCancel: () => console.log('Cancel clicked'),
    onClose: () => console.log('Close clicked'),
  },
};

/**
 * Connection Closed - Connection was closed unexpectedly
 */
export const ConnectionClosed: Story = {
  args: {
    isOpen: true,
    error: createTestError(
      ErrorCode.ConnectionClosed,
      'Connection closed',
      'The connection to your device was closed. Please reconnect.',
    ),
    onRetry: () => console.log('Retry clicked'),
    onCancel: () => console.log('Cancel clicked'),
    onClose: () => console.log('Close clicked'),
  },
};

/**
 * Connection Timeout - Operation took too long
 */
export const ConnectionTimeout: Story = {
  args: {
    isOpen: true,
    error: createTestError(
      ErrorCode.ConnectionTimeout,
      'Connection timeout',
      'The operation timed out. Please try again.',
    ),
    onRetry: () => console.log('Retry clicked'),
    onCancel: () => console.log('Cancel clicked'),
    onClose: () => console.log('Close clicked'),
  },
};

/**
 * User Rejected - User rejected the operation on device
 */
export const UserRejected: Story = {
  args: {
    isOpen: true,
    error: createTestError(
      ErrorCode.UserRejected,
      'User rejected',
      'You rejected the operation on your device.',
    ),
    onRetry: () => console.log('Retry clicked'),
    onCancel: () => console.log('Cancel clicked'),
    onClose: () => console.log('Close clicked'),
  },
};

/**
 * User Cancelled - User cancelled the operation
 */
export const UserCancelled: Story = {
  args: {
    isOpen: true,
    error: createTestError(
      ErrorCode.UserCancelled,
      'User cancelled',
      'You cancelled the operation.',
    ),
    onRetry: () => console.log('Retry clicked'),
    onCancel: () => console.log('Cancel clicked'),
    onClose: () => console.log('Close clicked'),
  },
};

/**
 * Unknown Error - Generic error with default recovery instructions
 */
export const UnknownError: Story = {
  args: {
    isOpen: true,
    error: createTestError(
      ErrorCode.Unknown,
      'Unknown error occurred',
      'An unexpected error occurred. Please try again.',
    ),
    onRetry: () => console.log('Retry clicked'),
    onCancel: () => console.log('Cancel clicked'),
    onClose: () => console.log('Close clicked'),
  },
};

/**
 * Long Error Message - Tests text wrapping
 */
export const LongErrorMessage: Story = {
  args: {
    isOpen: true,
    error: createTestError(
      ErrorCode.Unknown,
      'A very long error message that should wrap properly',
      'This is a very long error message that should wrap to multiple lines and still display correctly in the modal. It contains important information that the user needs to read carefully before proceeding.',
    ),
    onRetry: () => console.log('Retry clicked'),
    onCancel: () => console.log('Cancel clicked'),
    onClose: () => console.log('Close clicked'),
  },
};
