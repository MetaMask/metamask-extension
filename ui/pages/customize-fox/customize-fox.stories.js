/* eslint-disable react/prop-types */
import React from 'react';
import { Provider } from 'react-redux';

import configureStore from '../../store/store';

import mockState from '../../../.storybook/test-data';

import CustomizeFox from '.';

const store = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

export default {
  title: 'Pages/CustomizeFox',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
};

export const DefaultStory = () => <CustomizeFox />;
DefaultStory.storyName = 'Default';
