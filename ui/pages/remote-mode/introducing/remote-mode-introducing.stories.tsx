import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from '../../../store/store';
import RemoteModeOverview from './remote-mode-overview.component';
import RemoteModePermissions from './remote-mode-permissions.component';

const store = configureStore({});

export default {
  title: 'Pages/Vault/RemoteMode/Introducing',
  component: RemoteModeOverview,
  id: 'pages-remote-mode-introducing--docs',
  decorators: [
    (story) => (
      <Provider store={store}>
        <MemoryRouter>{story()}</MemoryRouter>
      </Provider>
    ),
  ],
};

export const Default = () => (
  <>
    <RemoteModeOverview />
    <RemoteModePermissions />
  </>
);
