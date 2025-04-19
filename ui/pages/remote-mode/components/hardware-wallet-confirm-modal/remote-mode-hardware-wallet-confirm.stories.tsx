import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from '../../../../store/store';
import RemoteModeHardwareWalletConfirm from './remote-mode-hardware-wallet-confirm.component';

const store = configureStore({});

export default {
  title: 'Components/Vault/RemoteMode/HardwareWalletConfirm',
  component: RemoteModeHardwareWalletConfirm,
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
