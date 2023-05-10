/* eslint-disable react/prop-types */
import React from 'react';
import { Provider } from 'react-redux';

import configureStore from '../../store/store';

import mockState from '../../../.storybook/test-data';

import FoxSelection from './fox-selection.component';

const store = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

export default {
  title: 'Pages/FoxSelection',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
};

export const DefaultStory = () => <FoxSelection />;
DefaultStory.storyName = 'Default';
