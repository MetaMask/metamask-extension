import React from 'react';
import { fireEvent, screen, within } from '@testing-library/react';

import configureStore from '../../../store/store';
import { useAccountsOperationsLoadingStates } from '../../../hooks/accounts/useAccountsOperationsLoadingStates';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { CHOOSE_NEW_WALLET_TYPE_PAGE_ROUTE } from '../../../helpers/constants/routes';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsManageAccountsSource,
} from '../../../../shared/constants/metametrics';
import { AccountList } from './account-list';

const mockTrackEvent = jest.fn();
jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

const mockUseNavigate = jest.fn();
let mockLocationKey = 'default';
let mockLocationState: Record<string, unknown> | null = null;
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
    useLocation: () => ({
      key: mockLocationKey,
      pathname: '/',
      search: '',
      hash: '',
      state: mockLocationState,
    }),
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
const addWalletButtonTestId = 'account-list-add-wallet-button';
const manageButtonTestId = 'account-list-page-manage-button';
const backButtonTestId = 'account-list-page-back-button';

describe('AccountList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocationKey = 'default';
    mockLocationState = null;
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

    expect(screen.getByText(messages.accounts.message)).toBeInTheDocument();
    expect(screen.getByLabelText(messages.back.message)).toBeInTheDocument();

    const walletHeaders = screen.getAllByTestId(walletHeaderTestId);

    expect(walletHeaders.length).toBe(5);
    expect(screen.getByText('Wallet 1')).toBeInTheDocument();
    expect(screen.getByText('Wallet 2')).toBeInTheDocument();
    expect(screen.getByText('Account 1')).toBeInTheDocument();
    expect(screen.getByText('Account 2')).toBeInTheDocument();
  });

  it('navigates back when arrived via in-app navigation', () => {
    mockLocationKey = 'abc123';

    renderComponent();

    const backButton = screen.getByLabelText(messages.back.message);
    fireEvent.click(backButton);

    expect(mockUseNavigate).toHaveBeenCalledWith(-1);
  });

  it('navigates to home when location.key is default', () => {
    renderComponent();

    const backButton = screen.getByLabelText(messages.back.message);
    fireEvent.click(backButton);

    expect(mockUseNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('navigates to home when arrived from fresh tab via state', () => {
    mockLocationKey = 'abc123';
    mockLocationState = { fromFreshTab: true };

    renderComponent();

    const backButton = screen.getByLabelText(messages.back.message);
    fireEvent.click(backButton);

    expect(mockUseNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('navigates to choose wallet type page when add wallet button is clicked', () => {
    renderComponent();

    const addWalletButton = screen.getByRole('button', {
      name: messages.addWallet.message,
    });
    expect(addWalletButton).toBeInTheDocument();

    fireEvent.click(addWalletButton);

    expect(mockUseNavigate).toHaveBeenCalledWith(
      CHOOSE_NEW_WALLET_TYPE_PAGE_ROUTE,
    );
  });

  it('displays the search field with correct placeholder', () => {
    renderComponent();

    const searchContainer = screen.getByTestId(searchContainerTestId);

    expect(searchContainer).toBeInTheDocument();

    const searchInput = within(searchContainer).getByPlaceholderText(
      messages.searchYourAccounts.message,
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
      screen.getByText(messages.noAccountsFound.message),
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
        loadingMessage: messages.syncing.message,
      });

      renderComponent();

      const addWalletButton = screen.getByTestId(addWalletButtonTestId);
      expect(addWalletButton).toBeDisabled();
      expect(
        within(addWalletButton).getByText(messages.syncing.message),
      ).toBeInTheDocument();
    });

    it('prioritizes syncing message over local loading', () => {
      mockUseAccountsOperationsLoadingStates.mockReturnValue({
        isAccountTreeSyncingInProgress: true,
        areAnyOperationsLoading: true,
        loadingMessage: messages.syncing.message,
      });

      renderComponent();

      fireEvent.click(screen.getByTestId(addWalletButtonTestId));

      const addWalletButton = screen.getByTestId(addWalletButtonTestId);
      expect(
        within(addWalletButton).getByText(messages.syncing.message),
      ).toBeInTheDocument();
    });

    it('shows spinner when any loading state is active', () => {
      mockUseAccountsOperationsLoadingStates.mockReturnValue({
        isAccountTreeSyncingInProgress: true,
        areAnyOperationsLoading: true,
        loadingMessage: messages.syncing.message,
      });

      renderComponent();

      const addWalletButton = screen.getByTestId(addWalletButtonTestId);
      expect(addWalletButton).toBeDisabled();
      expect(
        within(addWalletButton).getByText(messages.syncing.message),
      ).toBeInTheDocument();
      expect(
        addWalletButton.querySelector(
          '.add-multichain-account__icon-box__icon-loading',
        ),
      ).toBeInTheDocument();
    });

    it('shows default add wallet text when no loading states are active', () => {
      mockUseAccountsOperationsLoadingStates.mockReturnValue({
        isAccountTreeSyncingInProgress: false,
        areAnyOperationsLoading: false,
        loadingMessage: '',
      });
      renderComponent();

      const addWalletButton = screen.getByTestId(addWalletButtonTestId);
      expect(addWalletButton).not.toBeDisabled();
      expect(
        within(addWalletButton).getByText(messages.addWallet.message),
      ).toBeInTheDocument();
    });

    it('handles loading state transitions correctly', () => {
      // Start with no loading
      mockUseAccountsOperationsLoadingStates.mockReturnValue({
        isAccountTreeSyncingInProgress: false,
        areAnyOperationsLoading: false,
        loadingMessage: undefined,
      });

      const { rerender } = renderComponent();

      let addWalletButton = screen.getByTestId(addWalletButtonTestId);
      expect(addWalletButton).not.toBeDisabled();
      expect(
        within(addWalletButton).getByText(messages.addWallet.message),
      ).toBeInTheDocument();

      // Simulate account syncing starting
      mockUseAccountsOperationsLoadingStates.mockReturnValue({
        isAccountTreeSyncingInProgress: true,
        areAnyOperationsLoading: true,
        loadingMessage: messages.syncing.message,
      });

      rerender(<AccountList />);

      addWalletButton = screen.getByTestId(addWalletButtonTestId);
      expect(addWalletButton).toBeDisabled();
      expect(
        within(addWalletButton).getByText(messages.syncing.message),
      ).toBeInTheDocument();

      // Simulate syncing completing
      mockUseAccountsOperationsLoadingStates.mockReturnValue({
        isAccountTreeSyncingInProgress: false,
        areAnyOperationsLoading: false,
        loadingMessage: undefined,
      });

      rerender(<AccountList />);

      addWalletButton = screen.getByTestId(addWalletButtonTestId);
      expect(addWalletButton).not.toBeDisabled();
      expect(
        within(addWalletButton).getByText(messages.addWallet.message),
      ).toBeInTheDocument();
    });
  });

  describe('Manage accounts mode', () => {
    it('starts outside manage mode', () => {
      renderComponent();

      expect(screen.getByText(messages.accounts.message)).toBeInTheDocument();
      expect(
        screen.queryByText(messages.manageAccounts.message),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId(manageButtonTestId)).toBeInTheDocument();
      expect(
        screen.queryByTestId('multichain-account-cell-edit-mode-visible-icon'),
      ).not.toBeInTheDocument();
    });

    it('swaps the title, puts the list in edit mode and hides the manage button when entered', () => {
      renderComponent();

      fireEvent.click(screen.getByTestId(manageButtonTestId));

      expect(
        screen.getByText(messages.manageAccounts.message),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(messages.accounts.message),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId(manageButtonTestId)).not.toBeInTheDocument();
      expect(
        screen.getAllByTestId('multichain-account-cell-edit-mode-visible-icon'),
      ).not.toHaveLength(0);
    });

    it('leaves manage mode instead of navigating when back is clicked', () => {
      renderComponent();

      fireEvent.click(screen.getByTestId(manageButtonTestId));
      fireEvent.click(screen.getByTestId(backButtonTestId));

      expect(screen.getByText(messages.accounts.message)).toBeInTheDocument();
      expect(
        screen.queryByText(messages.manageAccounts.message),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId(manageButtonTestId)).toBeInTheDocument();
      expect(
        screen.queryByTestId('multichain-account-cell-edit-mode-visible-icon'),
      ).not.toBeInTheDocument();
      expect(mockUseNavigate).not.toHaveBeenCalled();
    });

    it('navigates back once manage mode has been left', () => {
      renderComponent();

      fireEvent.click(screen.getByTestId(manageButtonTestId));
      fireEvent.click(screen.getByTestId(backButtonTestId));
      fireEvent.click(screen.getByTestId(backButtonTestId));

      expect(mockUseNavigate).toHaveBeenCalled();
    });

    it('tracks Manage Accounts Viewed when entered', () => {
      renderComponent();

      fireEvent.click(screen.getByTestId(manageButtonTestId));

      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: MetaMetricsEventName.ManageAccountsViewed,
        properties: {
          category: MetaMetricsEventCategory.Accounts,
          source: MetaMetricsManageAccountsSource.AccountList,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          total_accounts: 5,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          total_wallets: 5,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hidden_count: 0,
        },
        sensitiveProperties: {},
      });
    });

    it('reports one account per rendered cell', () => {
      // Each account group is one cell and one account, whatever wallet backs
      // it — BIP-44, hardware or imported private key alike. The reported
      // total has to match the cells the manage view lists, not the number of
      // addresses underneath them.
      const wallets = Object.values(mockState.metamask.accountTree.wallets) as {
        groups: Record<string, unknown>;
      }[];
      const groupIds = wallets.flatMap((wallet) => Object.keys(wallet.groups));

      renderComponent();
      fireEvent.click(screen.getByTestId(manageButtonTestId));

      const renderedCells = groupIds.filter((groupId) =>
        screen.queryByTestId(`multichain-account-cell-${groupId}`),
      );

      expect(renderedCells).toHaveLength(groupIds.length);
      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: MetaMetricsEventName.ManageAccountsViewed,
          properties: expect.objectContaining({
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            total_accounts: renderedCells.length,
          }),
        }),
      );
    });

    it('tracks the view only once per entry into manage mode', () => {
      renderComponent();

      fireEvent.click(screen.getByTestId(manageButtonTestId));

      expect(
        mockTrackEvent.mock.calls.filter(
          ([event]) => event.name === MetaMetricsEventName.ManageAccountsViewed,
        ),
      ).toHaveLength(1);
    });

    it('reports counts for the whole tree even when the list is filtered by a search', () => {
      // The gear opens a management view over every account, so the counts must
      // describe the whole wallet rather than whatever the search left on screen.
      renderComponent();

      fireEvent.change(
        within(screen.getByTestId(searchContainerTestId)).getByRole(
          'searchbox',
        ),
        { target: { value: 'Account 1' } },
      );
      fireEvent.click(screen.getByTestId(manageButtonTestId));

      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: MetaMetricsEventName.ManageAccountsViewed,
          properties: expect.objectContaining({
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            total_accounts: 5,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            total_wallets: 5,
          }),
        }),
      );
    });
  });
});
