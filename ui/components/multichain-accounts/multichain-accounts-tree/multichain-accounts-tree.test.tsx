import React from 'react';
import { screen } from '@testing-library/react';
import { EthAccountType, EthScope } from '@metamask/keyring-api';
import { ETH_EOA_METHODS } from '../../../../shared/constants/eth-methods';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { MultichainAccountsTreeProps } from './multichain-accounts-tree';
import { MultichainAccountsTree } from '.';

const mockWalletAccountCollection = {
  'wallet-1': {
    metadata: {
      name: 'Wallet 1',
    },
    groups: {
      'group-1': {
        accounts: [
          {
            address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            id: 'account-1',
            metadata: {
              name: 'Account 1',
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: ETH_EOA_METHODS,
            scopes: [EthScope.Eoa],
            type: EthAccountType.Eoa,
            balance: '0x0',
          },
          {
            address: '0x123456789abcdef0123456789abcdef012345678',
            id: 'account-2',
            metadata: {
              name: 'Account 2',
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: ETH_EOA_METHODS,
            scopes: [EthScope.Eoa],
            type: EthAccountType.Eoa,
            balance: '0x0',
          },
        ],
      },
    },
  },
  'wallet-2': {
    metadata: {
      name: 'Wallet 2',
    },
    groups: {
      'group-2': {
        accounts: [
          {
            address: '0xabcdef0123456789abcdef0123456789abcdef01',
            id: 'account-3',
            metadata: {
              name: 'Account 3',
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: ETH_EOA_METHODS,
            scopes: [EthScope.Eoa],
            type: EthAccountType.Erc4337,
            balance: '0x0',
          },
        ],
      },
    },
  },
};

const mockConnectedSites = {
  '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': [
    {
      origin: 'https://test.dapp',
      iconUrl: 'https://test.dapp/icon.png',
    },
  ],
};

describe('MultichainAccountsTree', () => {
  const mockOnClose = jest.fn();
  const mockOnAccountListItemItemClicked = jest.fn();

  const defaultProps: MultichainAccountsTreeProps = {
    walletAccountCollection: mockWalletAccountCollection,
    allowedAccountTypes: [EthAccountType.Eoa, EthAccountType.Erc4337],
    connectedSites: mockConnectedSites,
    currentTabOrigin: 'https://test.dapp',
    privacyMode: false,
    selectedAccount: {
      address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      type: 'eip155:eoa',
      id: '',
      options: {
        entropySource: 'entropy-source',
        derivationPath: "m/44'/60'/0'/0/0",
      },
      metadata: {
        name: '',
        importTime: 0,
        keyring: {
          type: '',
        },
        nameLastUpdatedAt: undefined,
        snap: undefined,
        lastSelected: 1749132453300,
      },
      scopes: [],
      methods: [],
    },
    onClose: mockOnClose,
    onAccountListItemItemClicked: mockOnAccountListItemItemClicked,
  };

  const renderComponent = (props = {}) => {
    const store = configureStore(mockState);

    return renderWithProvider(
      <MultichainAccountsTree {...defaultProps} {...props} />,
      store,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders wallet and account items correctly', () => {
    renderComponent();

    expect(screen.getByText('Wallet 1')).toBeInTheDocument();
    expect(screen.getByText('Wallet 2')).toBeInTheDocument();

    expect(screen.getByText('Account 1')).toBeInTheDocument();
    expect(screen.getByText('Account 2')).toBeInTheDocument();
    expect(screen.getByText('Account 3')).toBeInTheDocument();
  });

  it('filters accounts by allowed types', () => {
    // Only show EOA accounts
    renderComponent({
      allowedAccountTypes: [EthAccountType.Eoa],
    });

    // Account 1 and 2 are EOA and should be visible
    expect(screen.getByText('Account 1')).toBeInTheDocument();
    expect(screen.getByText('Account 2')).toBeInTheDocument();

    // Account 3 is ERC4337 and should not be visible
    expect(screen.queryByText('Account 3')).not.toBeInTheDocument();
  });
});
