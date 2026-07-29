import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { QrHardwareSigningPage } from '.';
import { QrHardwareSigningPhase } from './qr-hardware-signing-page.types';

const meta: Meta<typeof QrHardwareSigningPage> = {
  title: 'Pages/HardwareWallets/Swap/QrHardwareSigningPage',
  component: QrHardwareSigningPage,
  argTypes: {
    phase: {
      control: 'select',
      options: Object.values(QrHardwareSigningPhase),
    },
  },
};

export default meta;
type Story = StoryObj<typeof QrHardwareSigningPage>;

// Only the DisplayQrCode phase is safe to render in Storybook. The ScanSignature
// phase mounts the Reader component, which depends on MetaMetricsContext and
// camera/Permissions APIs that are not available in the Storybook environment.
//
// Titles mirror the output of `getQrHardwareSigningPageTitle` in
// ../hardware-wallet-signatures.utils.ts (single-confirmation flow: "Step 1 of
// 2"; two-confirmation final step: "Step 3 of 4"), using the locale strings
// `qrHardwareSignDisplayStepTitle` so the story visually matches what
// production renders.
export const DisplayQrCode: Story = {
  args: {
    title: 'Step 1 of 2: Scan this QR code with your wallet',
    phase: QrHardwareSigningPhase.DisplayQrCode,
    isFinalSignature: false,
    payload: {
      type: 'eth-sign-request',
      cbor: 'a201d825501f00a1b4c7e9a3f5d2e8b6a0c3d9f1e2a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
    },
    requestId: 'test-request-id',
    onBack: () => {},
    onCancel: () => {},
    onContinueToScan: () => {},
    onScanSuccess: () => Promise.resolve(),
  },
};

// Final-signature variant: the primary button label reads "Scan final QR code"
// instead of "Scan next QR code". Title reflects the two-confirmation display
// step for the trade signature (step 3 of 4).
export const DisplayQrCodeFinalSignature: Story = {
  args: {
    title: 'Step 3 of 4: Scan this QR code with your wallet',
    phase: QrHardwareSigningPhase.DisplayQrCode,
    isFinalSignature: true,
    payload: {
      type: 'eth-sign-request',
      cbor: 'a201d825501f00a1b4c7e9a3f5d2e8b6a0c3d9f1e2a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
    },
    requestId: 'test-request-id',
    onBack: () => {},
    onCancel: () => {},
    onContinueToScan: () => {},
    onScanSuccess: () => Promise.resolve(),
  },
};
