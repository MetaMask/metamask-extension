import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from '../../../store/store';
import RemoteModeSetupDailyAllowance from './remote-mode-setup-daily-allowance.component';
import testData from '../../../../.storybook/test-data';

import { InternalAccount } from '@metamask/keyring-internal-api';

const store = configureStore(testData);

const mockAccounts: [InternalAccount] = [
  {
    address: '0x12C7e...q135f',
    type: 'eip155:eoa',
    id: '1',
    options: {},
    metadata: {
      name: 'Hardware Lockbox',
      importTime: 1717334400,
      keyring: {
        type: 'eip155',
      },
    },
    scopes: [],
    methods: [],
  },
];

export default {
  title: 'pages/vault/remotemode/setup',
  component: RemoteModeSetupDailyAllowance,
  id: 'pages-remote-mode-setup-daily-allowance--docs',
  decorators: [
    (story) => (
      <Provider store={store}>
        <MemoryRouter>{story()}</MemoryRouter>
      </Provider>
    ),
  ],
};

export const Default = () => (
  <RemoteModeSetupDailyAllowance accounts={mockAccounts} />
);
