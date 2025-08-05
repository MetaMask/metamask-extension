import React from 'react';
import { screen } from '@testing-library/react';
import {
  EntropySourceId,
  EthAccountType,
  EthScope,
} from '@metamask/keyring-api';
import {
  AccountWalletCategory,
  toAccountWalletId,
  toDefaultAccountGroupId,
  type AccountGroupId,
  type AccountWalletId,
} from '@metamask/account-api';
import { ETH_EOA_METHODS } from '../../../../shared/constants/eth-methods';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { ConsolidatedWallets } from '../../../selectors/multichain-accounts/account-tree.types';
import { MultichainAccountsTreeProps } from './multichain-accounts-tree';
import { MultichainAccountsTree } from '.';

const mockWalletOneEntropySource: EntropySourceId =
  '01JKAF3DSGM3AB87EM9N0K41AJ';
const mockWalletTwoEntropySource: EntropySourceId =
  '01JKAF3PJ247KAM6C03G5Q0NP8';

const walletOneId: AccountWalletId = toAccountWalletId(
  AccountWalletCategory.Entropy,
  mockWalletOneEntropySource,
);
const walletOneGroupId: AccountGroupId = toDefaultAccountGroupId(walletOneId);
const walletTwoId: AccountWalletId = toAccountWalletId(
  AccountWalletCategory.Entropy,
  mockWalletTwoEntropySource,
);
const walletTwoGroupId: AccountGroupId = toDefaultAccountGroupId(walletTwoId);

const createAccount = ({
  id,
  name,
  address,
  hidden = false,
  pinned = false,
  type = EthAccountType.Eoa,
}: {
  id: string;
  name: string;
  address: string;
  hidden?: boolean;
  pinned?: boolean;
  type?: EthAccountType;
}) => ({
  address,
  id,
  metadata: {
    name,
    keyring: { type: 'HD Key Tree' },
    importTime: 0,
  },
  options: {},
  methods: ETH_EOA_METHODS,
  scopes: [type === EthAccountType.Eoa ? EthScope.Eoa : EthScope.Testnet],
  type,
  balance: '0x0',
  pinned,
  hidden,
  lastSelected: 0,
  active: false,
  keyring: { type: 'HD Key Tree' },
  label: '',
});

const mockWallets: ConsolidatedWallets = {
  [walletOneId]: {
    id: walletOneId,
    metadata: {
      name: 'Wallet 1',
      type: AccountWalletCategory.Entropy as const,
      entropy: {
        id: mockWalletOneEntropySource,
        index: 0,
      },
    },
    groups: {
      [walletOneGroupId]: {
        id: walletOneGroupId,
        metadata: {
          name: 'Default',
        },
        accounts: [
          createAccount({
            id: 'account-1',
            name: 'Account 1',
            address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          }),
          createAccount({
            id: 'account-2',
            name: 'Account 2',
            address: '0x123456789abcdef0123456789abcdef012345678',
          }),
          createAccount({
            id: 'account-3',
            name: 'Account 3',
            address: '0x9339B1D5ed9b127479fD742bf7501CE2f5223C37',
            hidden: true,
          }),
        ],
      },
    },
  },
  [walletTwoId]: {
    id: walletTwoId,
    metadata: {
      name: 'Wallet 2',
      type: AccountWalletCategory.Entropy as const,
      entropy: {
        id: mockWalletTwoEntropySource,
        index: 1,
      },
    },
    groups: {
      [walletTwoGroupId]: {
        id: walletTwoGroupId,
        metadata: {
          name: 'Default',
        },
        accounts: [
          createAccount({
            id: 'account-3',
            name: 'Account 3',
            address: '0xabcdef0123456789abcdef0123456789abcdef01',
            type: EthAccountType.Erc4337,
          }),
          createAccount({
            id: 'account-4',
            name: 'Account 4',
            address: '0xC5b2b5ae370876c0122910F92a13bef85A133E56',
          }),
        ],
      },
    },
  },
};

const mockConnectedSites = {
  '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': [
    { origin: 'https://test.dapp', iconUrl: 'https://test.dapp/icon.png' },
  ],
};

