import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';

import configureStore, { MetaMaskReduxDispatch } from '../../../store/store';
import { createNextMultichainAccountGroup } from '../../../store/actions';
import { useAccountsWalletOperationsLoadingStates } from '../../../hooks/accounts/useAccountsWalletOperationsLoadingStates';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { AddMultichainAccount } from './add-multichain-account';

const addMultichainAccountButtonTestId = 'add-multichain-account-button';
const addMultichainAccountIconClass = '.add-multichain-account__icon-box__icon';
const addMultichainAccountIconLoadingClass =
  '.add-multichain-account__icon-box__icon-loading';
const addMultichainAccountIconBoxClass = '.add-multichain-account__icon-box';

jest.mock('../../../store/actions', () => ({
  createNextMultichainAccountGroup: jest.fn(
    () => (dispatch: MetaMaskReduxDispatch) => {
      return dispatch({ type: 'MOCKED_ACTION' });
    },
  ),
}));

jest.mock(
  '../../../hooks/accounts/useAccountsWalletOperationsLoadingStates',
  () => ({
    useAccountsWalletOperationsLoadingStates: jest.fn(),
  }),
);
const mockUseAccountsWalletOperationsLoadingStates =
  useAccountsWalletOperationsLoadingStates as jest.MockedFunction<
    typeof useAccountsWalletOperationsLoadingStates
  >;

