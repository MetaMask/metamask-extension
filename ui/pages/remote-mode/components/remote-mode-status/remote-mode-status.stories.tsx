import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from '../../../../store/store';
import RemoteModeStatus from './remote-mode-status.component';
import testData from '../../../../../.storybook/test-data';

const store = configureStore(testData);

export default {
  title: 'Components/Vault/RemoteMode/RemoteModeStatus',
  component: RemoteModeStatus,
  decorators: [
    (story) => (
      <Provider store={store}>
        <MemoryRouter>{story()}</MemoryRouter>
      </Provider>
    ),
  ],
};

export const Default = () =>
  RemoteModeStatus({
    enabled: true,
  });
