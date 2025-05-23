import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { AdditionalNetworkItem } from './additional-network-item';

export default {
  title: 'Components/Multichain/NetworkManager/AdditionalNetworkItem',
  component: AdditionalNetworkItem,
  argTypes: {
    name: {
      control: 'text',
      description: 'The name of the network',
    },
    src: {
      control: 'text',
      description: 'The source URL for the network icon',
    },
    onClick: {
      action: 'clicked',
      description: 'Function to call when the network item is clicked',
    },
    className: {
      control: 'text',
      description: 'Optional className for styling',
    },
    addButtonAriaLabel: {
      control: 'text',
      description: 'Aria label for the add button',
    },
  },
} as Meta<typeof AdditionalNetworkItem>;

const Template: StoryFn<typeof AdditionalNetworkItem> = (args) => (
  <AdditionalNetworkItem {...args} />
);

export const Default = Template.bind({});
Default.args = {
  name: 'Base',
  src: './images/base.svg',
  onClick: action('clicked'),
};

export const WithCustomAriaLabel = Template.bind({});
WithCustomAriaLabel.args = {
  name: 'Polygon',
  src: './images/polygon.svg',
  onClick: action('clicked'),
  addButtonAriaLabel: 'Add Polygon Network',
};