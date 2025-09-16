import React, { ReactNode } from 'react';
import { StoryObj, Meta } from '@storybook/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { AccountGroupId } from '@metamask/account-api';
import { MultichainAccountAddressListPage } from './multichain-account-address-list-page';
import mockState from '../../../../test/data/mock-state.json';

const mockStore = configureStore([]);

interface WrapperProps {
  children: ReactNode;
  initialEntries?: string[];
}

const Wrapper: React.FC<WrapperProps> = ({
  children,
  initialEntries = ['/accounts'],
}) => (
  <MemoryRouter initialEntries={initialEntries}>
    <Route path="/multichain-account-address-list/:accountGroupId">
      {children}
    </Route>
  </MemoryRouter>
);

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
    (Story) => {
      const store = mockStore(mockState);
      return (
        <Provider store={store}>
          <Wrapper
            initialEntries={[
              `/multichain-account-address-list/${encodeURIComponent(
                MOCK_GROUP_ID,
              )}`,
            ]}
          >
            <Story />
          </Wrapper>
        </Provider>
      );
    },
  ],
};

export const ReceivingAddress: Story = {
  decorators: [
    (Story) => {
      const store = mockStore(mockState);
      return (
        <Provider store={store}>
          <Wrapper
            initialEntries={[
              `/multichain-account-address-list/${encodeURIComponent(
                MOCK_GROUP_ID,
              )}?source=receive`,
            ]}
          >
            <Story />
          </Wrapper>
        </Provider>
      );
    },
  ],
};

export const NoAccounts: Story = {
  decorators: [
    (Story) => {
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
          <Wrapper
            initialEntries={[
              `/multichain-account-address-list/${encodeURIComponent(
                MOCK_GROUP_ID,
              )}`,
            ]}
          >
            <Story />
          </Wrapper>
        </Provider>
      );
    },
  ],
};
