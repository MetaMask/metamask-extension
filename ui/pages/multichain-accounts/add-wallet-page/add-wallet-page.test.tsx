import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';

import { AddWalletPage } from './add-wallet-page';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';

const mockHistoryGoBack = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    goBack: mockHistoryGoBack,
  }),
}));

// Mock the ImportAccount component to test onActionComplete function is passed
jest.mock(
  '../../../components/multichain/import-account/import-account',
  () => ({
    ImportAccount: ({
      onActionComplete,
    }: {
      onActionComplete: (success: boolean) => void;
    }) => (
      <div>
        <button onClick={() => onActionComplete(true)}>
          Mock Import Success
        </button>
        <button onClick={() => onActionComplete(false)}>
          Mock Import Failure
        </button>
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
    expect(screen.getByTestId(backButtonTestId)).toBeInTheDocument();
  });

  it('calls history.goBack when back button is clicked', () => {
    renderComponent();

    const backButton = screen.getByTestId(backButtonTestId);
    fireEvent.click(backButton);

    expect(mockHistoryGoBack).toHaveBeenCalledTimes(1);
  });

  it('handles successful import completion', () => {
    renderComponent();

    const successButton = screen.getByRole('button', {
      name: 'Mock Import Success',
    });
    fireEvent.click(successButton);

    expect(mockHistoryGoBack).toHaveBeenCalledTimes(1);
  });

  it('does not navigate on failed import', () => {
    renderComponent();

    const failureButton = screen.getByRole('button', {
      name: 'Mock Import Failure',
    });
    fireEvent.click(failureButton);

    expect(mockHistoryGoBack).not.toHaveBeenCalled();
  });
});
