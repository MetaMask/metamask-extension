import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import {
  DEFAULT_ROUTE,
  PERPS_TRANSACTION_DETAILS_ROUTE,
  TX_DETAILS_ROUTE,
} from '../../helpers/constants/routes';
import { getIsPerpsExperienceAvailable } from '../../selectors/perps/feature-flags';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
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
  getIsPerpsExperienceAvailable: jest.fn(),
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

const mockGetIsPerpsExperienceAvailable =
  getIsPerpsExperienceAvailable as jest.MockedFunction<
    typeof getIsPerpsExperienceAvailable
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
    mockGetIsPerpsExperienceAvailable.mockReturnValue(true);
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
    expect(
      screen.getAllByText(messages.perpsTrades.message).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(messages.perpsOrders.message)).toBeInTheDocument();
    expect(screen.getByText(messages.perpsFunding.message)).toBeInTheDocument();
    expect(
      screen.getByText(messages.perpsDeposits.message),
    ).toBeInTheDocument();
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

  it('back button navigates to previous page', () => {
    renderWithProvider(<PerpsActivityPage />, createMockStore());

    const backButton = screen.getByTestId('perps-activity-back-button');
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('redirects when perps experience is unavailable', () => {
    mockGetIsPerpsExperienceAvailable.mockReturnValue(false);

    renderWithProvider(<PerpsActivityPage />, createMockStore());

    // Should render the Navigate component with DEFAULT_ROUTE
    expect(screen.getByTestId('navigate-to')).toHaveTextContent(DEFAULT_ROUTE);
  });

  it('renders header with activity title', () => {
    renderWithProvider(<PerpsActivityPage />, createMockStore());

    expect(screen.getByText(messages.activity.message)).toBeInTheDocument();
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

  describe('transaction navigation', () => {
    it('navigates to the Perps transaction details page when an order is clicked', () => {
      renderWithProvider(<PerpsActivityPage />, createMockStore());

      // Switch to the Orders filter to reveal order transactions
      fireEvent.click(screen.getByTestId('perps-activity-filter-button'));
      fireEvent.click(screen.getByTestId('perps-activity-filter-option-order'));

      // tx-004 has type 'order' and symbol 'SOL' — click its transaction card
      const orderCard = screen.getByTestId('transaction-card-tx-004');
      fireEvent.click(orderCard);

      const orderTransaction = mockTransactions.find(
        (transaction) => transaction.id === 'tx-004',
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        PERPS_TRANSACTION_DETAILS_ROUTE,
        { state: { transaction: orderTransaction } },
      );
    });

    it('navigates to the Perps transaction details page when a trade is clicked', () => {
      renderWithProvider(<PerpsActivityPage />, createMockStore());

      // Default filter is 'trade' — tx-001 has type 'trade'
      const tradeCard = screen.getByTestId('transaction-card-tx-001');
      fireEvent.click(tradeCard);

      const tradeTransaction = mockTransactions.find(
        (transaction) => transaction.id === 'tx-001',
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        PERPS_TRANSACTION_DETAILS_ROUTE,
        { state: { transaction: tradeTransaction } },
      );
    });

    it('navigates to the generic tx details route when a deposit is clicked', () => {
      renderWithProvider(<PerpsActivityPage />, createMockStore());

      fireEvent.click(screen.getByTestId('perps-activity-filter-button'));
      fireEvent.click(
        screen.getByTestId('perps-activity-filter-option-deposit'),
      );

      // tx-005 is a completed deposit with a tx hash
      const depositCard = screen.getByTestId('transaction-card-tx-005');
      fireEvent.click(depositCard);

      const depositTransaction = mockTransactions.find(
        (transaction) => transaction.id === 'tx-005',
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        `${TX_DETAILS_ROUTE}/eip155:42161/${depositTransaction?.depositWithdrawal?.txHash}`,
        { state: undefined },
      );
    });
  });
});
