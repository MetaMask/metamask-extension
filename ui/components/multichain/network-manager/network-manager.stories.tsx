import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';

import { NetworkManagerRouter } from './network-manager';

const store = configureStore(testData);

export default {
  title: 'Components/Multichain/NetworkManager',
  component: NetworkManagerRouter,
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
};

export const DefaultStory = (): JSX.Element => <NetworkManagerRouter />;
