import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from '../../../../store/store';
import RevokeWithdrawlConfirm, { RevokeWithdrawlConfirmModalType } from './revoke-withdrawl-confirm-modal.component';

const store = configureStore({});

export default {
  title: 'Components/Vault/RemoteMode/RevokeWithdrawlConfirm',
  component: RevokeWithdrawlConfirm,
  decorators: [
    (story) => (
      <Provider store={store}>
        <MemoryRouter>{story()}</MemoryRouter>
      </Provider>
    ),
  ],
};

export const Default = () => (
  <RevokeWithdrawlConfirm
    visible={true}
    type={RevokeWithdrawlConfirmModalType.Swap}
    onConfirm={() => {}}
    onClose={() => {}}
  />
);
