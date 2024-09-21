import React from 'react';

import { Provider } from 'react-redux';

import testData from '../../../../.storybook/test-data';
import configureStore from '../../../store/store';

import { ReceiveModal } from '.';

const store = configureStore(testData);

export default {
  title: 'Components/Multichain/ReceiveModal',
  component: ReceiveModal,
  argTypes: {
    address: {
      control: 'text',
    },
    onClose: {
      action: 'onClose',
    },
  },
  args: {
    address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
    onClose: () => undefined,
  },
};

export const DefaultStory = (args) => <ReceiveModal {...args} />;
DefaultStory.decorators = [
  (story) => <Provider store={store}>{story()}</Provider>,
];
DefaultStory.storyName = 'Default';
