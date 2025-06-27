import React from 'react';
import { Provider } from 'react-redux';
import { EthAccountType, SolAccountType } from '@metamask/keyring-api';
import { KeyringTypes } from '@metamask/keyring-controller';
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
  type: EthAccountType.Eoa,
};

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
  type: SolAccountType.DataAccount,
};

// Minimal mock store data
const createBaseMockStore = (account, address) => ({
  appState: {
    accountDetailsAddress: address,
  },
  metamask: {
    internalAccounts: {
      accounts: {
        [account.id]: account,
      },
      selectedAccount: account.id,
    },
    useBlockie: false,
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
    <StoryWrapper mockStore={createBaseMockStore(MOCK_ETH_ACCOUNT, MOCK_ETH_ACCOUNT.address)}>
      <BaseAccountDetails />
    </StoryWrapper>
  ),
};

// Solana Account Story
export const SolanaAccount = {
  render: () => (
    <StoryWrapper mockStore={createBaseMockStore(MOCK_SOLANA_ACCOUNT, MOCK_SOLANA_ACCOUNT.address)}>
      <BaseAccountDetails />
    </StoryWrapper>
  ),
};