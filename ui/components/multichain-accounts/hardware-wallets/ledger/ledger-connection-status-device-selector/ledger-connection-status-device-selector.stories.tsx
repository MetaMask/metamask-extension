import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Box, BoxBackgroundColor } from '@metamask/design-system-react';
import { LedgerConnectionStatusDeviceSelector } from '.';
import type { LedgerConnectionStatusDeviceSelectorProps } from './ledger-connection-status-device-selector.types';

const STORY_FRAME_WIDTH = 460;

const meta = {
  title:
    'Components/MultichainAccounts/HardwareWallets/Ledger/LedgerConnectionStatusDeviceSelector',
  component: LedgerConnectionStatusDeviceSelector,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Muted row showing the detected Ledger device model in the device-found state.

Built from \`Box\`, \`Icon\`, and \`Text\` primitives — not a native \`button\`.

**Behavior**
- Single device (\`deviceCount\` defaults to \`1\`): read-only row, no selection indicator
- Multiple devices (\`deviceCount > 1\`): shows a right-arrow indicator, still read-only until \`isDeviceSelectionEnabled\` is \`true\`
- Interactive row: adds \`onDeviceSelectorClick\` only when selection is enabled with multiple devices
`.trim(),
      },
    },
  },
  decorators: [
    (Story) => (
      <Box
        backgroundColor={BoxBackgroundColor.BackgroundDefault}
        padding={4}
        style={{ width: STORY_FRAME_WIDTH }}
      >
        <Story />
      </Box>
    ),
  ],
  args: {
    deviceModelName: 'Nano X',
    deviceCount: 1,
    isDeviceSelectionEnabled: false,
  },
  argTypes: {
    deviceModelName: {
      control: 'text',
      description: 'Detected Ledger model name shown in the row.',
    },
    deviceCount: {
      control: { type: 'number', min: 1 },
      description:
        'Number of detected Ledger devices. Selection indicator shows when greater than 1.',
    },
    isDeviceSelectionEnabled: {
      control: 'boolean',
      description:
        'Enables row interaction when multiple devices are detected.',
      if: { arg: 'deviceCount', gt: 1 },
    },
    onDeviceSelectorClick: {
      action: 'onDeviceSelectorClick',
      description:
        'Row click handler. Active only when device selection is enabled with multiple devices.',
      if: { arg: 'isDeviceSelectionEnabled' },
    },
  } as Meta<LedgerConnectionStatusDeviceSelectorProps>['argTypes'],
} satisfies Meta<LedgerConnectionStatusDeviceSelectorProps>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SingleDevice: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Default device-found presentation: one detected device, no indicator, not interactive.',
      },
    },
  },
};

export const MultipleDevicesDisabled: Story = {
  args: {
    deviceCount: 2,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Multiple devices detected but selection is not enabled yet. Shows the indicator without interaction.',
      },
    },
  },
};

export const MultipleDevicesEnabled: Story = {
  args: {
    deviceCount: 2,
    isDeviceSelectionEnabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Future multi-device selection flow. The row responds to click when device selection is enabled.',
      },
    },
  },
};
