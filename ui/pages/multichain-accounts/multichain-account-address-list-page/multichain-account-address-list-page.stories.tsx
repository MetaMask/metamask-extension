import React, { ReactNode } from 'react';
import { StoryObj, Meta } from '@storybook/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { AccountGroupId } from '@metamask/account-api';
import { MultichainAccountAddressListPage } from './multichain-account-address-list-page';
import mockState from '../../../../test/data/mock-state.json';

const mockStore = configureStore([]);

// Use actual group IDs from mock-state.json
const MOCK_GROUP_ID = 'entropy:01JKAF3PJ247KAM6C03G5Q0NP8/0' as AccountGroupId;
const MOCK_WALLET_ID = 'entropy:01JKAF3PJ247KAM6C03G5Q0NP8';

const meta: Meta<typeof MultichainAccountAddressListPage> = {
  title: 'Pages/MultichainAccounts/MultichainAccountAddressListPage',
  component: MultichainAccountAddressListPage,
};

export default meta;
type Story = StoryObj<typeof MultichainAccountAddressListPage>;

export const Default: Story = {
  decorators: [
    (story) => {
      const store = mockStore(mockState);
      return (
        <Provider store={store}>
          {story()}
        </Provider>
      );
    },
  ],
};
Default.parameters = {
  initialEntries: [`/multichain-account-address-list/${encodeURIComponent(MOCK_GROUP_ID)}`],
  path: '/multichain-account-address-list/:accountGroupId',
};

export const ReceivingAddress: Story = {
  decorators: [
    (story) => {
      const store = mockStore(mockState);
      return (
        <Provider store={store}>
          {story()}
        </Provider>
      );
    },
  ],
};
ReceivingAddress.parameters = {
  initialEntries: [`/multichain-account-address-list/${encodeURIComponent(MOCK_GROUP_ID)}?source=receive`],
  path: '/multichain-account-address-list/:accountGroupId',
};

export const NoAccounts: Story = {
  decorators: [
    (story) => {
      const store = mockStore({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          accountTree: {
            ...mockState.metamask.accountTree,
            wallets: {
              ...mockState.metamask.accountTree.wallets,
              [MOCK_WALLET_ID]: {
                ...mockState.metamask.accountTree.wallets[MOCK_WALLET_ID],
                groups: {
                  [MOCK_GROUP_ID]: {
                    ...mockState.metamask.accountTree.wallets[MOCK_WALLET_ID]
                      .groups[MOCK_GROUP_ID],
                    accounts: [], // No accounts in the group
                  },
                },
              },
            },
          },
        },
      });
      return (
        <Provider store={store}>
          {story()}
        </Provider>
      );
    },
  ],
};

NoAccounts.parameters = {
  initialEntries: [`/multichain-account-address-list/${encodeURIComponent(MOCK_GROUP_ID)}`],
  path: '/multichain-account-address-list/:accountGroupId',
};
