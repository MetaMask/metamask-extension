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

export const Default = () => (
  RemoteModeStatus({
    ...testData.metamask.internalAccounts.accounts['07c2cfec-36c9-46c4-8115-3836d3ac9047'],
    metadata: {
      ...testData.metamask.internalAccounts.accounts['07c2cfec-36c9-46c4-8115-3836d3ac9047'].metadata,
      importTime: Date.now(),
    },
  })
);