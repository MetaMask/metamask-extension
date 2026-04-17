import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { PERPS_ACTIVITY_ROUTE } from '../../../../helpers/constants/routes';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { usePerpsMarketFills } from '../../../../hooks/perps';
import { transformFillsToTransactions } from '../utils/transactionTransforms';
import { FillType, type PerpsTransaction } from '../types';
import { PERPS_CONSTANTS } from '../constants';
import { PerpsMarketRecentActivity } from './perps-market-recent-activity';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../../hooks/perps', () => ({
  usePerpsMarketFills: jest.fn(),
}));

jest.mock('../utils/transactionTransforms', () => ({
  transformFillsToTransactions: jest.fn(),
}));

const mockUsePerpsMarketFills = usePerpsMarketFills as jest.MockedFunction<
  typeof usePerpsMarketFills
>;
const mockTransformFills = transformFillsToTransactions as jest.MockedFunction<
  typeof transformFillsToTransactions
>;

const createTransaction = (
  id: string,
  overrides: Partial<PerpsTransaction> = {},
): PerpsTransaction => ({
  id,
  type: 'trade',
  category: 'position_open',
  symbol: 'BTC',
  title: 'Opened long',
  subtitle: '0.5 BTC',
  timestamp: Date.now(),
  fill: {
    shortTitle: 'Opened long',
    amount: '-$5.00',
    amountNumber: -5,
    isPositive: false,
    size: '0.5',
    entryPrice: '60000.00',
    points: '0',
    pnl: '0',
    fee: '5.00',
    action: 'Opened',
    feeToken: 'USDC',
    fillType: FillType.Standard,
  },
  ...overrides,
});

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('PerpsMarketRecentActivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading state', () => {
    it('shows skeleton placeholders when loading with no data', () => {
      mockUsePerpsMarketFills.mockReturnValue({
        fills: [],
        isInitialLoading: true,
      });
      mockTransformFills.mockReturnValue([]);

      const { container } = renderWithProvider(
        <PerpsMarketRecentActivity symbol="BTC" />,
        mockStore,
      );

      const skeletons = container.querySelectorAll('.mm-skeleton');
      expect(skeletons.length).toBe(3);
    });

    it('shows transactions instead of skeleton when loading but data is present', () => {
      const transactions = [createTransaction('tx-1')];
      mockUsePerpsMarketFills.mockReturnValue({
        fills: [],
        isInitialLoading: true,
      });
      mockTransformFills.mockReturnValue(transactions);

      renderWithProvider(<PerpsMarketRecentActivity symbol="BTC" />, mockStore);

      expect(screen.getByTestId('transaction-card-tx-1')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('shows empty message when not loading and no transactions', () => {
      mockUsePerpsMarketFills.mockReturnValue({
        fills: [],
        isInitialLoading: false,
      });
      mockTransformFills.mockReturnValue([]);

      renderWithProvider(<PerpsMarketRecentActivity symbol="BTC" />, mockStore);

      expect(
        screen.getByText(messages.perpsNoTransactions.message),
      ).toBeInTheDocument();
    });

    it('does not show "See All" button when empty', () => {
      mockUsePerpsMarketFills.mockReturnValue({
        fills: [],
        isInitialLoading: false,
      });
      mockTransformFills.mockReturnValue([]);

      renderWithProvider(<PerpsMarketRecentActivity symbol="BTC" />, mockStore);

      expect(
        screen.queryByText(messages.perpsSeeAll.message),
      ).not.toBeInTheDocument();
    });
  });

  describe('Populated state', () => {
    it('renders transaction cards', () => {
      const transactions = [
        createTransaction('tx-1'),
        createTransaction('tx-2'),
      ];
      mockUsePerpsMarketFills.mockReturnValue({
        fills: [],
        isInitialLoading: false,
      });
      mockTransformFills.mockReturnValue(transactions);

      renderWithProvider(<PerpsMarketRecentActivity symbol="BTC" />, mockStore);

      expect(screen.getByTestId('transaction-card-tx-1')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-card-tx-2')).toBeInTheDocument();
    });

    it('renders all transactions returned by the transform', () => {
      const limit = PERPS_CONSTANTS.RECENT_ACTIVITY_LIMIT;
      const transactions = Array.from({ length: limit }, (_, i) =>
        createTransaction(`tx-${i}`),
      );
      mockUsePerpsMarketFills.mockReturnValue({
        fills: [],
        isInitialLoading: false,
      });
      mockTransformFills.mockReturnValue(transactions);

      renderWithProvider(<PerpsMarketRecentActivity symbol="BTC" />, mockStore);

      for (let i = 0; i < limit; i++) {
        expect(
          screen.getByTestId(`transaction-card-tx-${i}`),
        ).toBeInTheDocument();
      }
    });

    it('shows "Recent Activity" header', () => {
      mockUsePerpsMarketFills.mockReturnValue({
        fills: [],
        isInitialLoading: false,
      });
      mockTransformFills.mockReturnValue([createTransaction('tx-1')]);

      renderWithProvider(<PerpsMarketRecentActivity symbol="BTC" />, mockStore);

      expect(
        screen.getByText(messages.perpsRecentActivity.message),
      ).toBeInTheDocument();
    });

    it('shows "See All" button when transactions exist', () => {
      mockUsePerpsMarketFills.mockReturnValue({
        fills: [],
        isInitialLoading: false,
      });
      mockTransformFills.mockReturnValue([createTransaction('tx-1')]);

      renderWithProvider(<PerpsMarketRecentActivity symbol="BTC" />, mockStore);

      expect(
        screen.getByText(messages.perpsSeeAll.message),
      ).toBeInTheDocument();
    });

    it('"See All" navigates to PERPS_ACTIVITY_ROUTE', () => {
      mockUsePerpsMarketFills.mockReturnValue({
        fills: [],
        isInitialLoading: false,
      });
      mockTransformFills.mockReturnValue([createTransaction('tx-1')]);

      renderWithProvider(<PerpsMarketRecentActivity symbol="BTC" />, mockStore);

      fireEvent.click(screen.getByText(messages.perpsSeeAll.message));
      expect(mockNavigate).toHaveBeenCalledWith(PERPS_ACTIVITY_ROUTE);
    });
  });

  describe('Hook integration', () => {
    it('passes symbol and throttleMs to usePerpsMarketFills', () => {
      mockUsePerpsMarketFills.mockReturnValue({
        fills: [],
        isInitialLoading: false,
      });
      mockTransformFills.mockReturnValue([]);

      renderWithProvider(<PerpsMarketRecentActivity symbol="ETH" />, mockStore);

      expect(mockUsePerpsMarketFills).toHaveBeenCalledWith({
        symbol: 'ETH',
        throttleMs: 0,
      });
    });

    it('transforms all fills before slicing to RECENT_ACTIVITY_LIMIT', () => {
      const limit = PERPS_CONSTANTS.RECENT_ACTIVITY_LIMIT;
      const fakeFills = Array.from({ length: limit + 2 }, (_, i) => ({
        orderId: String(i),
      })) as unknown as ReturnType<typeof usePerpsMarketFills>['fills'];
      mockUsePerpsMarketFills.mockReturnValue({
        fills: fakeFills,
        isInitialLoading: false,
      });
      const allTransactions = Array.from({ length: limit + 2 }, (_, i) =>
        createTransaction(`tx-${i}`),
      );
      mockTransformFills.mockReturnValue(allTransactions);

      renderWithProvider(<PerpsMarketRecentActivity symbol="BTC" />, mockStore);

      expect(mockTransformFills).toHaveBeenCalledWith(fakeFills);

      for (let i = 0; i < limit; i++) {
        expect(
          screen.getByTestId(`transaction-card-tx-${i}`),
        ).toBeInTheDocument();
      }
      expect(
        screen.queryByTestId(`transaction-card-tx-${limit}`),
      ).not.toBeInTheDocument();
    });
  });
});
