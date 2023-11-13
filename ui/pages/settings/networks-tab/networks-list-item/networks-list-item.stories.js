import React from 'react';
import { defaultNetworksData } from '../networks-tab.constants';
import NetworksListItem from '.';

const MainnetProps = {
  label: 'Mainnet',
  network: defaultNetworksData[0],
  networkIsSelected: false,
  selectedRpcUrl: 'http://localhost:8545',
};

export default {
  title: 'Pages/Settings/NetworksTab/NetworksListItem',

  argTypes: {
    network: {
      control: 'object',
    },
    networkIsSelected: {
      control: 'boolean',
    },
    selectedRpcUrl: {
      control: 'text',
    },
    networkIndex: {
      control: 'number',
    },
  },
  args: {
    network: MainnetProps,
  },
};

export const DefaultStory = (args) => <NetworksListItem {...args} />;

DefaultStory.storyName = 'Default';
