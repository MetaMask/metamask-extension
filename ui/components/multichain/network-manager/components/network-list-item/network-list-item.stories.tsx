import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { NetworkListItem } from './network-list-item';

export default {
  title: 'Components/Multichain/NetworkManager/NetworkListItem',
  component: NetworkListItem,
  argTypes: {
    onCheckboxChange: { action: 'onCheckboxChange' },
    onMoreOptionsClick: { action: 'onMoreOptionsClick' },
  },
} as Meta<typeof NetworkListItem>;

const Template: StoryFn<typeof NetworkListItem> = (args) => (
  <NetworkListItem {...args} />
);

export const Default = Template.bind({});
Default.args = {
  name: 'Ethereum',
  src: './images/eth_logo.svg',
  isChecked: true,
  balance: '$1,234.56',
};

export const WithoutBalance = Template.bind({});
WithoutBalance.args = {
  name: 'Arbitrum One',
  src: './images/arbitrum.svg',
  isChecked: false,
};

export const Unchecked = Template.bind({});
Unchecked.args = {
  name: 'Optimism',
  src: './images/optimism.svg',
  isChecked: false,
  balance: '$42.00',
};