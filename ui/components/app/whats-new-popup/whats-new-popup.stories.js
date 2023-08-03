import React from 'react';
import { Provider } from 'react-redux';
import testData from '../../../../.storybook/test-data';
import configureStore from '../../../store/store';
import WhatsNewPopup from '.';

export default {
  title: 'Components/Multichain/WhatsNewPopup',
  component: WhatsNewPopup,
  argTypes: {
    onClose: {
      action: 'onClose',
    },
  },
};

export const DefaultStory = (args) => <WhatsNewPopup {...args} />;
DefaultStory.decorators = [
  (Story) => (
    <Provider store={configureStore(testData)}>
      <Story />
    </Provider>
  ),
];

DefaultStory.storyName = 'Default';
