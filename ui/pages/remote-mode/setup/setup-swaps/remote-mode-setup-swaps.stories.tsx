import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from '../../../../store/store';
import RemoteModeSetupSwaps from './remote-mode-setup-swaps.component';
import testData from '../../../../../.storybook/test-data';

const mockDelegationState = {
  delegations: {},
};

const store = configureStore({
  ...testData,
  metamask: {
    ...testData.metamask,
    ...mockDelegationState,
  },
});

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
