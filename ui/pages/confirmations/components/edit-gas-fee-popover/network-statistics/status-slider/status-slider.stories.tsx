import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import StatusSlider from './status-slider';

const meta: Meta<typeof StatusSlider> = {
  title: 'Pages/Confirmations/Components/StatusSlider',
  component: StatusSlider,
  parameters: {
    docs: {
      description: {
        component:
          'Read-only network congestion indicator shown in gas fee settings. Not an interactive slider.',
      },
    },
  },
  argTypes: {
    gasFeeEstimates: { control: 'object' },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof StatusSlider>;

export const NotBusyStory: Story = {
  name: 'NotBusy',
  args: {
    gasFeeEstimates: { networkCongestion: 0.1 },
  },
};

export const StableStory: Story = {
  name: 'Stable',
  args: {
    gasFeeEstimates: { networkCongestion: 0.5 },
  },
};

export const BusyStory: Story = {
  name: 'Busy',
  args: {
    gasFeeEstimates: { networkCongestion: 0.95 },
  },
};

export const UnknownCongestionStory: Story = {
  name: 'UnknownCongestion',
  args: {
    gasFeeEstimates: undefined,
  },
};

export const AllStatesStory: Story = {
  name: 'AllStates',
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: 24,
        alignItems: 'flex-end',
      }}
    >
      <StatusSlider gasFeeEstimates={{ networkCongestion: 0.1 }} />
      <StatusSlider gasFeeEstimates={{ networkCongestion: 0.5 }} />
      <StatusSlider gasFeeEstimates={{ networkCongestion: 0.95 }} />
      <StatusSlider gasFeeEstimates={undefined} />
    </div>
  ),
};
