import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import { NETWORK_TYPES } from '../../../../shared/constants/network';
import { DetectedTokensBanner } from '.';

const store = configureStore({
  ...testData,
  metamask: {
    ...testData.metamask,
    selectedNetworkClientId: NETWORK_TYPES.SEPOLIA,
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
