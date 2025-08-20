import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
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

  const renderComponent = (selectedAccount = MOCK_ACCOUNT_EOA) => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
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
        name: 'Test Account',
      },
    };

    renderComponent(mockAccount);

    // Check header shows account name
    expect(screen.getByText('Test Account / Addresses')).toBeInTheDocument();

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

  it('shows fallback text when no account name is available', () => {
    const mockAccount = {
      ...MOCK_ACCOUNT_EOA,
      metadata: {
        ...MOCK_ACCOUNT_EOA.metadata,
        name: '',
      },
    };

    renderComponent(mockAccount);

    expect(screen.getByText('Account / Addresses')).toBeInTheDocument();
  });

  it('handles empty state when no account is selected', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        internalAccounts: {
          ...mockState.metamask.internalAccounts,
          selectedAccount: null,
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
