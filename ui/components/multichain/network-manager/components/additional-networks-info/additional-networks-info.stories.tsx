import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../../../store/store';

import { AdditionalNetworksInfo } from '.';

const customNetworkStore = configureStore({});

export default {
  title: 'Components/Multichain/NetworkManager/AdditionalNetworks',
  component: AdditionalNetworksInfo,
  argTypes: {},
};

export const DefaultStory = () => <AdditionalNetworksInfo />;
DefaultStory.decorators = [
  (Story) => (
    <Provider store={customNetworkStore}>
      <Story />
    </Provider>
  ),
];
