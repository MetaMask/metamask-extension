import React from 'react';
import { Provider } from 'react-redux';

import testData from '../../../../../.storybook/test-data';
import configureStore from '../../../../store/store';
import DetectedTokenSelectionPopover from './detected-token-selection-popover';

const store = configureStore(testData);

export default {
  title: 'Components/App/DetectedToken',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  id: __filename,
};

const Template = () => {
  return <DetectedTokenSelectionPopover />;
};

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';
