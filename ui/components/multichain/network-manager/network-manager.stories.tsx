import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';

import { NetworkManager } from '.';

const store = configureStore({});

export default {
  title: 'Components/Multichain/NetworkManager',
  component: NetworkManager,
};

export const DefaultStory = (): JSX.Element => (
  <Provider store={store}>
    <NetworkManager />
  </Provider>
);
