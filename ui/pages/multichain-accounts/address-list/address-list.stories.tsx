import React, { ReactNode } from 'react';
import { StoryObj, Meta } from '@storybook/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { CaipChainId } from '@metamask/utils';
import { AddressList } from './address-list';
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

const createMockState = (selectedAccount = MOCK_ACCOUNT_EOA) => ({
  ...mockState,
  metamask: {
    ...mockState.metamask,
    internalAccounts: {
      ...mockState.metamask.internalAccounts,
      selectedAccount: selectedAccount.id,
      accounts: {
        [selectedAccount.id]: selectedAccount,
      },
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
});

const meta: Meta<typeof AddressList> = {
  title: 'Pages/MultichainAccounts/AddressList',
  component: AddressList,
  parameters: {
    backgrounds: {
      default: 'light',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AddressList>;

export const EthereumAccount: Story = {
  decorators: [
    (Story) => {
      const selectedAccount = {
        ...MOCK_ACCOUNT_EOA,
        scopes: ['eip155:*'] as CaipChainId[],
      };
      const store = mockStore(createMockState(selectedAccount));
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

export const SolanaAccount: Story = {
  decorators: [
    (Story) => {
      const selectedAccount = {
        ...MOCK_ACCOUNT_SOLANA_MAINNET,
        scopes: ['solana:*'] as CaipChainId[],
      };
      const store = mockStore(createMockState(selectedAccount));
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

export const BitcoinAccount: Story = {
  decorators: [
    (Story) => {
      const selectedAccount = {
        ...MOCK_ACCOUNT_BIP122_P2WPKH,
        scopes: ['bip122:*'] as CaipChainId[],
      };
      const store = mockStore(createMockState(selectedAccount));
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

export const SpecificNetworkAccount: Story = {
  decorators: [
    (Story) => {
      const selectedAccount = {
        ...MOCK_ACCOUNT_EOA,
        id: 'polygon-account',
        metadata: { ...MOCK_ACCOUNT_EOA.metadata, name: 'Polygon Account' },
        scopes: ['eip155:137'] as CaipChainId[], // Only Polygon network
      };
      const store = mockStore(createMockState(selectedAccount));
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

export const MultiNetworkAccount: Story = {
  decorators: [
    (Story) => {
      const selectedAccount = {
        ...MOCK_ACCOUNT_EOA,
        id: 'multi-network',
        metadata: {
          ...MOCK_ACCOUNT_EOA.metadata,
          name: 'Multi-Network Account',
        },
        scopes: ['eip155:1', 'eip155:137', 'eip155:42161'] as CaipChainId[], // Ethereum, Polygon, Arbitrum
      };
      const store = mockStore(createMockState(selectedAccount));
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
