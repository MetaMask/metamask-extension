import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import QrSignatureCode from '.';

const meta: Meta<typeof QrSignatureCode> = {
  title: 'Pages/HardwareWallets/Swap/QrSignatureCode',
  component: QrSignatureCode,
};

export default meta;
type Story = StoryObj<typeof QrSignatureCode>;

export const Default: Story = {
  args: {
    payload: {
      type: 'eth-sign-request',
      cbor: 'a201010203',
    },
  },
};
