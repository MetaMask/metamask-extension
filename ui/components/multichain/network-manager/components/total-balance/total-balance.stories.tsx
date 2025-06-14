import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { TotalBalance } from './total-balance';

export default {
  title: 'Components/Multichain/NetworkManager/TotalBalance',
  component: TotalBalance,
  argTypes: {
    totalAmount: {
      control: 'text',
      description: 'The total balance amount to display',
    },
    networksLoaded: {
      control: 'number',
      description: 'Number of networks loaded out of total networks',
    },
    totalNetworks: {
      control: 'number',
      description: 'Total number of networks',
    },
  },
} as Meta<typeof TotalBalance>;

const Template: StoryFn<typeof TotalBalance> = (args) => <TotalBalance {...args} />;

export const Default = Template.bind({});
Default.args = {
  totalAmount: '$12.00',
  networksLoaded: 1,
  totalNetworks: 8,
};
