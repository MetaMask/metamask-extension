import React from 'react';
import { Provider } from 'react-redux';
import testData from '../../../../test/data/mock-state.json';

import configureStore from '../../../store/store';
import AppLoadingSpinner from './app-loading-spinner';

const customData = {
  ...testData,
  appState: {
    ...testData.appState,
    isLoading: true,
  },
};
const customStore = configureStore(customData);

export default {
  title: 'Components/App/AppLoadingSpinner',
  component: AppLoadingSpinner,
  decorators: [
    (Story) => (
      <Provider store={customStore}>
        <Story />
      </Provider>
    ),
  ],
};

const Template = (args) => <AppLoadingSpinner {...args} />;
export const Default = Template.bind({});
