import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from '../../../store/store';
import RemoteModeIntroducing from './remote-mode-introducing.component';

const store = configureStore({});

export default {
  title: 'Pages/Vault/RemoteMode/Introducing',
  component: RemoteModeIntroducing,
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
    <RemoteModeIntroducing />
  </>
);
