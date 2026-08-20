import type { Meta, StoryFn, StoryObj } from '@storybook/react';
import React from 'react';
import {
  Box,
  BoxBackgroundColor,
  BoxFlexDirection,
} from '@metamask/design-system-react';
import {
  LEDGER_CONNECTION_STATUS,
  LEDGER_CONNECTION_STATUS_LIST,
} from '../ledger-connection-status.constants';
import { LedgerConnectionStatus } from './ledger-connection-status';
import type { LedgerConnectionStatusProps } from './ledger-connection-status.types';

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
- \`device-found\` — device detected; read-only device row (\`deviceCount\` defaults to \`1\`, no selection indicator)
- \`device-unresponsive\` — device connected but not responding
- \`app-closed\` — Ethereum app is not open on the device
- \`device-locked\` — device is locked
- \`device-not-found\` — troubleshooting checklist
- \`generic-error\` — unknown connection failure

**Device selector (device-found only)**
- Built from \`Box\` primitives, not a native \`button\`
- \`deviceCount > 1\` shows a right-arrow indicator
- \`isDeviceSelectionEnabled\` enables row interaction for future multi-device selection
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
  args: {
    status: LEDGER_CONNECTION_STATUS.Searching,
    deviceCount: 1,
    isDeviceSelectionEnabled: false,
  },
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
    deviceCount: {
      control: { type: 'number', min: 1 },
      description:
        'Number of detected Ledger devices. Selection indicator shows when greater than 1.',
      if: { arg: 'status', eq: LEDGER_CONNECTION_STATUS.DeviceFound },
    },
    isDeviceSelectionEnabled: {
      control: 'boolean',
      description:
        'Enables device selection when multiple devices are detected.',
      if: { arg: 'status', eq: LEDGER_CONNECTION_STATUS.DeviceFound },
    },
    onBack: {
      action: 'onBack',
      description: 'Back navigation handler. Omit to hide the back button.',
    },
    onDeviceSelectorClick: {
      action: 'onDeviceSelectorClick',
      description:
        'Device selector click handler when device selection is enabled with multiple devices.',
      if: { arg: 'status', eq: LEDGER_CONNECTION_STATUS.DeviceFound },
    },
  } as Meta<LedgerConnectionStatusProps>['argTypes'],
} satisfies Meta<LedgerConnectionStatusProps>;

export default meta;

type Story = StoryObj<typeof meta>;

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
    deviceCount: 1,
    onBack: () => undefined,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Single detected device. The selector row is read-only with no arrow indicator.',
      },
    },
  },
};

export const DeviceFoundMultipleDevicesDisabled: Story = {
  args: {
    status: LEDGER_CONNECTION_STATUS.DeviceFound,
    deviceModelName: 'Nano X',
    deviceCount: 2,
    onBack: () => undefined,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Multiple devices detected before selection ships. Shows the right-arrow indicator without interaction.',
      },
    },
  },
};

export const DeviceFoundMultipleDevicesEnabled: Story = {
  args: {
    status: LEDGER_CONNECTION_STATUS.DeviceFound,
    deviceModelName: 'Nano X',
    deviceCount: 2,
    isDeviceSelectionEnabled: true,
    onBack: () => undefined,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Future multi-device selection flow. The selector row responds to click when device selection is enabled.',
      },
    },
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

const allStatesStory: StoryFn<LedgerConnectionStatusProps> = () => (
  <Box flexDirection={BoxFlexDirection.Column} gap={8}>
    {LEDGER_CONNECTION_STATUS_LIST.map((status) => (
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
);

export const AllStates = allStatesStory.bind({});
AllStates.parameters = {
  controls: { disable: true },
  docs: {
    description: {
      story:
        'Scroll through every Ledger connection state in a single canvas for visual QA.',
    },
  },
};
