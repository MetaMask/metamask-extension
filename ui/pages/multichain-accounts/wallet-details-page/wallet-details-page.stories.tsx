import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route } from 'react-router-dom';
import { WalletDetailsPage } from './wallet-details-page';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';

const meta: Meta<typeof WalletDetailsPage> = {
  title: 'Pages/MultichainAccounts/WalletDetailsPage',
  component: WalletDetailsPage,
  parameters: {
    backgrounds: {
      default: 'light',
    },
  },
};

export default meta;
type Story = StoryObj<typeof WalletDetailsPage>;

export const EntropyWallet: Story = {
  decorators: [
    (Story) => {
      const entropyWalletId = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ';
      const encodedWalletId = encodeURIComponent(entropyWalletId);
      const stateCopy = JSON.parse(JSON.stringify(mockState));
      stateCopy.metamask.seedPhraseBackedUp = true;

      const store = configureStore(stateCopy);

      return (
        <Provider store={store}>
          <MemoryRouter
            initialEntries={[
              `/multichain-wallet-details-page/${encodedWalletId}`,
            ]}
          >
            <Route path="/multichain-wallet-details-page/:id">
              <Story />
            </Route>
          </MemoryRouter>
        </Provider>
      );
    },
  ],
};

EntropyWallet.parameters = {
  docs: {
    description: {
      story:
        'Default view of the Wallet Details Page showing an entropy wallet with its information and accounts.',
    },
  },
};

export const KeyringWallet: Story = {
  decorators: [
    (Story) => {
      const keyringWalletId = 'keyring:Ledger Hardware';
      const encodedKeyringWalletId = encodeURIComponent(keyringWalletId);
      const stateCopy = JSON.parse(JSON.stringify(mockState));
      const store = configureStore(stateCopy);

      return (
        <Provider store={store}>
          <MemoryRouter
            initialEntries={[
              `/multichain-wallet-details-page/${encodedKeyringWalletId}`,
            ]}
          >
            <Route path="/multichain-wallet-details-page/:id">
              <Story />
            </Route>
          </MemoryRouter>
        </Provider>
      );
    },
  ],
};

KeyringWallet.parameters = {
  docs: {
    description: {
      story:
        'View of the Wallet Details Page for a keyring-type wallet, showing a different UI with no SRP options.',
    },
  },
};

export const SnapWallet: Story = {
  decorators: [
    (Story) => {
      const snapWalletId = 'snap:local:custody:test';
      const encodedSnapWalletId = encodeURIComponent(snapWalletId);
      const stateCopy = JSON.parse(JSON.stringify(mockState));
      const store = configureStore(stateCopy);

      return (
        <Provider store={store}>
          <MemoryRouter
            initialEntries={[
              `/multichain-wallet-details-page/${encodedSnapWalletId}`,
            ]}
          >
            <Route path="/multichain-wallet-details-page/:id">
              <Story />
            </Route>
          </MemoryRouter>
        </Provider>
      );
    },
  ],
};

SnapWallet.parameters = {
  docs: {
    description: {
      story:
        'View of the Wallet Details Page for a Snap-type wallet, showing a different UI without SRP options.',
    },
  },
};
