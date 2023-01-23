import React from 'react';
import { defaultNetworksData } from '../networks-tab.constants';
import NetworksListItem from '.';

const defaultNetworks = defaultNetworksData.map((network) => ({
  ...network,
  viewOnly: true,
}));

const MainnetProps = {
  label: 'Mainnet',
  network: defaultNetworks[0],
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
