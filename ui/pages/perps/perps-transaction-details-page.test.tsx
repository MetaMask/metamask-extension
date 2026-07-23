import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import {
  DEFAULT_ROUTE,
  PERPS_TRANSACTION_DETAILS_ROUTE,
} from '../../helpers/constants/routes';
import { getIsPerpsExperienceAvailable } from '../../selectors/perps/feature-flags';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { mockTransactions } from '../../components/app/perps/mocks';
import type { PerpsTransaction } from '../../components/app/perps/types';
import { usePerpsOrderFees } from '../../hooks/perps/usePerpsOrderFees';
import PerpsTransactionDetailsPage from './perps-transaction-details-page';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Navigate: ({ to }: { to: string }) => (
    <div data-testid="navigate-to">{to}</div>
  ),
}));

jest.mock('../../selectors/perps/feature-flags', () => ({
  getIsPerpsExperienceAvailable: jest.fn(),
}));

jest.mock('../../hooks/perps/usePerpsOrderFees', () => ({
  usePerpsOrderFees: jest.fn(() => ({
    feeResult: undefined,
    isLoading: false,
    hasError: false,
  })),
}));

const mockGetIsPerpsExperienceAvailable =
  getIsPerpsExperienceAvailable as jest.MockedFunction<
    typeof getIsPerpsExperienceAvailable
  >;

const findTransaction = (id: string): PerpsTransaction => {
  const transaction = mockTransactions.find((tx) => tx.id === id);
  if (!transaction) {
    throw new Error(`Missing mock transaction with id ${id}`);
  }
  return transaction;
};

// Finds the value rendered for a given row label, scoping the query to a
// single `transaction-breakdown-row` so labels/values that happen to share
// text with another row (e.g. "Status" showing "Filled" and the "Filled"
// row both rendering the word "Filled") don't collide.
const getRowValueByLabel = (label: string): string | null => {
  const row = screen
    .getAllByTestId('transaction-breakdown-row')
    .find((rowElement) =>
      rowElement.querySelector('[data-testid="transaction-breakdown-row-title"]')
        ?.textContent === label,
    );
  return (
    row?.querySelector('[data-testid="transaction-breakdown-row-value"]')
      ?.textContent ?? null
  );
};

const createMockStore = () =>
  configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });

// Renders the page inside a memory router location that carries `state`, so
// the real `useLocation`/`useSegmentContext` hooks (used deep inside
// `PerpsFillTag`) see a valid pathname instead of being stubbed out.
// `renderWithProvider`'s JS/JSDoc signature types its `pathname` param as a
// plain string, but `createMemoryRouter`'s `initialEntries` also accepts a
// location descriptor object (needed here to carry `state`), hence the cast.
const renderWithTransaction = (transaction?: PerpsTransaction) =>
  renderWithProvider(<PerpsTransactionDetailsPage />, createMockStore(), {
    pathname: PERPS_TRANSACTION_DETAILS_ROUTE,
    state: transaction ? { transaction } : null,
  } as unknown as string);

