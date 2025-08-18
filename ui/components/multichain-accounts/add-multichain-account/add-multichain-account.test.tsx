import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore, { MetaMaskReduxDispatch } from '../../../store/store';
import { createMultichainAccount } from '../../../store/actions';
import { AddMultichainAccount } from './add-multichain-account';

jest.mock('../../../store/actions', () => ({
  createMultichainAccount: jest.fn(() => (dispatch: MetaMaskReduxDispatch) => {
    return dispatch({ type: 'MOCKED_ACTION' });
  }),
}));
jest.useFakeTimers();

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
      screen.getByTestId('add-multichain-account-button'),
    ).toBeInTheDocument();
    expect(screen.getByText('Create account')).toBeInTheDocument();
    expect(
      container.querySelector('.add-multichain-account__icon-box__icon'),
    ).toBeInTheDocument();
    expect(
      container.querySelector(
        '.add-multichain-account__icon-box__icon-loading',
      ),
    ).not.toBeInTheDocument();
  });

  it('dispatches createMultichainAccount action when clicked', () => {
    const store = configureStore(initialState);
    renderWithProvider(<AddMultichainAccount walletId={mockWalletId} />, store);

    fireEvent.click(screen.getByTestId('add-multichain-account-button'));

    expect(createMultichainAccount).toHaveBeenCalledWith(mockWalletId);
  });

  it('shows loading state when clicked', () => {
    const store = configureStore(initialState);
    const { container } = renderWithProvider(
      <AddMultichainAccount walletId={mockWalletId} />,
      store,
    );

    fireEvent.click(screen.getByTestId('add-multichain-account-button'));

    expect(screen.getByText('Creating account...')).toBeInTheDocument();
    expect(
      container.querySelector('.add-multichain-account__icon-box__icon'),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector(
        '.add-multichain-account__icon-box__icon-loading',
      ),
    ).toBeInTheDocument();

    // Check cursor style
    const button = screen.getByTestId('add-multichain-account-button');
    expect(button).toHaveStyle('cursor: not-allowed');

    // Check background color of icon box
    const iconBox = container.querySelector(
      '.add-multichain-account__icon-box',
    );
    expect(iconBox).toHaveClass('mm-box--background-color-transparent');
  });

  it('prevents multiple clicks during loading state', () => {
    const store = configureStore(initialState);
    renderWithProvider(<AddMultichainAccount walletId={mockWalletId} />, store);

    // First click
    fireEvent.click(screen.getByTestId('add-multichain-account-button'));
    expect(createMultichainAccount).toHaveBeenCalledTimes(1);

    // Try clicking again during the loading state
    fireEvent.click(screen.getByTestId('add-multichain-account-button'));
    expect(createMultichainAccount).toHaveBeenCalledTimes(1); // Still just one call
  });

  it('returns to normal state after loading completes', () => {
    const store = configureStore(initialState);
    const { container } = renderWithProvider(
      <AddMultichainAccount walletId={mockWalletId} />,
      store,
    );

    fireEvent.click(screen.getByTestId('add-multichain-account-button'));

    // Fast-forward timer to complete loading
    jest.advanceTimersByTime(1200);

    // Check that the component returned to normal state
    expect(screen.getByText('Create account')).toBeInTheDocument();
    expect(
      container.querySelector('.add-multichain-account__icon-box__icon'),
    ).toBeInTheDocument();
    expect(
      container.querySelector(
        '.add-multichain-account__icon-box__icon-loading',
      ),
    ).not.toBeInTheDocument();

    // Check cursor style
    const button = screen.getByTestId('add-multichain-account-button');
    expect(button).toHaveStyle('cursor: pointer');

    // Check background color of icon box
    const iconBox = container.querySelector(
      '.add-multichain-account__icon-box',
    );
    expect(iconBox).toHaveClass('mm-box--background-color-info-muted');
  });
});
