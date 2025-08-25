import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import {
  AccountGroupId,
  AccountGroupType,
  AccountWalletType,
} from '@metamask/account-api';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { MOCK_ACCOUNT_EOA } from '../../../../test/data/mock-accounts';
import { MultichainAccountAddressListPage } from './multichain-account-address-list-page';

const mockHistoryGoBack = jest.fn();
const mockUseParams = jest.fn();
const mockUseLocation = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    goBack: mockHistoryGoBack,
  }),
  useParams: () => mockUseParams(),
  useLocation: () => mockUseLocation(),
}));

describe('MultichainAccountAddressListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue({ search: '' });
  });

  const renderComponent = (
    selectedAccount = MOCK_ACCOUNT_EOA,
    groupName = 'Test Account',
    accountGroupId?: string,
  ) => {
    const groupId = 'test-wallet/0' as AccountGroupId;
    
    // Mock URL parameters - pass the raw group ID (component will decode it)
    mockUseParams.mockReturnValue({
      accountGroupId: accountGroupId || groupId,
    });

    const store = configureStore({
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
                  accounts: [selectedAccount.id],
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
          accounts: {
            [selectedAccount.id]: selectedAccount,
          },
          selectedAccount: selectedAccount.id,
        },
        multichainNetworkConfigurationsByChainId: {
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
            chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
            name: 'Solana Mainnet',
            nativeCurrency:
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
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
      localeMessages: {
        currentLocale: 'en',
        current: {
          back: 'Back',
          account: 'Account',
          addresses: 'Addresses',
          receivingAddress: 'Receiving address',
        },
      },
    });

    return renderWithProvider(<MultichainAccountAddressListPage />, store);
  };

  it('renders the page with correct components', () => {
    const mockAccount = {
      ...MOCK_ACCOUNT_EOA,
      metadata: {
        ...MOCK_ACCOUNT_EOA.metadata,
        name: 'Individual Account',
      },
    };

    renderComponent(mockAccount, 'Test Multichain Account');

    // Check header shows group name (not individual account name)
    expect(
      screen.getByText('Test Multichain Account / Addresses'),
    ).toBeInTheDocument();

    // Check back button is present
    expect(screen.getByLabelText('Back')).toBeInTheDocument();

    // Check address list component is rendered
    expect(
      screen.getByTestId('multichain-address-rows-list'),
    ).toBeInTheDocument();

    // Verify search field is rendered
    expect(
      screen.getByTestId('multichain-address-rows-list-search'),
    ).toBeInTheDocument();
  });

  it('shows fallback text when no group name is available', () => {
    const mockAccount = {
      ...MOCK_ACCOUNT_EOA,
      metadata: {
        ...MOCK_ACCOUNT_EOA.metadata,
        name: 'Individual Account Name',
      },
    };

    renderComponent(mockAccount, ''); // Empty group name

    expect(screen.getByText('Account / Addresses')).toBeInTheDocument();
  });

  it('handles empty state when no account group is selected', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        accountTree: {
          wallets: {},
          selectedAccountGroup: null as unknown as AccountGroupId,
        },
        internalAccounts: {
          ...mockState.metamask.internalAccounts,
          accounts: {},
          selectedAccount: '',
        },
        multichainNetworkConfigurationsByChainId: {
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
            chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
            name: 'Solana Mainnet',
            nativeCurrency:
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
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
      localeMessages: {
        currentLocale: 'en',
        current: {
          back: 'Back',
          account: 'Account',
          addresses: 'Addresses',
          receivingAddress: 'Receiving address',
        },
      },
    });

    renderWithProvider(<MultichainAccountAddressListPage />, store);

    // Should show fallback header
    expect(screen.getByText('Account / Addresses')).toBeInTheDocument();

    // MultichainAddressRowsList should show empty state
    const addressList = screen.getByTestId('multichain-address-rows-list');
    expect(addressList).toBeInTheDocument();

    // Should show search field even in empty state
    expect(
      screen.getByTestId('multichain-address-rows-list-search'),
    ).toBeInTheDocument();
  });

  it('calls history.goBack when back button is clicked', () => {
    renderComponent();

    const backButton = screen.getByLabelText('Back');
    fireEvent.click(backButton);

    expect(mockHistoryGoBack).toHaveBeenCalledTimes(1);
  });

  it('shows receiving address title in receive mode', () => {
    mockUseLocation.mockReturnValue({ search: '?source=receive' });
    
    const mockAccount = {
      ...MOCK_ACCOUNT_EOA,
      metadata: {
        ...MOCK_ACCOUNT_EOA.metadata,
        name: 'Individual Account',
      },
    };

    renderComponent(mockAccount, 'Test Multichain Account');

    expect(screen.getByText('Receiving address')).toBeInTheDocument();
  });

  it('shows empty networks state', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        accountTree: {
          wallets: {},
        },
        internalAccounts: {
          ...mockState.metamask.internalAccounts,
          accounts: {},
          selectedAccount: '',
        },
        multichainNetworkConfigurationsByChainId: {}, // Empty networks
      },
      localeMessages: {
        currentLocale: 'en',
        current: {
          back: 'Back',
          account: 'Account',
          addresses: 'Addresses',
          receivingAddress: 'Receiving address',
        },
      },
    });

    // Mock no account group ID in URL params
    mockUseParams.mockReturnValue({ accountGroupId: undefined });

    renderWithProvider(<MultichainAccountAddressListPage />, store);

    // Should show fallback header
    expect(screen.getByText('Account / Addresses')).toBeInTheDocument();

    // MultichainAddressRowsList should render with empty networks
    const addressList = screen.getByTestId('multichain-address-rows-list');
    expect(addressList).toBeInTheDocument();
  });
});
