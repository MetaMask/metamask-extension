import React, { ReactNode } from 'react';
import { StoryObj, Meta } from '@storybook/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { CaipChainId } from '@metamask/utils';
import {
  AccountGroupId,
  AccountGroupType,
  AccountWalletType,
} from '@metamask/account-api';
import { MultichainAccountAddressListPage } from './multichain-account-address-list-page';
import mockState from '../../../../test/data/mock-state.json';
import {
  MOCK_ACCOUNT_EOA,
  MOCK_ACCOUNT_BIP122_P2WPKH,
  MOCK_ACCOUNT_SOLANA_MAINNET,
} from '../../../../test/data/mock-accounts';

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
    <Route path="*">{children}</Route>
  </MemoryRouter>
);

// Helper function to create mock multichain accounts
const createMultichainAccounts = () => {
  const evmAccount = {
    ...MOCK_ACCOUNT_EOA,
    id: 'evm-multichain',
    metadata: { ...MOCK_ACCOUNT_EOA.metadata, name: 'EVM Account' },
    scopes: ['eip155:*'] as CaipChainId[],
  };
  const solanaAccount = {
    ...MOCK_ACCOUNT_SOLANA_MAINNET,
    id: 'solana-multichain',
    metadata: {
      ...MOCK_ACCOUNT_SOLANA_MAINNET.metadata,
      name: 'Solana Account',
    },
    scopes: ['solana:*'] as CaipChainId[],
  };
  const bitcoinAccount = {
    ...MOCK_ACCOUNT_BIP122_P2WPKH,
    id: 'bitcoin-multichain',
    metadata: {
      ...MOCK_ACCOUNT_BIP122_P2WPKH.metadata,
      name: 'Bitcoin Account',
    },
    scopes: ['bip122:*'] as CaipChainId[],
  };

  return [evmAccount, solanaAccount, bitcoinAccount];
};

const createMockState = (
  accounts = [MOCK_ACCOUNT_EOA],
  groupName = 'Test Multichain Account',
) => {
  const groupId = 'test-group-id' as AccountGroupId;
  const accountsById = accounts.reduce(
    (acc, account) => {
      acc[account.id] = account;
      return acc;
    },
    {} as Record<string, any>,
  );

  return {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      accountTree: {
        wallets: {
          'test-wallet': {
            id: 'test-wallet',
            type: AccountWalletType.Entropy,
            groups: {
              [groupId]: {
                id: groupId,
                type: AccountGroupType.MultichainAccount,
                accounts: accounts.map((account) => account.id),
                metadata: {
                  name: groupName,
                  entropy: { groupIndex: 0 },
                  pinned: false,
                  hidden: false,
                },
              },
            },
            metadata: {
              name: 'Test Wallet',
              entropy: { id: 'test' },
            },
          },
        },
        selectedAccountGroup: groupId,
      },
      internalAccounts: {
        ...mockState.metamask.internalAccounts,
        selectedAccount: accounts[0]?.id || '',
        accounts: accountsById,
      },
      remoteFeatureFlags: {
        ...mockState.metamask.remoteFeatureFlags,
        addSolanaAccount: true,
        addBitcoinAccount: true,
      },
      // Override the EVM network configurations to have proper names
      networkConfigurationsByChainId: {
        '0x1': {
          ...mockState.metamask.networkConfigurationsByChainId['0x1'],
          name: 'Ethereum Mainnet',
        },
        '0x89': {
          chainId: '0x89',
          name: 'Polygon Mainnet',
          nativeCurrency: 'MATIC',
          rpcEndpoints: [
            {
              networkClientId: 'polygon',
              type: 'custom',
              url: 'https://polygon-rpc.com',
            },
          ],
          defaultRpcEndpointIndex: 0,
          blockExplorerUrls: ['https://polygonscan.com'],
          defaultBlockExplorerUrlIndex: 0,
        },
        '0xa4b1': {
          chainId: '0xa4b1',
          name: 'Arbitrum One',
          nativeCurrency: 'ETH',
          rpcEndpoints: [
            {
              networkClientId: 'arbitrum',
              type: 'custom',
              url: 'https://arb1.arbitrum.io/rpc',
            },
          ],
          defaultRpcEndpointIndex: 0,
          blockExplorerUrls: ['https://arbiscan.io'],
          defaultBlockExplorerUrlIndex: 0,
        },
        ...Object.fromEntries(
          Object.entries(
            mockState.metamask.networkConfigurationsByChainId,
          ).filter(([chainId]) => !['0x1'].includes(chainId)),
        ),
      },
      multichainNetworkConfigurationsByChainId: {
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
          chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          name: 'Solana Mainnet',
          nativeCurrency: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
          isEvm: false,
        },
        'bip122:000000000019d6689c085ae165831e93': {
          chainId: 'bip122:000000000019d6689c085ae165831e93',
          name: 'Bitcoin Mainnet',
          nativeCurrency: 'bip122:000000000019d6689c085ae165831e93/slip44:0',
          isEvm: false,
        },
      },
    },
  };
};

const meta: Meta<typeof MultichainAccountAddressListPage> = {
  title: 'Pages/MultichainAccounts/MultichainAccountAddressListPage',
  component: MultichainAccountAddressListPage,
  parameters: {
    backgrounds: {
      default: 'light',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MultichainAccountAddressListPage>;

export const Default: Story = {
  decorators: [
    (Story) => {
      const accounts = createMultichainAccounts();
      const store = mockStore(
        createMockState(accounts, 'Full Multichain Account'),
      );
      return (
        <Provider store={store}>
          <Wrapper>
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
      const accounts = createMultichainAccounts();
      const store = mockStore(
        createMockState(accounts, 'Full Multichain Account'),
      );
      return (
        <Provider store={store}>
          <Wrapper
            initialEntries={[
              '/multichain-account-address-list/test-group-id?source=receive',
            ]}
          >
            <Story />
          </Wrapper>
        </Provider>
      );
    },
  ],
};

export const EmptyNetworksState: Story = {
  decorators: [
    (Story) => {
      const accounts = createMultichainAccounts();
      const mockStateWithEmptyNetworks = createMockState(
        accounts,
        'Multichain Account',
      );
      // Remove all multichain networks to show empty state
      mockStateWithEmptyNetworks.metamask.multichainNetworkConfigurationsByChainId = {};
      
      const store = mockStore(mockStateWithEmptyNetworks);
      return (
        <Provider store={store}>
          <Wrapper>
            <Story />
          </Wrapper>
        </Provider>
      );
    },
  ],
};
