import React from 'react';
import testData from '../../../../../.storybook/test-data';
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
    networksToRender: testData.networkList,
  },
};

export const NetworksListComponent = (args) => {
  return <NetworksList {...args} />;
};
