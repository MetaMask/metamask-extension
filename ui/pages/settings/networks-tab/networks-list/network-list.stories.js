import React from 'react';
import { networkList } from '../../../../../.storybook/test-data';
import NetworksList from './networks-list';

export default {
  title: 'Pages/Settings/NetworksTab/NetworksList',

  argTypes: {
    networkDefaultedToProvider: {
      control: 'boolean',
    },
    networkIsSelected: {
      control: 'boolean',
    },
    networksToRender: {
      control: 'array',
    },
  },
  args: {
    networkDefaultedToProvider: false,
    networkIsSelected: false,
    networksToRender: networkList,
  },
};

export const NetworksListComponent = (args) => {
  return <NetworksList {...args} />;
};
