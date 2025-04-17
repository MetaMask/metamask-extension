import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from '../../../../store/store';
import RemoteModeSetupSwaps from './remote-mode-setup-swaps.component';
import testData from '../../../../../.storybook/test-data';

import { InternalAccount } from '@metamask/keyring-internal-api';

const store = configureStore(testData);

export default {
  title: 'Pages/Vault/RemoteMode/SetupSwaps',
  component: RemoteModeSetupSwaps,
  decorators: [
    (story) => (
      <Provider store={store}>
        <MemoryRouter>{story()}</MemoryRouter>
      </Provider>
    ),
  ],
};

export const Default = () => <RemoteModeSetupSwaps />;
