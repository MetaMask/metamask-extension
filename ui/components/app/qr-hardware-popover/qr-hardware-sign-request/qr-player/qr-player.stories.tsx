import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import QrPlayer from './qr-player';

// Short payload that fits in a single UR fragment (no animation).
const SMALL_CBOR =
  'a501d825509b1deb4d3b7d4bad9bdd2b0d7b3dcb6802582101e8e8ef9191c1fc6eadd9d4db87fb74dbcb84c1f0b6d2ce3e0ee01dc21daf730358200e6b4dd6a5e840bae45ddb89aa5cd0ed7bcee3a90e0f78ea0fa3cc40cf543e0b0401';

// Payload large enough to span several UR fragments so the QR code visibly
// cycles through animated frames (FRAGMENT_SIZE is 200 bytes).
const LARGE_CBOR = SMALL_CBOR.repeat(6);

const meta: Meta<typeof QrPlayer> = {
  title: 'Components/App/QRHardwareSignRequest/QrPlayer',
  component: QrPlayer,
  argTypes: {
    type: { control: 'text' },
    cbor: { control: 'text' },
    cancelQRHardwareSignRequest: { action: 'cancelQRHardwareSignRequest' },
    toRead: { action: 'toRead' },
  },
  args: {
    type: 'eth-sign-request',
    cancelQRHardwareSignRequest: () => {},
    toRead: () => {},
  },
};

export default meta;

type Story = StoryObj<typeof QrPlayer>;

/** Single static QR code - payload fits in one fragment. */
export const SingleFrame: Story = {
  args: { cbor: SMALL_CBOR },
};

/** Animated QR code - payload spans multiple fragments and cycles every 200ms. */
export const AnimatedMultiFrame: Story = {
  args: { cbor: LARGE_CBOR },
};
