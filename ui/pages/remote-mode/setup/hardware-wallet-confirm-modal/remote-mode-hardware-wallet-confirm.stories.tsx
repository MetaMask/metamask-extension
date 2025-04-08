import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from '../../../../store/store';
import RemoteModeHardwareWalletConfirm from './remote-mode-hardware-wallet-confirm.component';

const store = configureStore({});

export default {
  title: 'components/vault/remotemode/hardwarewalletconfirm',
  component: RemoteModeHardwareWalletConfirm,
  id: 'pages-remote-mode-hardware-wallet-confirm--docs',
  decorators: [
    (story) => (
      <Provider store={store}>
        <MemoryRouter>{story()}</MemoryRouter>
      </Provider>
    ),
  ],
};

export const Default = () => (
  <RemoteModeHardwareWalletConfirm
    visible={true}
    onConfirm={() => {}}
    onClose={() => {}}
  />
);
