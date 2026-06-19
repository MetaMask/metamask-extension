import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import {
  Box,
  BoxBackgroundColor,
  BoxFlexDirection,
} from '@metamask/design-system-react';
import { LEDGER_CONNECTION_STATUS, LedgerConnectionStatus } from '.';

/** Storybook frame width for the hardware wallet modal layout. */
const STORY_FRAME_WIDTH = 460;

const meta = {
  title:
    'Components/MultichainAccounts/HardwareWallets/Ledger/LedgerConnectionStatus',
  component: LedgerConnectionStatus,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Ledger hardware wallet connection status display for the redesigned connection flow.

Use the \`status\` prop to switch between connection states. Each state uses a
static PNG illustration from \`app/images/hardware-wallets/ledger-connection/\`.

**States**
- \`searching\` — scanning for a connected Ledger device
- \`device-found\` — device detected; optional device model selector
- \`device-unresponsive\` — device connected but not responding
- \`app-closed\` — Ethereum app is not open on the device
- \`device-locked\` — device is locked
- \`device-not-found\` — troubleshooting checklist
- \`generic-error\` — unknown connection failure
`.trim(),
      },
    },
  },
  decorators: [
    (Story) => (
      <Box
        backgroundColor={BoxBackgroundColor.BackgroundDefault}
        padding={4}
        style={{ width: STORY_FRAME_WIDTH, minHeight: 640 }}
      >
        <Story />
      </Box>
    ),
  ],
  argTypes: {
    status: {
      control: 'select',
      options: Object.values(LEDGER_CONNECTION_STATUS),
      description: 'Ledger connection state to display.',
    },
    deviceModelName: {
      control: 'text',
      description: 'Device model shown in the device-found selector.',
      if: { arg: 'status', eq: LEDGER_CONNECTION_STATUS.DeviceFound },
    },
    onBack: {
      action: 'onBack',
      description: 'Back navigation handler. Omit to hide the back button.',
    },
    onDeviceSelectorClick: {
      action: 'onDeviceSelectorClick',
      description: 'Device selector click handler for the device-found state.',
      if: { arg: 'status', eq: LEDGER_CONNECTION_STATUS.DeviceFound },
    },
  },
} satisfies Meta<typeof LedgerConnectionStatus>;

export default meta;

type Story = StoryObj<typeof LedgerConnectionStatus>;

export const Searching: Story = {
  args: {
    status: LEDGER_CONNECTION_STATUS.Searching,
    onBack: () => undefined,
  },
};

export const DeviceFound: Story = {
  args: {
    status: LEDGER_CONNECTION_STATUS.DeviceFound,
    deviceModelName: 'Nano X',
    onBack: () => undefined,
    onDeviceSelectorClick: () => undefined,
  },
};

export const DeviceUnresponsive: Story = {
  args: {
    status: LEDGER_CONNECTION_STATUS.DeviceUnresponsive,
    onBack: () => undefined,
  },
};

export const AppClosed: Story = {
  args: {
    status: LEDGER_CONNECTION_STATUS.AppClosed,
    onBack: () => undefined,
  },
};

export const DeviceLocked: Story = {
  args: {
    status: LEDGER_CONNECTION_STATUS.DeviceLocked,
    onBack: () => undefined,
  },
};

export const DeviceNotFound: Story = {
  args: {
    status: LEDGER_CONNECTION_STATUS.DeviceNotFound,
    onBack: () => undefined,
  },
};

export const GenericError: Story = {
  args: {
    status: LEDGER_CONNECTION_STATUS.GenericError,
    onBack: () => undefined,
  },
};

export const AllStates: Story = {
  render: () => (
    <Box flexDirection={BoxFlexDirection.Column} gap={8}>
      {Object.values(LEDGER_CONNECTION_STATUS).map((status) => (
        <Box
          key={status}
          backgroundColor={BoxBackgroundColor.BackgroundDefault}
          padding={4}
          style={{ width: STORY_FRAME_WIDTH, minHeight: 560 }}
        >
          <LedgerConnectionStatus
            status={status}
            deviceModelName="Nano X"
            onBack={() => undefined}
          />
        </Box>
      ))}
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Scroll through every Ledger connection state in a single canvas for visual QA.',
      },
    },
  },
};
