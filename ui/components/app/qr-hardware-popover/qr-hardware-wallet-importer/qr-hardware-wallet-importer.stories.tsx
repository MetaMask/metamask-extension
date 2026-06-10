import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import QRHardwareWalletImporter from './qr-hardware-wallet-importer';

const meta: Meta<typeof QRHardwareWalletImporter> = {
  title: 'Components/App/QRHardwareWalletImporter',
  component: QRHardwareWalletImporter,
  argTypes: {
    handleCancel: { action: 'handleCancel' },
    setErrorTitle: { action: 'setErrorTitle' },
    setErrorActive: { action: 'setErrorActive' },
  },
};

export default meta;

type Story = StoryObj<typeof QRHardwareWalletImporter>;

export const Default: Story = {};
