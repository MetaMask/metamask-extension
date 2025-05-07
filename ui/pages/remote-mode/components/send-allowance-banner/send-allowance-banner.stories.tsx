import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from '../../../../store/store';
import SendAllowanceBanner from './send-allowance-banner.component';
import testData from '../../../../../.storybook/test-data';

const store = configureStore(testData);

export default {
  title: 'Components/Vault/RemoteMode/SendAllowanceBanner',
  component: SendAllowanceBanner,
  decorators: [
    (story) => (
      <Provider store={store}>
        <MemoryRouter>{story()}</MemoryRouter>
      </Provider>
    ),
  ],
};

export const Default = () => (
  <SendAllowanceBanner />
);
