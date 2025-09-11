import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore, { MetaMaskReduxDispatch } from '../../../store/store';
import { createNextMultichainAccountGroup } from '../../../store/actions';
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

describe('AddMultichainAccount', () => {
  const mockWalletId = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ';

  const initialState = {
    metamask: {
      localeMessages: {
        current: {
          createMultichainAccountButton: 'Create account',
          createMultichainAccountButtonLoading: 'Creating account...',
        },
        currentLocale: 'en',
      },
    },
  };

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
    expect(screen.getByText('Create account')).toBeInTheDocument();
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

    expect(screen.getByText('Creating account...')).toBeInTheDocument();
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
    expect(screen.getByText('Creating account...')).toBeInTheDocument();

    // Wait for the async operation to complete (first run any pending promises)
    await Promise.resolve();

    // Run another tick to ensure state updates are processed
    await Promise.resolve();

    // Check that the component returned to normal state
    expect(screen.getByText('Create account')).toBeInTheDocument();
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
});
