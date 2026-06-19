import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Box, BoxBackgroundColor } from '@metamask/design-system-react';
import { LedgerConnectionStatusDeviceSelector } from '.';

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
        component:
          'Selectable row showing the detected Ledger device model name.',
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
  argTypes: {
    onDeviceSelectorClick: {
      action: 'onDeviceSelectorClick',
    },
  },
} satisfies Meta<typeof LedgerConnectionStatusDeviceSelector>;

export default meta;

type Story = StoryObj<typeof LedgerConnectionStatusDeviceSelector>;

export const Default: Story = {
  args: {
    deviceModelName: 'Nano X',
  },
};

export const Clickable: Story = {
  args: {
    deviceModelName: 'Nano X',
    onDeviceSelectorClick: () => undefined,
  },
};
