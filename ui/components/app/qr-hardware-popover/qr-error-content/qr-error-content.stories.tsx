import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Box, BoxBackgroundColor } from '@metamask/design-system-react';
import { QrErrorContent } from './qr-error-content';
import { QrErrorType, QrErrorFlowContext } from './qr-error-content.types';

const meta = {
  title: 'Components/App/QrErrorContent',
  component: QrErrorContent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Presentational component for QR scan error states during hardware wallet pairing and signing.

**Error types**
- **NonUrQrCode** (State 3) — scanned data is not a UR code. Copy differs between pairing and signing.
- **WrongUrType** (State 4) — valid UR, but the type is wrong for this flow. Copy differs between pairing and signing.
- **UrDecodeError** (State 5) — the UR decoder encountered an error. Copy is universal (same for pairing and signing).

**Buttons**
- **Learn more** (secondary) — opens the MetaMask support article.
- **Continue** (primary) — calls \`onTryAgain\`.
`.trim(),
      },
    },
  },
  decorators: [
    (Story) => (
      <Box
        backgroundColor={BoxBackgroundColor.BackgroundDefault}
        padding={4}
        style={{ width: '100%', maxWidth: 400 }}
      >
        <Story />
      </Box>
    ),
  ],
  argTypes: {
    errorType: {
      control: 'select',
      options: [
        QrErrorType.NonUrQrCode,
        QrErrorType.WrongUrType,
        QrErrorType.UrDecodeError,
      ],
      description: 'Which QR scan error state to display.',
    },
    flowContext: {
      control: 'select',
      options: [QrErrorFlowContext.Pairing, QrErrorFlowContext.Signing],
      description:
        'Pairing vs signing flow context. Ignored for UrDecodeError.',
    },
    onTryAgain: {
      action: 'onTryAgain',
      description: 'Callback when the user clicks "Try again".',
    },
  },
} satisfies Meta<typeof QrErrorContent>;

export default meta;

type Story = StoryObj<typeof QrErrorContent>;

/** State 3 — Non-UR QR code scanned during pairing. */
export const NonUrQrCodePairing: Story = {
  name: 'State 3: Non-UR QR — Pairing',
  args: {
    errorType: QrErrorType.NonUrQrCode,
    flowContext: QrErrorFlowContext.Pairing,
    onTryAgain: () => undefined,
  },
};

/** State 3 — Non-UR QR code scanned during signing. */
export const NonUrQrCodeSigning: Story = {
  name: 'State 3: Non-UR QR — Signing',
  args: {
    errorType: QrErrorType.NonUrQrCode,
    flowContext: QrErrorFlowContext.Signing,
    onTryAgain: () => undefined,
  },
};

/** State 4 — Valid UR with wrong type during pairing. */
export const WrongUrTypePairing: Story = {
  name: 'State 4: Wrong UR Type — Pairing',
  args: {
    errorType: QrErrorType.WrongUrType,
    flowContext: QrErrorFlowContext.Pairing,
    onTryAgain: () => undefined,
  },
};

/** State 4 — Valid UR with wrong type during signing. */
export const WrongUrTypeSigning: Story = {
  name: 'State 4: Wrong UR Type — Signing',
  args: {
    errorType: QrErrorType.WrongUrType,
    flowContext: QrErrorFlowContext.Signing,
    onTryAgain: () => undefined,
  },
};

/** State 5 — UR decode error (universal, same for pairing and signing). */
export const UrDecodeError: Story = {
  name: 'State 5: UR Decode Error',
  args: {
    errorType: QrErrorType.UrDecodeError,
    flowContext: QrErrorFlowContext.Pairing,
    onTryAgain: () => undefined,
  },
};
