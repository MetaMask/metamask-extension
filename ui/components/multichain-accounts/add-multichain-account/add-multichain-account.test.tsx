import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';

import configureStore, { MetaMaskReduxDispatch } from '../../../store/store';
import { createNextMultichainAccountGroup } from '../../../store/actions';
import { useAccountsOperationsLoadingStates } from '../../../hooks/accounts/useAccountsOperationsLoadingStates';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { AddMultichainAccount } from './add-multichain-account';

jest.mock('../../../../shared/lib/trace', () => {
  const actual = jest.requireActual('../../../../shared/lib/trace');
  return {
    ...actual,
    trace: jest.fn(),
    endTrace: jest.fn(),
  };
});

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

jest.mock('../../../hooks/accounts/useAccountsOperationsLoadingStates', () => ({
  useAccountsOperationsLoadingStates: jest.fn(),
}));
const mockUseAccountsOperationsLoadingStates =
  useAccountsOperationsLoadingStates as jest.MockedFunction<
    typeof useAccountsOperationsLoadingStates
  >;

describe('AddMultichainAccount', () => {
  const mockWalletId = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ';

  const initialState = {
    metamask: {
      localeMessages: {
        current: {
          createMultichainAccountButton: messages.createMultichainAccountButton,
          createMultichainAccountButtonLoading:
            messages.createMultichainAccountButtonLoading,
        },
        currentLocale: 'en',
      },
    },
  };

  mockUseAccountsOperationsLoadingStates.mockReturnValue({
    isAccountTreeSyncingInProgress: false,
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
    expect(
      screen.getByText(messages.createMultichainAccountButton.message),
    ).toBeInTheDocument();
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

    expect(
      screen.getByText(messages.createMultichainAccountButtonLoading.message),
    ).toBeInTheDocument();
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
    expect(
      screen.getByText(messages.createMultichainAccountButtonLoading.message),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText(messages.createMultichainAccountButton.message),
      ).toBeInTheDocument();
    });

    // Check that the component returned to normal state
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

  it('fires trace and endTrace for CreateMultichainAccount on click', async () => {
    const store = configureStore(initialState);
    renderWithProvider(<AddMultichainAccount walletId={mockWalletId} />, store);

    const traceLib = jest.requireMock('../../../../shared/lib/trace');

    fireEvent.click(screen.getByTestId(addMultichainAccountButtonTestId));

    expect(traceLib.trace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: traceLib.TraceName.CreateMultichainAccount,
      }),
    );

    await waitFor(() => {
      expect(traceLib.endTrace).toHaveBeenCalledWith(
        expect.objectContaining({
          name: traceLib.TraceName.CreateMultichainAccount,
        }),
      );
    });
  });

  describe('Loading States Integration', () => {
    it('shows syncing message when account syncing is in progress', () => {
      const store = configureStore(initialState);
      mockUseAccountsOperationsLoadingStates.mockReturnValue({
        isAccountTreeSyncingInProgress: true,
        areAnyOperationsLoading: true,
        loadingMessage: messages.syncing.message,
      });

      const { getByText } = renderWithProvider(
        <AddMultichainAccount walletId={mockWalletId} />,
        store,
      );

      expect(getByText(messages.syncing.message)).toBeInTheDocument();
    });

    it('shows creating account message when local loading is active', async () => {
      const store = configureStore(initialState);
      mockUseAccountsOperationsLoadingStates.mockReturnValue({
        isAccountTreeSyncingInProgress: false,
        areAnyOperationsLoading: false,
        loadingMessage: '',
      });

      const { getByText } = renderWithProvider(
        <AddMultichainAccount walletId={mockWalletId} />,
        store,
      );

      fireEvent.click(
        getByText(messages.createMultichainAccountButton.message),
      );

      await waitFor(() => {
        expect(
          getByText(messages.createMultichainAccountButtonLoading.message),
        ).toBeInTheDocument();
      });
    });

    it('prioritizes syncing message over local loading', async () => {
      const store = configureStore(initialState);
      mockUseAccountsOperationsLoadingStates.mockReturnValue({
        isAccountTreeSyncingInProgress: true,
        areAnyOperationsLoading: true,
        loadingMessage: messages.syncing.message,
      });

      const { getByText } = renderWithProvider(
        <AddMultichainAccount walletId={mockWalletId} />,
        store,
      );

      fireEvent.click(getByText(messages.syncing.message));

      // Should still show syncing message, not creating account message
      expect(getByText(messages.syncing.message)).toBeInTheDocument();
    });

    it('shows spinner when any loading state is active', async () => {
      const store = configureStore(initialState);
      mockUseAccountsOperationsLoadingStates.mockReturnValue({
        isAccountTreeSyncingInProgress: true,
        areAnyOperationsLoading: true,
        loadingMessage: messages.syncing.message,
      });

      const { getByText } = renderWithProvider(
        <AddMultichainAccount walletId={mockWalletId} />,
        store,
      );

      // When account syncing is in progress, should show spinner
      expect(getByText(messages.syncing.message)).toBeInTheDocument();
    });

    it('shows default Add account text when no loading states are active', () => {
      mockUseAccountsOperationsLoadingStates.mockReturnValue({
        isAccountTreeSyncingInProgress: false,
        areAnyOperationsLoading: false,
        loadingMessage: '',
      });
      const store = configureStore(initialState);
      const { getByText } = renderWithProvider(
        <AddMultichainAccount walletId={mockWalletId} />,
        store,
      );

      expect(
        getByText(messages.createMultichainAccountButton.message),
      ).toBeInTheDocument();
    });

    it('handles loading state transitions correctly', () => {
      const store = configureStore(initialState);
      // Start with no loading
      mockUseAccountsOperationsLoadingStates.mockReturnValue({
        isAccountTreeSyncingInProgress: false,
        areAnyOperationsLoading: false,
        loadingMessage: undefined,
      });

      const { getByText, rerender } = renderWithProvider(
        <AddMultichainAccount walletId={mockWalletId} />,
        store,
      );

      expect(
        getByText(messages.createMultichainAccountButton.message),
      ).toBeInTheDocument();

      // Simulate account syncing starting
      mockUseAccountsOperationsLoadingStates.mockReturnValue({
        isAccountTreeSyncingInProgress: true,
        areAnyOperationsLoading: true,
        loadingMessage: messages.syncing.message,
      });

      rerender(<AddMultichainAccount walletId={mockWalletId} />);

      expect(getByText(messages.syncing.message)).toBeInTheDocument();

      // Simulate syncing completing
      mockUseAccountsOperationsLoadingStates.mockReturnValue({
        isAccountTreeSyncingInProgress: false,
        areAnyOperationsLoading: false,
        loadingMessage: undefined,
      });

      rerender(<AddMultichainAccount walletId={mockWalletId} />);

      expect(
        getByText(messages.createMultichainAccountButton.message),
      ).toBeInTheDocument();
    });
  });
});
