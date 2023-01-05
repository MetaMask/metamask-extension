import React from 'react';
import { Provider } from 'react-redux';

import testData from '../../../../../.storybook/test-data';
import configureStore from '../../../../store/store';
import DetectedTokensLink from './detected-tokens-link';

const store = configureStore(testData);

export default {
  title: 'Components/App/AssetList/DetectedTokensLink',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],

  argTypes: {
    setShowDetectedTokens: { control: 'func' },
  },
  args: {
    setShowDetectedTokens: 'setShowDetectedTokensSpy',
  },
};

const Template = (args) => {
  return <DetectedTokensLink {...args} />;
};

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';
