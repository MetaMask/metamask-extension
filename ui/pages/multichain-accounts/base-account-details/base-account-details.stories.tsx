import React from 'react';
import { Provider } from 'react-redux';
import { EthAccountType, SolAccountType } from '@metamask/keyring-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import configureStore from '../../../store/store';
import { Box } from '../../../components/component-library';
import { BaseAccountDetails } from './base-account-details';

// Mock Ethereum Account
const MOCK_ETH_ACCOUNT = {
  id: 'mock-eth-account-id',
  address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  metadata: {
    name: 'Account 1',
    keyring: {
      type: KeyringTypes.hd,
    },
    importTime: Date.now(),
  },
  options: {},
  methods: [
    'personal_sign',
    'eth_sign',
    'eth_signTransaction',
    'eth_signTypedData_v1',
    'eth_signTypedData_v3',
    'eth_signTypedData_v4',
  ],
  scopes: ['eip155:1'],
  type: EthAccountType.Eoa,
} as InternalAccount;

// Mock Solana Account
const MOCK_SOLANA_ACCOUNT = {
  id: 'mock-solana-account-id',
  address: 'DdHGa63k3vcH6kqDbX834GpeRUUef81Q8bUrBPdF937k',
  metadata: {
    name: 'Solana Account 1',
    keyring: {
      type: KeyringTypes.snap,
    },
    snap: {
      id: 'npm:@solana/wallet-snap',
      name: 'Solana Wallet',
      enabled: true,
    },
    importTime: Date.now(),
  },
  options: {
    entropySource: 'mock-hd-keyring-id',
  },
  methods: [
    'solana_signTransaction',
    'solana_signAllTransactions',
    'solana_signMessage',
  ],
  scopes: ['solana:mainnet'] as const,
  type: SolAccountType.DataAccount,
} as InternalAccount;

// Minimal mock store data
const createBaseMockStore = (account, address, walletName = 'Mock Wallet') => ({
  appState: {
    accountDetailsAddress: address,
  },
  activeTab: {
    id: 1,
    title: 'Test Dapp',
    origin: 'https://test-dapp.com',
    protocol: 'https:',
    url: 'https://test-dapp.com',
  },
  metamask: {
    useBlockie: false,
    internalAccounts: {
      accounts: {
        [account.id]: {
          ...account,
          address,
        },
      },
      selectedAccount: account.id,
    },
    accountTree: {
      wallets: {
        'mock-wallet-id': {
          id: 'mock-wallet-id',
          metadata: {
            name: walletName,
          },
          groups: {
            'mock-wallet-id:default': {
              id: 'mock-wallet-id:default',
              metadata: {
                name: 'Default',
              },
              accounts: [account.id],
            },
          },
        },
      },
    },
    networkConfigurationsByChainId: {
      '0x1': {
        chainId: '0x1',
        name: 'Ethereum Mainnet',
        nativeCurrency: 'ETH',
        blockExplorerUrls: ['https://etherscan.io'],
        rpcEndpoints: [
          {
            url: 'https://mainnet.infura.io/v3/your-project-id',
            type: 'infura',
            networkClientId: 'mainnet',
          },
        ],
        defaultRpcEndpointIndex: 0,
        defaultBlockExplorerUrlIndex: 0,
      },
    },
    selectedNetworkClientId: 'mainnet',
    accountsByChainId: {
      '0x1': {
        [address]: {
          balance: '0x0',
          address,
        },
      },
    },
    keyrings: [
      {
        type: 'HD Key Tree',
        accounts: [address],
        index: 0,
        metadata: {
          id: 'mock-hd-keyring-id',
          name: 'HD Key Tree',
        },
      },
    ],
    permissionHistory: {
      'https://test-dapp.com': {
        eth_accounts: {
          accounts: {
            [address]: Date.now(),
          },
        },
      },
    },
    pinnedAccountsList: [],
    hiddenAccountsList: [],
    connectedAccounts: [],
  },
});

// Story wrapper component similar to PendingApproval
function StoryWrapper({ children, mockStore }) {
  return (
    <Provider store={configureStore(mockStore)}>
      <Box
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '592px',
          width: '360px',
          margin: '0 auto',
          border: '1px solid #ccc',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <Box
          style={{
            display: 'flex',
            height: '100%',
            flexDirection: 'column',
          }}
        >
          <Box
            style={{
              flex: '1 1 auto',
              display: 'flex',
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Provider>
  );
}

export default {
  title: 'Pages/MultichainAccounts/BaseAccountDetails',
  component: BaseAccountDetails,
};

// Ethereum Account Story
export const EthereumAccount = {
  render: () => (
    <StoryWrapper mockStore={createBaseMockStore(MOCK_ETH_ACCOUNT, MOCK_ETH_ACCOUNT.address, 'My Ethereum Wallet')}>
      <BaseAccountDetails
        address={MOCK_ETH_ACCOUNT.address}
        account={MOCK_ETH_ACCOUNT}
      />
    </StoryWrapper>
  ),
};

// Solana Account Story
export const SolanaAccount = {
  render: () => (
    <StoryWrapper mockStore={createBaseMockStore(MOCK_SOLANA_ACCOUNT, MOCK_SOLANA_ACCOUNT.address, 'My Solana Wallet')}>
      <BaseAccountDetails
        address={MOCK_SOLANA_ACCOUNT.address}
        account={MOCK_SOLANA_ACCOUNT}
      />
    </StoryWrapper>
  ),
};
