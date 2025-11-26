import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';

import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';

import { AddWalletPage } from './add-wallet-page';

const mockNavigate = jest.fn();

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: () => mockNavigate,
}));

// Mock the ImportAccount component to test onActionComplete function is passed
jest.mock(
  '../../../components/multichain/import-account/import-account',
  () => ({
    ImportAccount: ({
      onActionComplete,
    }: {
      onActionComplete: (success?: boolean) => void;
    }) => (
      <div>
        <button onClick={() => onActionComplete(true)}>
          Mock Import Success
        </button>
        <button onClick={() => onActionComplete(false)}>
          Mock Import Failure
        </button>
        <button onClick={() => onActionComplete()}>Mock Cancel</button>
      </div>
    ),
  }),
);

const backButtonTestId = 'add-wallet-page-back-button';

const renderComponent = () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });
  return renderWithProvider(<AddWalletPage />, store);
};

describe('AddWalletPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page with correct title and components', () => {
    renderComponent();

    expect(screen.getByText('Add wallet')).toBeInTheDocument();
    expect(screen.getByText('Private key')).toBeInTheDocument();
    expect(screen.getByTestId(backButtonTestId)).toBeInTheDocument();
  });

  it('calls navigate(PREVIOUS_ROUTE) when back button is clicked', () => {
    renderComponent();

    const backButton = screen.getByTestId(backButtonTestId);
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('handles successful import completion', () => {
    renderComponent();

    const successButton = screen.getByRole('button', {
      name: 'Mock Import Success',
    });
    fireEvent.click(successButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('does not navigate on failed import', () => {
    renderComponent();

    const failureButton = screen.getByRole('button', {
      name: 'Mock Import Failure',
    });
    fireEvent.click(failureButton);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates back when user cancels', () => {
    renderComponent();

    const cancelButton = screen.getByRole('button', {
      name: 'Mock Cancel',
    });
    fireEvent.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
