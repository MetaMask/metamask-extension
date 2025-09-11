import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import WalletDetails from './wallet-details.component';
import { MemoryRouter, Route } from 'react-router-dom';

// Mock the accountTree data that WalletDetails expects
const mockAccountTree = {
  wallets: {
    'entropy:test-entropy-wallet': {
      id: 'entropy:test-entropy-wallet',
      metadata: {
        name: 'Test Wallet',
      },
      groups: {
        'entropy:test-entropy-wallet': {
          id: 'entropy:test-entropy-wallet',
          metadata: {
            name: 'Default Group',
          },
          accounts: ['cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'],
        },
      },
    },
  },
};

const store = configureStore({
  ...testData,
  metamask: {
    ...testData.metamask,
    // Add the accountTree to the metamask state
    accountTree: mockAccountTree,
  },
});

const walletId = encodeURIComponent('entropy:test-entropy-wallet');

const meta: Meta<typeof WalletDetails> = {
  title: 'Pages/MultichainAccounts/WalletDetails',
  component: WalletDetails,
  decorators: [
    (story) => (
      <Provider store={store}>
        <MemoryRouter initialEntries={[`/wallet-details/${walletId}`]}>
          <Route path="/wallet-details/:id">{story()}</Route>
        </MemoryRouter>
      </Provider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WalletDetails>;

export const Default: Story = {};
