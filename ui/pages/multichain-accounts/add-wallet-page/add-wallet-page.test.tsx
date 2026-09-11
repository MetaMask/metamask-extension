import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';

import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { toast, ToastContent } from '../../../components/ui/toast/toast';

import { AddWalletPage } from './add-wallet-page';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../components/ui/toast/toast', () => ({
  toast: {
    success: jest.fn(),
  },
  ToastContent: jest.fn(({ title, dataTestId }) => (
    <div data-testid={dataTestId}>{title}</div>
  )),
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

    expect(screen.getByText(messages.addWallet.message)).toBeInTheDocument();
    expect(screen.getByText(messages.privateKey.message)).toBeInTheDocument();
    expect(screen.getByTestId(backButtonTestId)).toBeInTheDocument();
  });

  it('calls navigate(PREVIOUS_ROUTE) when back button is clicked', () => {
    renderComponent();

    const backButton = screen.getByTestId(backButtonTestId);
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('shows a success toast and navigates home after a successful import', () => {
    renderComponent();

    const successButton = screen.getByRole('button', {
      name: 'Mock Import Success',
    });
    fireEvent.click(successButton);

    expect(toast.success).toHaveBeenCalledWith(
      <ToastContent
        title={messages.accountImported.message}
        dataTestId="account-imported-toast"
      />,
      { id: 'account-imported-toast', duration: 5000 },
    );
    expect(jest.mocked(toast.success).mock.invocationCallOrder[0]).toBeLessThan(
      mockNavigate.mock.invocationCallOrder[0],
    );
    expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
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
