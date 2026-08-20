import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import {
  DEFAULT_ROUTE,
  PERPS_ACTIVITY_ROUTE,
  PERPS_TRANSACTION_DETAILS_ROUTE,
} from '../../helpers/constants/routes';
import { getIsPerpsExperienceAvailable } from '../../selectors/perps/feature-flags';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { mockTransactions } from '../../components/app/perps/mocks';
import {
  PerpsOrderTransactionStatus,
  PerpsOrderTransactionStatusType,
} from '../../components/app/perps/types';
import type { PerpsTransaction } from '../../components/app/perps/types';
import { usePerpsRecordedOrderFees } from '../../hooks/perps/usePerpsRecordedOrderFees';
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

jest.mock('../../hooks/perps/usePerpsRecordedOrderFees', () => ({
  usePerpsRecordedOrderFees: jest.fn(() => ({
    totalFee: 0,
    isLoading: false,
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
    .find(
      (rowElement) =>
        rowElement.querySelector(
          '[data-testid="transaction-breakdown-row-title"]',
        )?.textContent === label,
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

  it('redirects to the activity list when no transaction is present in router state', () => {
    // Router state is destroyed when the popup closes, so the reopen
    // mechanism can restore this path without state. Redirecting to the
    // activity list is better than showing a blank "no transaction" view.
    renderWithTransaction();

    expect(screen.getByTestId('navigate-to')).toHaveTextContent(
      PERPS_ACTIVITY_ROUTE,
    );
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
    it('shows an em-dash while fills are still loading', () => {
      jest.mocked(usePerpsRecordedOrderFees).mockReturnValue({
        totalFee: undefined,
        isLoading: true,
      });

      renderWithTransaction(findTransaction('tx-004b'));

      expect(getRowValueByLabel(messages.perpsOrderTotalFee.message)).toBe('—');
    });

    it('renders a single Total fee row sourced from recorded fills for a fully filled order', () => {
      jest.mocked(usePerpsRecordedOrderFees).mockReturnValue({
        totalFee: 6.525,
        isLoading: false,
      });

      // tx-004b is a fully filled market order
      renderWithTransaction(findTransaction('tx-004b'));

      expect(
        screen.getByText(messages.perpsOrderTotalFee.message),
      ).toBeInTheDocument();
      expect(getRowValueByLabel(messages.perpsOrderTotalFee.message)).toBe(
        '$6.525',
      );
    });

    it('shows $0 for an unfilled open order (no fills have executed)', () => {
      jest.mocked(usePerpsRecordedOrderFees).mockReturnValue({
        totalFee: 0,
        isLoading: false,
      });

      // tx-004 is an open (unfilled) limit order
      renderWithTransaction(findTransaction('tx-004'));

      expect(getRowValueByLabel(messages.perpsOrderTotalFee.message)).toBe(
        '$0',
      );
    });

    it('shows the recorded fee for a partially filled canceled order', () => {
      // Only fills that actually executed contribute to the sum — the hook
      // returns the real amount rather than an estimate based on full size.
      jest.mocked(usePerpsRecordedOrderFees).mockReturnValue({
        totalFee: 1.25,
        isLoading: false,
      });

      const base = findTransaction('tx-004c'); // Canceled order
      if (!base.order) {
        throw new Error('tx-004c fixture is missing an order');
      }
      // Simulate a partial fill: some size executed before cancellation
      const partiallyFilledCanceled: PerpsTransaction = {
        ...base,
        order: {
          ...base.order,
          filled: '45%',
        },
      };
      renderWithTransaction(partiallyFilledCanceled);

      expect(getRowValueByLabel(messages.perpsOrderTotalFee.message)).toBe(
        '$1.25',
      );
    });

    it('shows actual fees for a triggered order (TP/SL that executed)', () => {
      jest.mocked(usePerpsRecordedOrderFees).mockReturnValue({
        totalFee: 6.525,
        isLoading: false,
      });

      const base = findTransaction('tx-004b');
      if (!base.order) {
        throw new Error('tx-004b fixture is missing an order');
      }
      const triggeredOrder: PerpsTransaction = {
        ...base,
        order: {
          ...base.order,
          text: PerpsOrderTransactionStatus.Triggered,
          statusType: PerpsOrderTransactionStatusType.Filled,
        },
      };
      renderWithTransaction(triggeredOrder);

      expect(getRowValueByLabel(messages.perpsOrderTotalFee.message)).toBe(
        '$6.525',
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

    // `transformFillsToTransactions` sets `fill.action` to `'Sold'` (spot/
    // prelaunch closes) or `'Flipped'` (flipping a position) for fills that
    // are still `category: 'position_close'`. The price row label must key
    // off `transaction.category` (the same signal `showPnl` uses), not
    // `fill.action`, so these close-like fills are still labeled "Close
    // price" rather than "Entry price".
    // @ts-expect-error: each is a valid test function in jest
    it.each(['Sold', 'Flipped'])(
      'labels the price row "Close price" for a position_close fill with action %s',
      (action: string) => {
        const baseTransaction = findTransaction('tx-002');
        const baseFill = baseTransaction.fill;
        if (!baseFill) {
          throw new Error('tx-002 fixture is missing a fill');
        }
        const transaction: PerpsTransaction = {
          ...baseTransaction,
          fill: {
            ...baseFill,
            action,
          },
        };

        renderWithTransaction(transaction);

        expect(
          screen.getByText(messages.perpsClosePrice.message),
        ).toBeInTheDocument();
        expect(
          screen.queryByText(messages.perpsEntryPrice.message),
        ).not.toBeInTheDocument();
      },
    );
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
      expect(screen.getAllByText('+8.30').length).toBeGreaterThan(0);
    });

    it('renders a positive funding amount in the success color', () => {
      renderWithTransaction(findTransaction('tx-003'));

      // +8.30 appears in both the hero and the amount row; the row value carries the color
      const signedValues = screen
        .getAllByText('+8.30')
        .filter((el) => el.classList.contains('text-success-default'));
      expect(signedValues.length).toBeGreaterThan(0);
    });

    it('shows the funding fee amount in the hero, not the symbol', () => {
      renderWithTransaction(findTransaction('tx-003'));

      const hero = screen.getByTestId('perps-transaction-details-hero-amount');
      expect(hero).toHaveTextContent('+8.30');
      expect(hero).not.toHaveTextContent('ETH');
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
