import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';

import { NetworkManager } from '.';

const customNetworkStore = configureStore({});

export default {
  title: 'Components/Multichain/NetworkManager',
  component: NetworkManager,
  argTypes: {
    onClose: {
      action: 'onClose',
    },
    isOpen: {
      control: 'boolean',
    },
  },
};

export const DefaultStory = (args = { isOpen: true }) => (
  <NetworkManager {...args} />
);
DefaultStory.decorators = [
  (Story) => (
    <Provider store={customNetworkStore}>
      <Story />
    </Provider>
  ),
];