describe('PerpsTransactionDetailsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetIsPerpsExperienceAvailable.mockReturnValue(true);
  });

  it('redirects when perps experience is unavailable', () => {
    mockGetIsPerpsExperienceAvailable.mockReturnValue(false);

    renderWithTransaction();

    expect(screen.getByTestId('navigate-to')).toHaveTextContent(DEFAULT_ROUTE);
  });

  it('shows a not-found state when no transaction is present in router state', () => {
    renderWithTransaction();

    expect(
      screen.getByTestId('perps-transaction-details-not-found'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.perpsNoTransactions.message),
    ).toBeInTheDocument();
  });

  it('navigates back when the back button is clicked from the not-found state', () => {
    renderWithTransaction();

    fireEvent.click(
      screen.getByTestId('perps-transaction-details-back-button'),
    );

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  describe('order transaction (tx-004)', () => {
    it('renders the page and title', () => {
      renderWithTransaction(findTransaction('tx-004'));

      expect(
        screen.getByTestId('perps-transaction-details-page'),
      ).toBeInTheDocument();
      expect(screen.getByText('Limit long')).toBeInTheDocument();
    });

    it('shows order status, type, limit price, order value, and filled rows', () => {
      renderWithTransaction(findTransaction('tx-004'));

      expect(
        screen.getByText(messages.perpsOrderStatus.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsStatusOpen.message),
      ).toBeInTheDocument();

      expect(
        screen.getByText(messages.perpsOrderType.message),
      ).toBeInTheDocument();
      expect(screen.getByText(messages.perpsLimit.message)).toBeInTheDocument();

      expect(
        screen.getByText(messages.perpsLimitPrice.message),
      ).toBeInTheDocument();

      expect(
        screen.getByText(messages.perpsOrderValue.message),
      ).toBeInTheDocument();

      expect(
        screen.getByText(messages.perpsOrderFilled.message),
      ).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('back button navigates to the previous page', () => {
      renderWithTransaction(findTransaction('tx-004'));

      fireEvent.click(
        screen.getByTestId('perps-transaction-details-back-button'),
      );

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('market order transaction (tx-004b)', () => {
    it('shows "Market" as the order type instead of a limit price row', () => {
      renderWithTransaction(findTransaction('tx-004b'));

      expect(
        screen.getByText(messages.perpsMarket.message),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(messages.perpsLimitPrice.message),
      ).not.toBeInTheDocument();
    });

    it('renders the localized status via the i18n lookup, not the raw order.text field directly', () => {
      const transaction = findTransaction('tx-004b');
      renderWithTransaction(transaction);

      expect(transaction.order?.text).toBe('Filled');
      expect(getRowValueByLabel(messages.perpsOrderStatus.message)).toBe(
        messages.perpsStatusFilled.message,
      );
    });
  });

  describe('canceled order transaction (tx-004c)', () => {
    it('renders the localized status via the i18n lookup, not the raw order.text field directly', () => {
      const transaction = findTransaction('tx-004c');
      renderWithTransaction(transaction);

      expect(transaction.order?.text).toBe('Canceled');
      expect(getRowValueByLabel(messages.perpsOrderStatus.message)).toBe(
        messages.perpsStatusCanceled.message,
      );
    });
  });

  describe('order fee breakdown', () => {
    it('renders MetaMask fee, Hyperliquid fee, and Total fee rows for a filled order', () => {
      jest.mocked(usePerpsOrderFees).mockReturnValue({
        feeRate: 0.00145,
        undiscountedFeeRate: 0.00145,
        metamaskFeeRateDiscountPercentage: undefined,
        feeResult: {
          feeRate: 0.00145,
          protocolFeeRate: 0.00045,
          metamaskFeeRate: 0.001,
          feeAmount: 6.525,
          protocolFeeAmount: 2.025,
          metamaskFeeAmount: 4.5,
        },
        isLoading: false,
        hasError: false,
      });

      // tx-004b is a market order with order.text === 'Filled'
      renderWithTransaction(findTransaction('tx-004b'));

      expect(
        screen.getByText(messages.perpsOrderMetamaskFee.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsOrderHyperliquidFee.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsOrderTotalFee.message),
      ).toBeInTheDocument();

      expect(
        getRowValueByLabel(messages.perpsOrderMetamaskFee.message),
      ).toBe('$4.5');
      expect(
        getRowValueByLabel(messages.perpsOrderHyperliquidFee.message),
      ).toBe('$2.025');
      expect(getRowValueByLabel(messages.perpsOrderTotalFee.message)).toBe(
        '$6.525',
      );
    });

    it('zeroes out the fee rows for an unfilled order', () => {
      jest.mocked(usePerpsOrderFees).mockReturnValue({
        feeRate: 0.00145,
        undiscountedFeeRate: 0.00145,
        metamaskFeeRateDiscountPercentage: undefined,
        feeResult: {
          feeRate: 0.00145,
          protocolFeeRate: 0.00045,
          metamaskFeeRate: 0.001,
          feeAmount: 6.525,
          protocolFeeAmount: 2.025,
          metamaskFeeAmount: 4.5,
        },
        isLoading: false,
        hasError: false,
      });

      // tx-004 is an open (unfilled) limit order
      renderWithTransaction(findTransaction('tx-004'));

      expect(
        getRowValueByLabel(messages.perpsOrderMetamaskFee.message),
      ).toBe('$0');
      expect(
        getRowValueByLabel(messages.perpsOrderHyperliquidFee.message),
      ).toBe('$0');
      expect(getRowValueByLabel(messages.perpsOrderTotalFee.message)).toBe(
        '$0',
      );
    });
  });

  describe('trade transaction with realized PnL (tx-002)', () => {
    it('renders close price, size, PnL, and fees rows', () => {
      renderWithTransaction(findTransaction('tx-002'));

      // tx-002 is a closed position (fill.action === 'Closed'), so the price
      // row is labeled "Close price" rather than "Entry price".
      expect(
        screen.getByText(messages.perpsClosePrice.message),
      ).toBeInTheDocument();
      expect(screen.getByText(messages.perpsSize.message)).toBeInTheDocument();
      expect(screen.getByText('0.5 BTC')).toBeInTheDocument();
      expect(screen.getByText(messages.perpsPnl.message)).toBeInTheDocument();
      expect(screen.getByText(messages.perpsFees.message)).toBeInTheDocument();
    });

    it('renders a positive PnL value in the success color', () => {
      renderWithTransaction(findTransaction('tx-002'));

      expect(screen.getByText('+$125.00')).toHaveClass('text-success-default');
    });
  });

  describe('trade transaction with a realized loss (tx-002b)', () => {
    it('renders a negative PnL value in the error color', () => {
      renderWithTransaction(findTransaction('tx-002b'));

      expect(screen.getByText('-$45.50')).toHaveClass('text-error-default');
    });
  });

  describe('trade transaction PnL uses the net-of-fees amount', () => {
    it('renders fill.amountNumber (pnl - fee) rather than the raw gross fill.pnl', () => {
      const baseTransaction = findTransaction('tx-002');
      const baseFill = baseTransaction.fill;
      if (!baseFill) {
        throw new Error('tx-002 fixture is missing a fill');
      }
      const grossPnlTransaction: PerpsTransaction = {
        ...baseTransaction,
        fill: {
          ...baseFill,
          pnl: '150.00',
          fee: '25.00',
          amount: '+$125.00',
          amountNumber: 125,
          isPositive: true,
        },
      };

      renderWithTransaction(grossPnlTransaction);

      // The net-of-fees value (150 - 25 = 125) is shown, not the gross $150.
      expect(screen.getByText('+$125.00')).toBeInTheDocument();
      expect(screen.queryByText('+$150.00')).not.toBeInTheDocument();
    });

    it('labels the price row "Close price" for a closed position fill', () => {
      const transaction = findTransaction('tx-002');
      expect(transaction.fill?.action).toBe('Closed');

      renderWithTransaction(transaction);

      expect(
        screen.getByText(messages.perpsClosePrice.message),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(messages.perpsEntryPrice.message),
      ).not.toBeInTheDocument();
    });
  });

  describe('trade transaction without realized PnL (tx-001)', () => {
    it('hides the PnL row for an open position with zero pnl', () => {
      renderWithTransaction(findTransaction('tx-001'));

      expect(
        screen.queryByText(messages.perpsPnl.message),
      ).not.toBeInTheDocument();
    });
  });

  describe('funding transaction (tx-003)', () => {
    it('renders funding rate and amount rows', () => {
      renderWithTransaction(findTransaction('tx-003'));

      expect(
        screen.getByText(messages.perpsFundingRate.message),
      ).toBeInTheDocument();
      expect(screen.getByText(messages.amount.message)).toBeInTheDocument();
      expect(screen.getByText('+8.30')).toBeInTheDocument();
    });

    it('renders a positive funding amount in the success color', () => {
      renderWithTransaction(findTransaction('tx-003'));

      expect(screen.getByText('+8.30')).toHaveClass('text-success-default');
    });
  });

  describe('rows rendered via the shared details Row component', () => {
    it('uses the shared transaction-breakdown-row testid and collapses empty values', () => {
      renderWithTransaction(findTransaction('tx-004'));

      expect(
        screen.getAllByTestId('transaction-breakdown-row').length,
      ).toBeGreaterThan(0);
    });
  });
});
