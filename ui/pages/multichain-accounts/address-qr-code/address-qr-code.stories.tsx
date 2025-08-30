import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route } from 'react-router-dom';
import { EthAccountType, SolAccountType } from '@metamask/keyring-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import configureStore from '../../../store/store';
import { Box } from '../../../components/component-library';
import { AddressQRCode } from './address-qr-code';

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

// Minimal mock store data with network configurations
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
    accounts: {
      [account.address]: {
        address: account.address,
        balance: '0x1bc16d674ec80000', // 2 ETH in hex
      },
    },
    keyrings: [
      {
        type: KeyringTypes.hd,
        accounts: account.type === EthAccountType.Eoa ? [account.address] : [],
      },
      {
        type: KeyringTypes.snap,
        accounts:
          account.type === SolAccountType.DataAccount ? [account.address] : [],
      },
    ],
    useBlockie: false,
    providerConfig: {
      chainId: '0x1',
      type: 'mainnet',
      rpcUrl:
        account.type === EthAccountType.Eoa
          ? 'https://mainnet.infura.io/v3/abc123'
          : 'https://api.mainnet-beta.solana.com',
      nickname:
        account.type === EthAccountType.Eoa
          ? 'Ethereum Mainnet'
          : 'Solana Mainnet',
      ticker: account.type === EthAccountType.Eoa ? 'ETH' : 'SOL',
      rpcPrefs: {
        blockExplorerUrl:
          account.type === EthAccountType.Eoa
            ? 'https://etherscan.io'
            : 'https://explorer.solana.com',
      },
    },
    networkConfigurations: {
      mainnet: {
        chainId: '0x1',
        nickname: 'Ethereum Mainnet',
        rpcUrl: 'https://mainnet.infura.io/v3/abc123',
        ticker: 'ETH',
        type: 'custom',
        blockExplorerUrl: 'https://etherscan.io',
        rpcEndpoints: [
          {
            url: 'https://mainnet.infura.io/v3/abc123',
            type: 'custom',
            networkClientId: 'mainnet',
          },
        ],
        defaultRpcEndpointIndex: 0,
        name: 'Ethereum Mainnet',
        nativeCurrency: 'ETH',
      },
    },
    networkConfigurationsByChainId: {
      '0x1': {
        chainId: '0x1',
        nickname: 'Ethereum Mainnet',
        rpcUrl: 'https://mainnet.infura.io/v3/abc123',
        ticker: 'ETH',
        type: 'custom',
        blockExplorerUrl: 'https://etherscan.io',
        rpcEndpoints: [
          {
            url: 'https://mainnet.infura.io/v3/abc123',
            type: 'custom',
            networkClientId: 'mainnet',
          },
        ],
        defaultRpcEndpointIndex: 0,
        name: 'Ethereum Mainnet',
        nativeCurrency: 'ETH',
      },
    },
    selectedNetworkClientId: 'mainnet',
    isEvmSelected: account.type !== SolAccountType.DataAccount,
    selectedMultichainNetworkChainId:
      account.type === SolAccountType.DataAccount
        ? 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'
        : '0x1',
    multichainNetworkConfigurationsByChainId:
      account.type === SolAccountType.DataAccount
        ? {
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
              chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
              name: 'Solana Mainnet',
              nativeCurrency:
                'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              isEvm: false,
            },
          }
        : {},
  },
});

// Story wrapper component
function StoryWrapper({ children, mockStore, address }) {
  return (
    <Provider store={configureStore(mockStore)}>
      <MemoryRouter initialEntries={[`/address-qr-code/${address}`]}>
        <Route path="/address-qr-code/:address">
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
        </Route>
      </MemoryRouter>
    </Provider>
  );
}

export default {
  title: 'Pages/MultichainAccounts/AddressQRCode',
  component: AddressQRCode,
};

// Ethereum Account QR Code Story
export const EthereumAddressQR = {
  render: () => (
    <StoryWrapper
      mockStore={createBaseMockStore(
        MOCK_ETH_ACCOUNT,
        MOCK_ETH_ACCOUNT.address,
      )}
      address={MOCK_ETH_ACCOUNT.address}
    >
      <AddressQRCode />
    </StoryWrapper>
  ),
};

// Solana Account QR Code Story
export const SolanaAddressQR = {
  render: () => (
    <StoryWrapper
      mockStore={createBaseMockStore(
        MOCK_SOLANA_ACCOUNT,
        MOCK_SOLANA_ACCOUNT.address,
      )}
      address={MOCK_SOLANA_ACCOUNT.address}
    >
      <AddressQRCode />
    </StoryWrapper>
  ),
};
