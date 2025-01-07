import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import type { Meta, StoryObj } from '@storybook/react';
import NftsItems from './nfts-items';
import { mockNetworkState } from '../../../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';


// Custom middleware to ensure actions are plain objects
const ensurePlainObjectMiddleware = () => (next) => (action) => {
  if (typeof action === 'function') {
    return next(action());
  }
  return next(action);
};

const mockStore = configureStore([thunk, ensurePlainObjectMiddleware]);

const createMockState = () => ({
  metamask: {
    AppStateController: {
      nftsDropdownState: {
        '0x123': {
          '0x1': {
            '0x123': true, // This sets isExpanded to true for the specific collection
            previouslyOwned: true, // Expanded previously owned collection
          },
        },
      },
    },
    PreferencesController: {
      selectedAddress: '0x123',
      useRequestQueue: true,
    },
    AccountsController: {
      internalAccounts: {
        selectedAccount: 'selected-account-id',
        accounts: {
          'selected-account-id': {
            address: '0x123',
            id: 'selected-account-id',
            balance: '0x0',
            name: 'Account 1',
            metadata: {
              keyring: {
                type: 'HD Key Tree',
              },
            },
          },
        },
      },
    },
    AccountTracker: {
      accounts: {
        '0x123': {
          address: '0x123',
          balance: '0x0',
        },
      },
    },
    CurrencyController: {
      currentCurrency: 'usd',
    },
    NetworkController: {
      ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
    },
    NftController: {
      allNftContracts: [],
      allNfts: [],
    },
  },
  appState: {
    isLoading: false,
  },
  send: {
    currentTransactionUUID: '0x123',
    draftTransactions: {
      '0x123': {
        id: '0x123',
        status: 'unapproved',
        time: Date.now(),
        txParams: {
          from: '0x123',
          to: '0x456',
          value: '0x0',
          gas: '0x5208',
          gasPrice: '0x3b9aca00',
        },
        type: 'standard',
      },
    },
  },
});

const mockCollections = {
  '0x123': {
    nfts: [
      {
        address: '0x123',
        tokenId: '1',
        name: 'NFT 1',
        description: 'This is NFT 1',
        image: './catnip-spicywright.png',
        standard: 'ERC721',
      },
      {
        address: '0x123',
        tokenId: '2',
        name: 'NFT 2',
        description: 'This is NFT 2',
        image: './catnip-spicywright.png',
        standard: 'ERC721',
      },
    ],
    collectionName: 'Test Collection',
    collectionImage: './catnip-spicywright.png',
  },
};

const meta: Meta<typeof NftsItems> = {
  title: 'Components/App/Assets/NFTs/NftsItems',
  component: NftsItems,
  decorators: [
    (Story) => {
      const store = mockStore(createMockState());
      const originalDispatch = store.dispatch;
      store.dispatch = ((action: any) => {
        if (typeof action === 'function') {
          return action(originalDispatch, store.getState);
        }
        return originalDispatch(action);
      }) as typeof store.dispatch;
      return (
        <Provider store={store}>
          <Story />
        </Provider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof NftsItems>;

export const Default: Story = {
  args: {
    collections: mockCollections,
    previouslyOwnedCollection: { nfts: [] },
  },
};

export const Modal: Story = {
  args: {
    ...Default.args,
    isModal: true,
  },
};

export const WithPreviouslyOwnedCollection: Story = {
  args: {
    ...Default.args,
    previouslyOwnedCollection: {
      nfts: [
        {
          address: '0x456',
          tokenId: '3',
          name: 'Previously Owned NFT',
          description: 'This is a previously owned NFT',
          image: './catnip-spicywright.png',
          standard: 'ERC721',
        },
      ],
      collectionName: 'Previously Owned',
    },
  },
};
