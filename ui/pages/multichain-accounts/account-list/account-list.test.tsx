import React from 'react';
import { fireEvent, screen, within } from '@testing-library/react';

import configureStore from '../../../store/store';
import { useAccountsOperationsLoadingStates } from '../../../hooks/accounts/useAccountsOperationsLoadingStates';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import { AccountList } from './account-list';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

jest.mock('../../../hooks/accounts/useAccountsOperationsLoadingStates', () => ({
  useAccountsOperationsLoadingStates: jest.fn(),
}));
const mockUseAccountsOperationsLoadingStates =
  useAccountsOperationsLoadingStates as jest.MockedFunction<
    typeof useAccountsOperationsLoadingStates
  >;

mockUseAccountsOperationsLoadingStates.mockReturnValue({
  isAccountTreeSyncingInProgress: false,
  areAnyOperationsLoading: false,
  loadingMessage: undefined,
});

const searchContainerTestId = 'multichain-account-list-search';
const searchClearButtonTestId = 'text-field-search-clear-button';
const walletHeaderTestId = 'multichain-account-tree-wallet-header';

describe('AccountList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    const store = configureStore({
      activeTab: { origin: 'https://example.com' },
      metamask: {
        ...mockState.metamask,
      },
    });

    return renderWithProvider(<AccountList />, store);
  };

  it('renders the page with correct components and elements', () => {
    renderComponent();

    expect(screen.getByText('Accounts')).toBeInTheDocument();
    expect(screen.getByLabelText('Back')).toBeInTheDocument();

    const walletHeaders = screen.getAllByTestId(walletHeaderTestId);

    expect(walletHeaders.length).toBe(5);
    expect(screen.getByText('Wallet 1')).toBeInTheDocument();
    expect(screen.getByText('Wallet 2')).toBeInTheDocument();
    expect(screen.getByText('Account 1')).toBeInTheDocument();
    expect(screen.getByText('Account 2')).toBeInTheDocument();
  });

  it('calls navigate when back button is clicked', () => {
    renderComponent();

    const backButton = screen.getByLabelText('Back');
    fireEvent.click(backButton);

    expect(mockUseNavigate).toHaveBeenCalledWith(-1);
  });

  it('opens the add wallet modal when the add wallet button is clicked', () => {
    renderComponent();

    // First, let's verify the button is rendered by looking for it with role
    const addWalletButton = screen.getByRole('button', { name: 'Add wallet' });
    expect(addWalletButton).toBeInTheDocument();

    fireEvent.click(addWalletButton);

    // The modal renders with portal, so we need to look for modal content
    expect(screen.getByText('Import a wallet')).toBeInTheDocument();
    expect(screen.getByText('Import an account')).toBeInTheDocument();
    expect(screen.getByText('Add a hardware wallet')).toBeInTheDocument();
  });

  it('displays the search field with correct placeholder', () => {
    renderComponent();

    const searchContainer = screen.getByTestId(searchContainerTestId);

    expect(searchContainer).toBeInTheDocument();

    const searchInput = within(searchContainer).getByPlaceholderText(
      'Search your accounts',
    );

    expect(searchInput).toBeInTheDocument();
  });

  it('updates search value when typing in the search field', () => {
    renderComponent();

    const searchContainer = screen.getByTestId(searchContainerTestId);
    const searchInput = within(searchContainer).getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'Account 2' } });

    // @ts-expect-error Values does exist on the search input
    expect(searchInput?.value).toBe('Account 2');
  });

  it('filters accounts when search text is entered', () => {
    renderComponent();

    // Verify all accounts are shown initially
    const walletHeaders = screen.getAllByTestId(walletHeaderTestId);
    expect(walletHeaders.length).toBe(5);
    expect(screen.getByText('Account 1')).toBeInTheDocument();
    expect(screen.getByText('Account 2')).toBeInTheDocument();

    const searchContainer = screen.getByTestId(searchContainerTestId);
    const searchInput = within(searchContainer).getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'Account 2' } });

    expect(screen.queryByText('Account 1')).not.toBeInTheDocument();
    expect(screen.getByText('Account 2')).toBeInTheDocument();
  });

  it('shows "No accounts found" message when no accounts match search criteria', () => {
    renderComponent();

    const searchContainer = screen.getByTestId(searchContainerTestId);
    const searchInput = within(searchContainer).getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'nonexistent account' } });

    expect(
      screen.getByText('No accounts found for the given search query'),
    ).toBeInTheDocument();
  });

  it('clears search when clear button is clicked', () => {
    renderComponent();

    const searchContainer = screen.getByTestId(searchContainerTestId);
    const searchInput = within(searchContainer).getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'Account 2' } });

    const clearButton = screen.getByTestId(searchClearButtonTestId);
    fireEvent.click(clearButton);

    // @ts-expect-error Value does exist on search input
    expect(searchInput?.value).toBe('');
    expect(screen.getByText('Account 1')).toBeInTheDocument();
    expect(screen.getByText('Account 2')).toBeInTheDocument();
  });

  it('performs case-insensitive search', () => {
    renderComponent();

    const searchContainer = screen.getByTestId(searchContainerTestId);
    const searchInput = within(searchContainer).getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'account 2' } });

    expect(screen.queryByText('Account 1')).not.toBeInTheDocument();
    expect(screen.getByText('Account 2')).toBeInTheDocument();
  });

  describe('Loading States Integration', () => {
    it('shows syncing message when account syncing is in progress', () => {
      mockUseAccountsOperationsLoadingStates.mockReturnValue({
        isAccountTreeSyncingInProgress: true,
        areAnyOperationsLoading: true,
        loadingMessage: 'Syncing...',
      });

      const { getAllByText } = renderComponent();

      expect(getAllByText('Syncing...')[0]).toBeInTheDocument();
    });

    it('prioritizes syncing message over local loading', async () => {
      mockUseAccountsOperationsLoadingStates.mockReturnValue({
        isAccountTreeSyncingInProgress: true,
        areAnyOperationsLoading: true,
        loadingMessage: 'Syncing...',
      });

      const { getAllByText } = renderComponent();

      fireEvent.click(getAllByText('Syncing...')[0]);

      // Should still show syncing message, not creating account message
      expect(getAllByText('Syncing...')[0]).toBeInTheDocument();
    });

    it('shows spinner when any loading state is active', async () => {
      mockUseAccountsOperationsLoadingStates.mockReturnValue({
        isAccountTreeSyncingInProgress: true,
        areAnyOperationsLoading: true,
        loadingMessage: 'Syncing...',
      });

      const { getAllByText } = renderComponent();

      // When account syncing is in progress, should show spinner
      expect(getAllByText('Syncing...').length).toBeGreaterThanOrEqual(1);
    });

    it('shows default add wallet text when no loading states are active', () => {
      mockUseAccountsOperationsLoadingStates.mockReturnValue({
        isAccountTreeSyncingInProgress: false,
        areAnyOperationsLoading: false,
        loadingMessage: '',
      });
      const { getAllByText } = renderComponent();

      expect(getAllByText('Add wallet').length).toBeGreaterThanOrEqual(1);
    });

    it('handles loading state transitions correctly', () => {
      // Start with no loading
      mockUseAccountsOperationsLoadingStates.mockReturnValue({
        isAccountTreeSyncingInProgress: false,
        areAnyOperationsLoading: false,
        loadingMessage: undefined,
      });

      const { getAllByText, rerender } = renderComponent();

      expect(getAllByText('Add wallet').length).toBeGreaterThanOrEqual(1);

      // Simulate account syncing starting
      mockUseAccountsOperationsLoadingStates.mockReturnValue({
        isAccountTreeSyncingInProgress: true,
        areAnyOperationsLoading: true,
        loadingMessage: 'Syncing...',
      });

      rerender(<AccountList />);

      expect(getAllByText('Syncing...').length).toBeGreaterThanOrEqual(1);

      // Simulate syncing completing
      mockUseAccountsOperationsLoadingStates.mockReturnValue({
        isAccountTreeSyncingInProgress: false,
        areAnyOperationsLoading: false,
        loadingMessage: undefined,
      });

      rerender(<AccountList />);

      expect(getAllByText('Add wallet').length).toBeGreaterThanOrEqual(1);
    });
  });
});
