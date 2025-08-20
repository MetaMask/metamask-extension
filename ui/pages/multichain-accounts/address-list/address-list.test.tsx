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
import { AddressList } from './address-list';

const mockHistoryGoBack = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    goBack: mockHistoryGoBack,
  }),
}));

describe('AddressList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (
    selectedAccount = MOCK_ACCOUNT_EOA,
    groupName = 'Test Account',
  ) => {
    const groupId = 'test-group-id' as AccountGroupId;

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
      },
      localeMessages: {
        currentLocale: 'en',
        current: {
          back: 'Back',
          account: 'Account',
          addresses: 'Addresses',
        },
      },
    });

    return renderWithProvider(<AddressList />, store);
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
      },
      localeMessages: {
        currentLocale: 'en',
        current: {
          back: 'Back',
          account: 'Account',
          addresses: 'Addresses',
        },
      },
    });

    renderWithProvider(<AddressList />, store);

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
});
