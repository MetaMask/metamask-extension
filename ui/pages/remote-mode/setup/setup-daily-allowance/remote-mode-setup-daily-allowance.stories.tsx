import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from '../../../../store/store';
import RemoteModeSetupDailyAllowance from './remote-mode-setup-daily-allowance.component';
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

export const Default = () => <RemoteModeSetupDailyAllowance />;
