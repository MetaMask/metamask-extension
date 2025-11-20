import React from 'react';
import { screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  MOCK_ACCOUNT_EOA,
  MOCK_ACCOUNT_ERC4337,
  MOCK_ACCOUNT_SOLANA_MAINNET,
} from '../../../../test/data/mock-accounts';
import { MultichainAccountDetails } from './multichain-account-details';

const middleware = [thunk];
const mockStore = configureMockStore(middleware);

const mockUseParams = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useParams: () => mockUseParams(),
  };
});

const createMockState = (address: string, account = MOCK_ACCOUNT_EOA) => ({
  appState: {
    accountDetailsAddress: address,
  },
  activeTab: {
    origin: 'test',
  },
  metamask: {
    internalAccounts: {
      accounts: {
        [account.id]: {
          ...account,
          address,
        },
      },
      selectedAccount: account.id,
    },
    networkConfigurationsByChainId: {
      '0x1': {
        chainId: '0x1',
        name: 'Ethereum Mainnet',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            networkClientId: 'mainnet',
            url: 'https://mainnet.infura.io/v3/',
            type: 'infura',
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://etherscan.io'],
        defaultBlockExplorerUrlIndex: 0,
      },
    },
    selectedNetworkClientId: 'mainnet',
    networksMetadata: {
      mainnet: {
        status: 'available',
      },
    },
    keyrings: [
      {
        type: 'HD Key Tree',
        accounts: [address],
        metadata: {
          id: 'keyring1',
          name: 'HD Key Tree',
        },
      },
    ],
    accountTree: {
      wallets: {
        'wallet:1': {
          metadata: {
            name: 'Wallet 1',
          },
          groups: {
            'group:1': {
              metadata: {
                name: 'Group 1',
              },
              accounts: [account.id],
            },
          },
        },
      },
    },
    accountsByChainId: {
      '0x1': {
        [address]: {
          balance: '0x0',
        },
      },
    },
    pinnedAccounts: [],
    hiddenAccounts: [],
    permissionHistory: {},
  },
});

describe('AccountDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Account Type Detection', () => {
    it('should render EVM account details for EOA accounts', () => {
      mockUseParams.mockReturnValue({
        address: MOCK_ACCOUNT_EOA.address,
      });
      const state = createMockState(MOCK_ACCOUNT_EOA.address, MOCK_ACCOUNT_EOA);
      const store = mockStore(state);

      renderWithProvider(<MultichainAccountDetails />, store);

      // Should render the base account details (which includes account name in header and details)
      const accountNameElements = screen.getAllByText('Account 1');
      expect(accountNameElements).toHaveLength(2);
    });

    it('should render EVM account details for ERC-4337 accounts', () => {
      mockUseParams.mockReturnValue({
        address: MOCK_ACCOUNT_ERC4337.address,
      });
      const state = createMockState(
        MOCK_ACCOUNT_ERC4337.address,
        MOCK_ACCOUNT_ERC4337,
      );
      const store = mockStore(state);

      renderWithProvider(<MultichainAccountDetails />, store);

      // Should render the base account details (which includes account name in header and details)
      const accountNameElements = screen.getAllByText('Account 2');
      expect(accountNameElements).toHaveLength(2);
    });

    it('should render account details for Solana accounts', () => {
      mockUseParams.mockReturnValue({
        address: MOCK_ACCOUNT_SOLANA_MAINNET.address,
      });
      const state = createMockState(
        MOCK_ACCOUNT_SOLANA_MAINNET.address,
        MOCK_ACCOUNT_SOLANA_MAINNET,
      );
      const store = mockStore(state);

      renderWithProvider(<MultichainAccountDetails />, store);

      // Should render the base account details (which includes account name in header and details)
      const accountNameElements = screen.getAllByText('Solana Account');
      expect(accountNameElements).toHaveLength(2);
    });
  });
});
