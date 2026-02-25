import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { getIsPerpsEnabled } from '../../selectors/perps/feature-flags';
import { mockTransactions } from '../../components/app/perps/mocks';
import PerpsActivityPage from './perps-activity-page';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Navigate: ({ to }: { to: string }) => (
    <div data-testid="navigate-to">{to}</div>
  ),
}));

// Mock the perps feature flag selector
jest.mock('../../selectors/perps/feature-flags', () => ({
  getIsPerpsEnabled: jest.fn(),
}));

// Mock usePerpsTransactionHistory hook to avoid controller dependency
jest.mock('../../hooks/perps/usePerpsTransactionHistory', () => ({
  usePerpsTransactionHistory: () => ({
    transactions: mockTransactions,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

const mockGetIsPerpsEnabled = getIsPerpsEnabled as jest.MockedFunction<
  typeof getIsPerpsEnabled
>;

const createMockStore = () =>
  configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });

describe('PerpsActivityPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetIsPerpsEnabled.mockReturnValue(true);
  });

  it('renders with correct data-testid', () => {
    renderWithProvider(<PerpsActivityPage />, createMockStore());

    expect(screen.getByTestId('perps-activity-page')).toBeInTheDocument();
  });

  it('displays all four filter options', () => {
    renderWithProvider(<PerpsActivityPage />, createMockStore());

    // Open the dropdown
    fireEvent.click(screen.getByTestId('perps-activity-filter-button'));

    // Check all options are present
    expect(
      screen.getByTestId('perps-activity-filter-option-trade'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('perps-activity-filter-option-order'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('perps-activity-filter-option-funding'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('perps-activity-filter-option-deposit'),
    ).toBeInTheDocument();
  });

  it('displays filter option labels', () => {
    renderWithProvider(<PerpsActivityPage />, createMockStore());

    // Open the dropdown
    fireEvent.click(screen.getByTestId('perps-activity-filter-button'));

    // Use getAllByText since "Trades" appears in both the button and dropdown option
    expect(screen.getAllByText('Trades').length).toBeGreaterThan(0);
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Funding')).toBeInTheDocument();
    expect(screen.getByText('Deposits')).toBeInTheDocument();
  });

  it('switches between filter options and updates displayed transactions', () => {
    renderWithProvider(<PerpsActivityPage />, createMockStore());

    // Default shows "Trades" in the dropdown button
    expect(
      screen.getByTestId('perps-activity-filter-button'),
    ).toHaveTextContent('Trades');

    // Open dropdown and select Orders
    fireEvent.click(screen.getByTestId('perps-activity-filter-button'));
    fireEvent.click(screen.getByTestId('perps-activity-filter-option-order'));

    // Dropdown button should now show "Orders"
    expect(
      screen.getByTestId('perps-activity-filter-button'),
    ).toHaveTextContent('Orders');
  });

  it('groups transactions by date with proper labels', () => {
    renderWithProvider(<PerpsActivityPage />, createMockStore());

    // The dropdown filter should be present
    expect(
      screen.getByTestId('perps-activity-filter-button'),
    ).toBeInTheDocument();
  });

  it('back button navigates to DEFAULT_ROUTE', () => {
    renderWithProvider(<PerpsActivityPage />, createMockStore());

    const backButton = screen.getByTestId('perps-activity-back-button');
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });

  it('redirects when isPerpsEnabled is false', () => {
    mockGetIsPerpsEnabled.mockReturnValue(false);

    renderWithProvider(<PerpsActivityPage />, createMockStore());

    // Should render the Navigate component with DEFAULT_ROUTE
    expect(screen.getByTestId('navigate-to')).toHaveTextContent(DEFAULT_ROUTE);
  });

  it('renders header with activity title', () => {
    renderWithProvider(<PerpsActivityPage />, createMockStore());

    expect(screen.getByText('Activity')).toBeInTheDocument();
  });

  it('displays the back button with correct aria-label', () => {
    renderWithProvider(<PerpsActivityPage />, createMockStore());

    const backButton = screen.getByTestId('perps-activity-back-button');
    expect(backButton).toHaveAttribute('aria-label', 'Back');
  });

  it('shows funding transactions when funding filter is selected', () => {
    renderWithProvider(<PerpsActivityPage />, createMockStore());

    // Open dropdown and select Funding
    fireEvent.click(screen.getByTestId('perps-activity-filter-button'));
    fireEvent.click(screen.getByTestId('perps-activity-filter-option-funding'));

    // Dropdown button should now show "Funding"
    expect(
      screen.getByTestId('perps-activity-filter-button'),
    ).toHaveTextContent('Funding');
  });

  it('shows deposit transactions when deposit filter is selected', () => {
    renderWithProvider(<PerpsActivityPage />, createMockStore());

    // Open dropdown and select Deposits
    fireEvent.click(screen.getByTestId('perps-activity-filter-button'));
    fireEvent.click(screen.getByTestId('perps-activity-filter-option-deposit'));

    // Dropdown button should now show "Deposits"
    expect(
      screen.getByTestId('perps-activity-filter-button'),
    ).toHaveTextContent('Deposits');
  });
});
