import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { SmartAccountPage } from './smart-account-page';

const mockHistoryGoBack = jest.fn();
const mockUseParams = jest.fn();

const MOCK_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    goBack: mockHistoryGoBack,
  }),
  useParams: () => mockUseParams(),
}));

jest.mock(
  '../../../components/multichain-accounts/smart-contract-account-toggle-section',
  () => ({
    SmartContractAccountToggleSection: ({ address }: { address: string }) => (
      <div
        data-testid="smart-contract-account-toggle-section"
        data-address={address}
      >
        Smart Contract Account Toggle Section
      </div>
    ),
  }),
);

describe('SmartAccountPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page with correct components when address is provided', () => {
    mockUseParams.mockReturnValue({
      address: encodeURIComponent(MOCK_ADDRESS),
    });

    const store = configureStore({
      metamask: {
        ...mockState.metamask,
      },
    });

    renderWithProvider(<SmartAccountPage />, store);

    // Check that the smart contract toggle section is rendered
    expect(
      screen.getByTestId('smart-contract-account-toggle-section'),
    ).toBeInTheDocument();

    // Check that the address is passed correctly
    expect(
      screen.getByTestId('smart-contract-account-toggle-section'),
    ).toHaveAttribute('data-address', MOCK_ADDRESS);

    // Check that back button is present
    expect(
      screen.getByTestId('smart-account-page-back-button'),
    ).toBeInTheDocument();
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

    expect(mockHistoryGoBack).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when no address is provided', () => {
    mockUseParams.mockReturnValue({
      address: undefined,
    });

    const store = configureStore({
      metamask: {
        ...mockState.metamask,
      },
    });

    const { container } = renderWithProvider(<SmartAccountPage />, store);

    // Should render nothing (null)
    expect(container.firstChild).toBeNull();
  });

  it('displays correct page title', () => {
    mockUseParams.mockReturnValue({
      address: encodeURIComponent(MOCK_ADDRESS),
    });

    const store = configureStore({
      metamask: {
        ...mockState.metamask,
      },
    });

    renderWithProvider(<SmartAccountPage />, store);

    // Should show page title with Smart Account
    expect(screen.getByText(/Smart account/u)).toBeInTheDocument();
  });
});