describe('AddMultichainAccount', () => {
  const mockWalletId = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ';

  const initialState = {
    metamask: {
      localeMessages: {
        current: {
          createMultichainAccountButton: 'Add account',
          createMultichainAccountButtonLoading: 'Adding account...',
        },
        currentLocale: 'en',
      },
    },
  };

  mockUseAccountsWalletOperationsLoadingStates.mockReturnValue({
    areAnyOperationsLoading: false,
    loadingMessage: undefined,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with initial state', () => {
    const store = configureStore(initialState);
    const { container } = renderWithProvider(
      <AddMultichainAccount walletId={mockWalletId} />,
      store,
    );

    expect(
      screen.getByTestId(addMultichainAccountButtonTestId),
    ).toBeInTheDocument();
    expect(screen.getByText('Add account')).toBeInTheDocument();
    expect(
      container.querySelector(addMultichainAccountIconClass),
    ).toBeInTheDocument();
    expect(
      container.querySelector(addMultichainAccountIconLoadingClass),
    ).not.toBeInTheDocument();
  });

  it('dispatches createMultichainAccount action when clicked', () => {
    const store = configureStore(initialState);
    renderWithProvider(<AddMultichainAccount walletId={mockWalletId} />, store);

    fireEvent.click(screen.getByTestId(addMultichainAccountButtonTestId));

    expect(createNextMultichainAccountGroup).toHaveBeenCalledWith(mockWalletId);
  });

  it('shows loading state when clicked', () => {
    const store = configureStore(initialState);
    const { container } = renderWithProvider(
      <AddMultichainAccount walletId={mockWalletId} />,
      store,
    );

    fireEvent.click(screen.getByTestId(addMultichainAccountButtonTestId));

    expect(screen.getByText('Adding account...')).toBeInTheDocument();
    expect(
      container.querySelector(addMultichainAccountIconClass),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector(addMultichainAccountIconLoadingClass),
    ).toBeInTheDocument();

    // Check cursor style
    const button = screen.getByTestId(addMultichainAccountButtonTestId);
    expect(button).toHaveStyle('cursor: not-allowed');

    // Check background color of icon box
    const iconBox = container.querySelector(addMultichainAccountIconBoxClass);
    expect(iconBox).toHaveClass('mm-box--background-color-transparent');
  });

  it('prevents multiple clicks during loading state', () => {
    const store = configureStore(initialState);
    renderWithProvider(<AddMultichainAccount walletId={mockWalletId} />, store);

    // First click
    fireEvent.click(screen.getByTestId(addMultichainAccountButtonTestId));
    expect(createNextMultichainAccountGroup).toHaveBeenCalledTimes(1);

    // Try clicking again during the loading state
    fireEvent.click(screen.getByTestId(addMultichainAccountButtonTestId));
    expect(createNextMultichainAccountGroup).toHaveBeenCalledTimes(1); // Still just one call
  });

  it('returns to normal state after loading completes', async () => {
    const store = configureStore(initialState);
    const { container } = renderWithProvider(
      <AddMultichainAccount walletId={mockWalletId} />,
      store,
    );

    fireEvent.click(screen.getByTestId(addMultichainAccountButtonTestId));

    // Verify we're in the loading state first
    expect(screen.getByText('Adding account...')).toBeInTheDocument();

    // Wait for the async operation to complete (first run any pending promises)
    await Promise.resolve();

    // Run another tick to ensure state updates are processed
    await Promise.resolve();

    // Check that the component returned to normal state
    expect(screen.getByText('Add account')).toBeInTheDocument();
    expect(
      container.querySelector(addMultichainAccountIconClass),
    ).toBeInTheDocument();
    expect(
      container.querySelector(addMultichainAccountIconLoadingClass),
    ).not.toBeInTheDocument();

    // Check cursor style
    const button = screen.getByTestId(addMultichainAccountButtonTestId);
    expect(button).toHaveStyle('cursor: pointer');

    // Check background color of icon box
    const iconBox = container.querySelector(addMultichainAccountIconBoxClass);
    expect(iconBox).toHaveClass('mm-box--background-color-info-muted');
  });

  describe('Loading States Integration', () => {
    it('shows syncing message when account syncing is in progress', () => {
      const store = configureStore(initialState);
      mockUseAccountsWalletOperationsLoadingStates.mockReturnValue({
        areAnyOperationsLoading: true,
        loadingMessage: 'Syncing...',
      });

      const { getByText } = renderWithProvider(
        <AddMultichainAccount walletId={mockWalletId} />,
        store,
      );

      expect(getByText('Syncing...')).toBeInTheDocument();
    });

    it('shows creating account message when local loading is active', async () => {
      const store = configureStore(initialState);
      mockUseAccountsWalletOperationsLoadingStates.mockReturnValue({
        areAnyOperationsLoading: false,
        loadingMessage: '',
      });

      const { getByText } = renderWithProvider(
        <AddMultichainAccount walletId={mockWalletId} />,
        store,
      );

      fireEvent.click(getByText('Add account'));

      await waitFor(() => {
        expect(getByText('Adding account...')).toBeInTheDocument();
      });
    });

    it('prioritizes syncing message over local loading', async () => {
      const store = configureStore(initialState);
      mockUseAccountsWalletOperationsLoadingStates.mockReturnValue({
        areAnyOperationsLoading: true,
        loadingMessage: 'Syncing...',
      });

      const { getByText } = renderWithProvider(
        <AddMultichainAccount walletId={mockWalletId} />,
        store,
      );

      fireEvent.click(getByText('Syncing...'));

      // Should still show syncing message, not creating account message
      expect(getByText('Syncing...')).toBeInTheDocument();
    });

    it('shows spinner when any loading state is active', async () => {
      const store = configureStore(initialState);
      mockUseAccountsWalletOperationsLoadingStates.mockReturnValue({
        areAnyOperationsLoading: true,
        loadingMessage: 'Syncing...',
      });

      const { getByText } = renderWithProvider(
        <AddMultichainAccount walletId={mockWalletId} />,
        store,
      );

      // When account syncing is in progress, should show spinner
      expect(getByText('Syncing...')).toBeInTheDocument();
    });

    it('shows default Add account text when no loading states are active', () => {
      mockUseAccountsWalletOperationsLoadingStates.mockReturnValue({
        areAnyOperationsLoading: false,
        loadingMessage: '',
      });
      const store = configureStore(initialState);
      const { getByText } = renderWithProvider(
        <AddMultichainAccount walletId={mockWalletId} />,
        store,
      );

      expect(getByText('Add account')).toBeInTheDocument();
    });

    it('handles loading state transitions correctly', () => {
      const store = configureStore(initialState);
      // Start with no loading
      mockUseAccountsWalletOperationsLoadingStates.mockReturnValue({
        areAnyOperationsLoading: false,
        loadingMessage: undefined,
      });

      const { getByText, rerender } = renderWithProvider(
        <AddMultichainAccount walletId={mockWalletId} />,
        store,
      );

      expect(getByText('Add account')).toBeInTheDocument();

      // Simulate account syncing starting
      mockUseAccountsWalletOperationsLoadingStates.mockReturnValue({
        areAnyOperationsLoading: true,
        loadingMessage: 'Discovering accounts...',
      });

      rerender(<AddMultichainAccount walletId={mockWalletId} />);

      expect(getByText('Discovering accounts...')).toBeInTheDocument();

      // Simulate syncing completing
      mockUseAccountsWalletOperationsLoadingStates.mockReturnValue({
        areAnyOperationsLoading: false,
        loadingMessage: undefined,
      });

      rerender(<AddMultichainAccount walletId={mockWalletId} />);

      expect(getByText('Add account')).toBeInTheDocument();
    });
  });
});
