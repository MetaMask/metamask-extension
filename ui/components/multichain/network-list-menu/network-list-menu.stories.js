import React from 'react';
import { Provider } from 'react-redux';

import testData from '../../../../.storybook/test-data';
import configureStore from '../../../store/store';
import { NetworkListMenu } from '.';

const store = configureStore(testData);

export default {
  title: 'Components/Multichain/NetworkListMenu',
  component: NetworkListMenu,
  argTypes: {},
};

export const DefaultStory = (args) => <NetworkListMenu {...args} />;
DefaultStory.decorators = [
  (story) => <Provider store={store}>{story()}</Provider>,
];
