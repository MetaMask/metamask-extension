import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import QrHardwareSigningPage from '.';
import { QrHardwareSigningPhase } from './qr-hardware-signing-page.types';

const meta: Meta<typeof QrHardwareSigningPage> = {
  title: 'Pages/HardwareWallets/Swap/QrHardwareSigningPage',
  component: QrHardwareSigningPage,
  args: {
    payload: {
      type: 'eth-sign-request',
      cbor: 'a201010203',
    },
    requestId: 'sign-request-id',
    onBack: () => undefined,
    onCancel: () => undefined,
    onContinueToScan: () => undefined,
    onScanSuccess: async () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof QrHardwareSigningPage>;

export const ApprovalStep: Story = {
  args: {
    title: 'Step 2 of 4: Scan the QR code shown on your wallet',
    phase: QrHardwareSigningPhase.DisplayQrCode,
  },
};

export const SwapStepScanSignature: Story = {
  args: {
    title: 'Last step: Scan the QR code shown on your wallet',
    phase: QrHardwareSigningPhase.ScanSignature,
  },
};