const defaultProps: MultichainAccountsTreeProps = {
  wallets: mockWallets,
  allowedAccountTypes: [EthAccountType.Eoa, EthAccountType.Erc4337],
  connectedSites: mockConnectedSites,
  currentTabOrigin: 'https://test.dapp',
  privacyMode: false,
  selectedAccount:
    mockWallets[walletOneId].groups[walletOneGroupId].accounts[0],
  onClose: jest.fn(),
  onAccountTreeItemClick: jest.fn(),
};

const renderComponent = (props = {}) => {
  const store = configureStore(mockState);
  return renderWithProvider(
    <MultichainAccountsTree {...defaultProps} {...props} />,
    store,
  );
};

describe('MultichainAccountsTree', () => {
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
    expect(screen.getByText('Hidden accounts')).toBeInTheDocument();
  });

  it('does not render empty wallets', () => {
    const updatedMockWallets = {
      [walletOneId]: {
        ...mockWallets[walletOneId],
        groups: {
          [walletOneGroupId]: {
            ...mockWallets[walletOneId].groups[walletOneGroupId],
            accounts: [],
          },
        },
      },
      [walletTwoId]: {
        ...mockWallets[walletTwoId],
        groups: {
          [walletTwoGroupId]: {
            ...mockWallets[walletTwoId].groups[walletTwoGroupId],
            accounts: [],
          },
        },
      },
    };
    renderComponent({ wallets: updatedMockWallets });
    expect(screen.queryByText('Wallet 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Wallet 2')).not.toBeInTheDocument();
  });

  it('filters accounts by allowed types', () => {
    renderComponent({ allowedAccountTypes: [EthAccountType.Eoa] });
    expect(screen.getByText('Account 1')).toBeInTheDocument();
    expect(screen.getByText('Account 2')).toBeInTheDocument();
    expect(screen.queryByText('Account 3')).not.toBeInTheDocument();
  });

  it('filters accounts by search pattern based on name', () => {
    renderComponent({ searchPattern: 'Account 1' });
    expect(screen.getByText('Account 1')).toBeInTheDocument();
    expect(screen.queryByText('Account 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Account 3')).not.toBeInTheDocument();
  });

  it('filters accounts by search pattern based on address', () => {
    // Last 10 digits of the address for account 1
    renderComponent({ searchPattern: 'e70be3e7bc' });
    expect(screen.getByText('Account 1')).toBeInTheDocument();
    expect(screen.queryByText('Account 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Account 3')).not.toBeInTheDocument();
  });

  it('renders pinned accounts at the top of the list', () => {
    const updatedMockWallets = {
      ...mockWallets,
      [walletOneId]: {
        ...mockWallets[walletOneId],
        groups: {
          [walletOneGroupId]: {
            ...mockWallets[walletOneId].groups[walletOneGroupId],
            accounts: [
              createAccount({
                id: 'account-1',
                name: 'Account 1',
                address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
              }),
              createAccount({
                id: 'account-2',
                name: 'Account 2',
                address: '0x123456789abcdef0123456789abcdef012345678',
                pinned: true,
              }),
            ],
          },
        },
      },
    };
    renderComponent({ wallets: updatedMockWallets });
    const accountItems = screen.getAllByText(/Account \d/u);
    expect(accountItems[0]).toHaveTextContent('Account 2');
    expect(accountItems[1]).toHaveTextContent('Account 1');
  });

  it('renders hidden accounts correctly across multiple wallets', () => {
    const updatedMockWallets = {
      ...mockWallets,
      [walletOneId]: {
        ...mockWallets[walletOneId],
        groups: {
          [walletOneGroupId]: {
            ...mockWallets[walletOneId].groups[walletOneGroupId],
            accounts: [
              createAccount({
                id: 'account-1',
                name: 'Account 1',
                address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
                hidden: true,
              }),
              createAccount({
                id: 'account-2',
                name: 'Account 2',
                address: '0x123456789abcdef0123456789abcdef012345678',
                hidden: true,
              }),
            ],
          },
        },
      },
    };
    renderComponent({ wallets: updatedMockWallets });
    expect(screen.queryByText('Wallet 1')).not.toBeInTheDocument();
    expect(screen.getByText('Account 3')).toBeInTheDocument();
    expect(screen.getByText('Account 4')).toBeInTheDocument();
  });
});
