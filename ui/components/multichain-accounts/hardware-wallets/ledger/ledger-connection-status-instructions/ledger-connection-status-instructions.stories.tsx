import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Box, BoxBackgroundColor } from '@metamask/design-system-react';
import { LEDGER_CONNECTION_STATUS } from '../ledger-connection-status.constants';
import { LedgerConnectionStatusInstructions } from '.';

const STORY_FRAME_WIDTH = 460;

const meta = {
  title:
    'Components/MultichainAccounts/HardwareWallets/Ledger/LedgerConnectionStatusInstructions',
  component: LedgerConnectionStatusInstructions,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Troubleshooting checklist shown when a Ledger device cannot be found.',
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
} satisfies Meta<typeof LedgerConnectionStatusInstructions>;

export default meta;

type Story = StoryObj<typeof LedgerConnectionStatusInstructions>;

export const DeviceNotFound: Story = {
  args: {
    status: LEDGER_CONNECTION_STATUS.DeviceNotFound,
  },
};
