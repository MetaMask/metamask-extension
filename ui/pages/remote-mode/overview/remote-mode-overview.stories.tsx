import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from '../../../store/store';
import RemoteModeOverview from './remote-mode-overview.container';
import testData from '../../../../.storybook/test-data';

const store = configureStore(testData);

export default {
  title: 'Pages/Vault/RemoteMode/Overview',
  component: RemoteModeOverview,
  decorators: [
    (story) => (
      <Provider store={store}>
        <MemoryRouter>{story()}</MemoryRouter>
      </Provider>
    ),
  ],
};

export const Default = () => (
  <RemoteModeOverview />
);
