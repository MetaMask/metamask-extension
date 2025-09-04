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

    expect(mockHistoryGoBack).toHaveBeenCalledTimes(1);
  });
});
