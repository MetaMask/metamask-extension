import React from 'react';
import { screen } from '@testing-library/react';
import { EthAccountType, EthScope } from '@metamask/keyring-api';
import type {
  AccountGroupId,
  AccountWalletId,
} from '@metamask/account-tree-controller';
import { ETH_EOA_METHODS } from '../../../../shared/constants/eth-methods';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { ConsolidatedWallets } from '../../../selectors/multichain-accounts/account-tree.types';
import { MultichainAccountsTreeProps } from './multichain-accounts-tree';
import { MultichainAccountsTree } from '.';

const walletOneId: AccountWalletId = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ';
const walletOneGroupId: AccountGroupId =
  'entropy:01JKAF3DSGM3AB87EM9N0K41AJ:default';
const walletTwoId: AccountWalletId = 'entropy:01JKAF3PJ247KAM6C03G5Q0NP8';
const walletTwoGroupId: AccountGroupId =
  'entropy:01JKAF3PJ247KAM6C03G5Q0NP8:default';

const mockWallets: ConsolidatedWallets = {
  [walletOneId]: {
    id: walletOneId,
    metadata: {
      name: 'Wallet 1',
    },
    groups: {
      [walletOneGroupId]: {
        id: walletOneGroupId,
        metadata: {
          name: 'Default',
        },
        accounts: [
          {
            address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            id: 'account-1',
            metadata: {
              name: 'Account 1',
              keyring: {
                type: 'HD Key Tree',
              },
              importTime: 0,
            },
            options: {},
            methods: ETH_EOA_METHODS,
            scopes: [EthScope.Eoa],
            type: EthAccountType.Eoa,
            balance: '0x0',
            pinned: false,
            hidden: false,
            lastSelected: 0,
            active: false,
            keyring: {
              type: 'HD Key Tree',
            },
            label: '',
          },
          {
            address: '0x123456789abcdef0123456789abcdef012345678',
            id: 'account-2',
            metadata: {
              name: 'Account 2',
              keyring: {
                type: 'HD Key Tree',
              },
              importTime: 0,
            },
            options: {},
            methods: ETH_EOA_METHODS,
            scopes: [EthScope.Eoa],
            type: EthAccountType.Eoa,
            balance: '0x0',
            pinned: false,
            hidden: false,
            lastSelected: 0,
            active: false,
            keyring: {
              type: 'HD Key Tree',
            },
            label: '',
          },
        ],
      },
    },
  },
  [walletTwoId]: {
    id: walletTwoId,
    metadata: {
      name: 'Wallet 2',
    },
    groups: {
      [walletTwoGroupId]: {
        id: walletTwoGroupId,
        metadata: {
          name: 'Default',
        },
        accounts: [
          {
            address: '0xabcdef0123456789abcdef0123456789abcdef01',
            id: 'account-3',
            metadata: {
              name: 'Account 3',
              keyring: {
                type: 'HD Key Tree',
              },
              importTime: 0,
            },
            options: {},
            methods: ETH_EOA_METHODS,
            scopes: [EthScope.Eoa],
            type: EthAccountType.Erc4337,
            balance: '0x0',
            pinned: false,
            hidden: false,
            lastSelected: 0,
            active: false,
            keyring: {
              type: 'HD Key Tree',
            },
            label: '',
          },
        ],
      },
    },
  },
} as const;

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
    wallets: mockWallets,
    allowedAccountTypes: [EthAccountType.Eoa, EthAccountType.Erc4337],
    connectedSites: mockConnectedSites,
    currentTabOrigin: 'https://test.dapp',
    privacyMode: false,
    selectedAccount:
      mockWallets[walletOneId].groups[walletOneGroupId].accounts[0],
    onClose: mockOnClose,
    onAccountTreeItemClick: mockOnAccountListItemItemClicked,
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
