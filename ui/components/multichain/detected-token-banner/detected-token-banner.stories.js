import React from 'react';
import { Provider } from 'react-redux';

import testData from '../../../../.storybook/test-data';
import configureStore from '../../../store/store';
import { DetectedTokensBanner } from './detected-token-banner';

const store = configureStore(testData);

export default {
  title: 'Components/Multichain/DetectedTokensBanner',
  component: DetectedTokensBanner,
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],

  argTypes: {
    setShowDetectedTokens: { control: 'func' },
  },
  args: {
    setShowDetectedTokens: 'setShowDetectedTokensSpy',
  },
};

export const DefaultStory = (args) => <DetectedTokensBanner {...args} />;

DefaultStory.storyName = 'Default';
