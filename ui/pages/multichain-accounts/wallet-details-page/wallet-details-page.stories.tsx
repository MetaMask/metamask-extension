import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
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
      const stateCopy = JSON.parse(JSON.stringify(mockState));
      stateCopy.metamask.seedPhraseBackedUp = true;
      const store = configureStore(stateCopy);

      return (
        <Provider store={store}>
          <Story />
        </Provider>
      );
    },
  ],
  parameters: {
    initialEntries: [
      '/multichain-wallet-details-page/entropy%3A01JKAF3DSGM3AB87EM9N0K41AJ',
    ],
    path: '/multichain-wallet-details-page/:id',
    docs: {
      description: {
        story:
          'Default view of the Wallet Details Page showing an entropy wallet with its information and accounts.',
      },
    },
  },
};

export const KeyringWallet: Story = {
  decorators: [
    (Story) => {
      const stateCopy = JSON.parse(JSON.stringify(mockState));
      const store = configureStore(stateCopy);

      return (
        <Provider store={store}>
          <Story />
        </Provider>
      );
    },
  ],
  parameters: {
    initialEntries: [
      '/multichain-wallet-details-page/keyring%3ALedger%20Hardware',
    ],
    path: '/multichain-wallet-details-page/:id',
    docs: {
      description: {
        story:
          'View of the Wallet Details Page for a keyring-type wallet, showing a different UI with no SRP options.',
      },
    },
  },
};

export const SnapWallet: Story = {
  decorators: [
    (Story) => {
      const stateCopy = JSON.parse(JSON.stringify(mockState));
      const store = configureStore(stateCopy);

      return (
        <Provider store={store}>
          <Story />
        </Provider>
      );
    },
  ],
  parameters: {
    initialEntries: [
      '/multichain-wallet-details-page/snap%3Alocal%3Acustody%3Atest',
    ],
    path: '/multichain-wallet-details-page/:id',
    docs: {
      description: {
        story:
          'View of the Wallet Details Page for a Snap-type wallet, showing a different UI without SRP options.',
      },
    },
  },
};
