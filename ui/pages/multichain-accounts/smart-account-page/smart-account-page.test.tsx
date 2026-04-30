import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { SmartAccountPage } from './smart-account-page';

const mockNavigate = jest.fn();
const mockUseParams = jest.fn();

// Use an address from mock-state that has HD Key Tree keyring (EIP-7702 supported)
const MOCK_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

describe('SmartAccountPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page with correct title provided', () => {
    mockUseParams.mockReturnValue({
      address: encodeURIComponent(MOCK_ADDRESS),
    });

    const store = configureStore({
      metamask: {
        ...mockState.metamask,
      },
    });

    renderWithProvider(<SmartAccountPage />, store);

    expect(screen.getByText(/Smart account/u)).toBeInTheDocument();
  });

  it('handles back button click', () => {
    mockUseParams.mockReturnValue({
      address: encodeURIComponent(MOCK_ADDRESS),
    });

    const store = configureStore({
      metamask: {
        ...mockState.metamask,
      },
    });

    renderWithProvider(<SmartAccountPage />, store);

    const backButton = screen.getByTestId('smart-account-page-back-button');
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('redirects to previous route when account does not support EIP-7702 (e.g. hardware wallet)', () => {
    const ledgerAccountAddress = '0xc42edfcc21ed14dda456aa0756c153f7985d8813';
    mockUseParams.mockReturnValue({
      address: encodeURIComponent(ledgerAccountAddress),
    });

    const store = configureStore({
      metamask: {
        ...mockState.metamask,
      },
    });

    renderWithProvider(<SmartAccountPage />, store);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
    expect(screen.queryByText(/Smart account/u)).not.toBeInTheDocument();
  });
});
