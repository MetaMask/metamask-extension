import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { ErrorCode } from '@metamask/hw-wallet-sdk';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { HardwareWalletProvider } from '../../../../contexts/hardware-wallets';
import { createHardwareWalletError } from '../../../../contexts/hardware-wallets/errors';
import { HardwareWalletType } from '../../../../contexts/hardware-wallets/types';
import { HardwareWalletErrorModal } from './hardware-wallet-error-modal';

const createStore = () => configureStore(mockState);

const meta: Meta<typeof HardwareWalletErrorModal> = {
  title: 'Components/App/Modals/HardwareWalletErrorModal',
  component: HardwareWalletErrorModal,
  decorators: [
    (Story) => (
      <Provider store={createStore()}>
        <HardwareWalletProvider>
          <Story />
        </HardwareWalletProvider>
      </Provider>
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

const DEFAULT_WALLET_TYPE = HardwareWalletType.Ledger;

const createTestError = (
  code: ErrorCode,
  walletType: HardwareWalletType = DEFAULT_WALLET_TYPE,
) => createHardwareWalletError(code, walletType);

export const DeviceLocked: Story = {
  args: {
    error: createTestError(ErrorCode.AuthenticationDeviceLocked),
  },
};

export const EthAppNotOpen: Story = {
  args: {
    error: createTestError(ErrorCode.DeviceStateEthAppClosed),
  },
};

export const BlindSignNotSupported: Story = {
  args: {
    error: createTestError(ErrorCode.DeviceStateBlindSignNotSupported),
  },
};

export const DeviceDisconnected: Story = {
  args: {
    error: createTestError(ErrorCode.DeviceDisconnected),
  },
};

export const UnknownError: Story = {
  args: {
    error: createTestError(ErrorCode.Unknown),
  },
};
