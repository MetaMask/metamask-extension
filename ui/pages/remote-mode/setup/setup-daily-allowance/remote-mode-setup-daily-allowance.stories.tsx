import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from '../../../../store/store';
import RemoteModeSetupDailyAllowance from './remote-mode-setup-daily-allowance.component';
import testData from '../../../../../.storybook/test-data';

import { InternalAccount } from '@metamask/keyring-internal-api';

const store = configureStore(testData);

export default {
  title: 'Pages/Vault/RemoteMode/SetupDailyAllowance',
  component: RemoteModeSetupDailyAllowance,
  decorators: [
    (story) => (
      <Provider store={store}>
        <MemoryRouter>{story()}</MemoryRouter>
      </Provider>
    ),
  ],
};

export const Default = () => (
  <RemoteModeSetupDailyAllowance />
);
