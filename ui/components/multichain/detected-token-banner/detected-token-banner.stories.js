import React from 'react';
import { Provider } from 'react-redux';

import { DetectedTokensBanner } from '.';
import testData from '../../../../.storybook/test-data';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { mockNetworkState } from '../../../../test/stub/networks';
import configureStore from '../../../store/store';

const store = configureStore({
  ...testData,
  metamask: {
    ...testData.metamask,
    ...mockNetworkState({ chainId: CHAIN_IDS.SEPOLIA }),
  },
});

export default {
  title: 'Components/Multichain/DetectedTokensBanner',
  component: DetectedTokensBanner,
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  argTypes: {
    actionButtonOnClick: { action: 'setShowDetectedTokens' },
  },
};

export const DefaultStory = (args) => <DetectedTokensBanner {...args} />;

DefaultStory.storyName = 'Default';
