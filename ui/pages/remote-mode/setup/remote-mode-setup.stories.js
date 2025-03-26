import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from '../../../store/store';
import RemoteModeSetup from './remote-mode-setup.component';
import testData from '../../../../.storybook/test-data';

import { InternalAccount } from '@metamask/keyring-internal-api';

const store = configureStore(testData);

const mockAccounts = [
  {
    address: '0x1234567890123456789012345678901234567890',
    metadata: {
      name: 'Account 1',
    },
  },
  {
    address: '0x2345678901234567890123456789012345678901',
    metadata: {
      name: 'Account 2',
    },
  },
];

export default {
  title: 'Pages/Vault/RemoteMode/Setup',
  component: RemoteModeSetup,
  id: 'pages-remote-mode-setup--docs',
  decorators: [
    (story) => (
      <Provider store={store}>
        <MemoryRouter>{story()}</MemoryRouter>
      </Provider>
    ),
  ],
};

export const Default = () => (
  <RemoteModeSetup accounts={mockAccounts} />
);
