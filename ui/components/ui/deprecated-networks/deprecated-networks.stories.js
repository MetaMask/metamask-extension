import React from 'react';
import { Provider } from 'react-redux';

import testData from '../../../../.storybook/test-data';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { mockNetworkState } from '../../../../test/stub/networks';
import configureStore from '../../../store/store';
import DeprecatedNetworks from './deprecated-networks';

const store = (chainId, rpcUrl) =>
  configureStore({
    ...testData,
    metamask: {
      ...testData.metamask,
      completedOnboarding: true,
      ...mockNetworkState({ chainId, rpcUrl }),
    },
  });

export default {
  title: 'Components/UI/DeprecatedNetworks',
};

export const GoerliStory = () => <DeprecatedNetworks />;
GoerliStory.storyName = 'Goerli';
GoerliStory.decorators = [
  (Story) => (
    <Provider store={store(CHAIN_IDS.GOERLI)}>
      <Story />
    </Provider>
  ),
];

export const AuroraStory = () => <DeprecatedNetworks />;
AuroraStory.storyName = 'Aurora';
AuroraStory.decorators = [
  (Story) => (
    <Provider
      store={store(CHAIN_IDS.AURORA, 'https://aurora-mainnet.infura.io/')}
    >
      <Story />
    </Provider>
  ),
];
