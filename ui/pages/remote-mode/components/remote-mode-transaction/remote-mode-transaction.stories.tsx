import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from '../../../../store/store';
import RemoteModeTransaction from './remote-mode-transaction.component';
import testData from '../../../../../.storybook/test-data';

const store = configureStore(testData);

export default {
  title: 'Components/Vault/RemoteMode/RemoteModeTransaction',
  component: RemoteModeTransaction,
  decorators: [
    (story) => (
      <Provider store={store}>
        <MemoryRouter>{story()}</MemoryRouter>
      </Provider>
    ),
  ],
};

export const Default = () => (
  <RemoteModeTransaction />
);
