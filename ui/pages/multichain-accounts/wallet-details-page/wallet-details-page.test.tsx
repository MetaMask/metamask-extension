import React from 'react';
import { screen, fireEvent } from '@testing-library/react';

import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { WalletDetailsPage } from './wallet-details-page';

const mockNavigate = jest.fn();

const walletId = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ';

const mockUseParams = jest.fn().mockImplementation(() => ({
  id: encodeURIComponent(walletId),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
}));

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: () => mockNavigate,
}));

describe('WalletDetailsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (customMockedState = {}) => {
    const state = {
      activeTab: mockState.activeTab,
      metamask: {
        ...mockState.metamask,
        seedPhraseBackedUp: true,
        accountTree: mockState.metamask.accountTree,
        ...customMockedState,
      },
    };

    return renderWithProvider(<WalletDetailsPage />, configureStore(state));
  };

  it('renders the page with correct components and wallet information', () => {
    renderComponent();

    expect(
      screen.getByRole('heading', { name: 'Wallet 1 / Accounts' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Back')).toBeInTheDocument();
    expect(screen.getByText('Wallet name')).toBeInTheDocument();
    expect(screen.getAllByText('Wallet 1')[0]).toBeInTheDocument();
    expect(screen.getByText('Balance')).toBeInTheDocument();
    expect(screen.getByText('Secret Recovery Phrase')).toBeInTheDocument();
    expect(screen.getByText('Account 1')).toBeInTheDocument();
  });

  it('calls navigate(-1) when back button is clicked', () => {
    renderComponent();

    const backButton = screen.getByLabelText('Back');
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('does not render backup reminder text when seedPhraseBackedUp is true', () => {
    renderComponent({
      seedPhraseBackedUp: true,
    });

    expect(screen.queryByText('Backup')).not.toBeInTheDocument();
  });

  it('does not render SRP button for non-entropy wallets', () => {
    const ledgerWalletId = 'keyring:Ledger Hardware';

    mockUseParams.mockImplementationOnce(() => ({
      id: encodeURIComponent(ledgerWalletId),
    }));

    renderComponent();

    expect(
      screen.queryByText('Secret Recovery Phrase'),
    ).not.toBeInTheDocument();
  });

  it('renders AddMultichainAccount component for entropy wallets', () => {
    renderComponent();

    expect(screen.getByText('Add account')).toBeInTheDocument();
  });
});
