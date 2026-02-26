import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';

import { NetworkManager } from './network-manager';

const store = configureStore(testData);

export default {
  title: 'Components/Multichain/NetworkManager',
  component: NetworkManager,
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
};

export const DefaultStory = (): JSX.Element => <NetworkManager />;
