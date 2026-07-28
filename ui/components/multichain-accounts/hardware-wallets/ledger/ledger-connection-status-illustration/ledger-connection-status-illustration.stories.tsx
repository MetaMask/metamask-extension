import type { Meta, StoryObj } from '@storybook/react';
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
import { LedgerConnectionStatusIllustration } from '.';

const STORY_FRAME_WIDTH = 460;

const meta = {
  title:
    'Components/MultichainAccounts/HardwareWallets/Ledger/LedgerConnectionStatusIllustration',
  component: LedgerConnectionStatusIllustration,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Static PNG illustration for each Ledger hardware wallet connection state.',
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
    status: LEDGER_CONNECTION_STATUS.Searching,
  },
  argTypes: {
    status: {
      control: 'select',
      options: Object.values(LEDGER_CONNECTION_STATUS),
      description: 'Ledger connection state illustration to display.',
    },
  },
} satisfies Meta<typeof LedgerConnectionStatusIllustration>;

export default meta;

type Story = StoryObj<typeof LedgerConnectionStatusIllustration>;

export const Default: Story = {
  args: {
    status: LEDGER_CONNECTION_STATUS.Searching,
  },
};

export const AllStates: Story = {
  args: {
    status: LEDGER_CONNECTION_STATUS.Searching,
  },
  render: () => (
    <Box flexDirection={BoxFlexDirection.Column} gap={8}>
      {LEDGER_CONNECTION_STATUS_LIST.map((status) => (
        <Box
          key={status}
          backgroundColor={BoxBackgroundColor.BackgroundDefault}
          padding={4}
          style={{ width: STORY_FRAME_WIDTH }}
        >
          <LedgerConnectionStatusIllustration status={status} />
        </Box>
      ))}
    </Box>
  ),
};
