import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import { submitRequestToBackground } from '../../store/background-connection';

jest.mock('@metamask/perps-controller', () => ({
  PERPS_ERROR_CODES: {
    ORDER_REJECTED: 'ORDER_REJECTED',
    INSUFFICIENT_MARGIN: 'INSUFFICIENT_MARGIN',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    SLIPPAGE_EXCEEDED: 'SLIPPAGE_EXCEEDED',
    BATCH_CANCEL_FAILED: 'BATCH_CANCEL_FAILED',
  },
}));

const mockUseNavigate = jest.fn();
const mockUseParams = jest.fn(() => ({ symbol: 'BTC' }));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
  useParams: () => mockUseParams(),
  Navigate: ({ to }: { to: string }) => (
    <div data-testid="navigate" data-to={to} />
  ),
}));

jest.mock('../../../shared/lib/selectors/accounts', () => ({
  getSelectedInternalAccount: () => ({ address: '0x123' }),
}));

jest.mock('../../selectors/perps/feature-flags', () => ({
  getIsPerpsExperienceAvailable: () => true,
}));

jest.mock('../../selectors/perps-controller', () => ({
  selectPerpsIsTestnet: () => false,
  selectPerpsTradeConfigurations: () => ({ mainnet: {}, testnet: {} }),
  selectPerpsIsWatchlistMarket: () => false,
}));

const mockUsePerpsEligibility = jest.fn(() => ({ isEligible: true }));
jest.mock('../../hooks/perps', () => ({
  usePerpsEligibility: () => mockUsePerpsEligibility(),
  usePerpsEventTracking: () => ({ track: jest.fn() }),
  usePerpsMarketInfo: () => ({ szDecimals: 4 }),
}));

jest.mock('../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatPercentWithMinThreshold: (value: number) => `${value.toFixed(2)}%`,
  }),
}));

const mockMarkets = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: '$45,000.00',
    change24hPercent: '1.00%',
    maxLeverage: '50x',
    volume: '$1B',
    openInterest: '$500M',
    fundingRate: 0.0001,
  },
];
const mockOrderBook = {
  bids: [{ price: '44900', size: '1', total: '1', notional: '44900' }],
  asks: [{ price: '45100', size: '1', total: '1', notional: '45100' }],
  spread: '200',
  spreadPercentage: '0.004',
  midPrice: '45000',
  maxTotal: '1',
};
let mockPositions: unknown[] = [];
let mockOrders: unknown[] = [];
const mockReplacePerpsToastByKey = jest.fn();

jest.mock('../../hooks/perps/stream', () => ({
  usePerpsLivePositions: () => ({ positions: mockPositions }),
  usePerpsLiveOrders: () => ({ orders: mockOrders }),
  usePerpsLiveAccount: () => ({
    account: { availableBalance: '1000', withdrawableBalance: '1000' },
  }),
  usePerpsLiveMarketData: () => ({
    markets: mockMarkets,
    isInitialLoading: false,
  }),
  usePerpsLiveCandles: () => ({
    candleData: {
      candles: [{ close: '45000', time: 1, open: '1', high: '1', low: '1' }],
    },
    isInitialLoading: false,
    fetchMoreHistory: jest.fn(),
  }),
  usePerpsLiveOrderBook: () => ({
    orderBook: mockOrderBook,
    isInitialLoading: false,
  }),
  usePerpsLivePrices: () => ({
    prices: {
      BTC: {
        symbol: 'BTC',
        price: '45000',
        percentChange24h: '1.00%',
        markPrice: '45001',
      },
    },
  }),
}));

jest.mock('../../providers/perps', () => ({
  getPerpsStreamManager: () => ({
    prices: {
      subscribe: jest.fn(() => jest.fn()),
    },
  }),
}));

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../../components/app/perps/perps-candlestick-chart', () => ({
  PerpsCandlestickChart: jest
    .requireActual<typeof import('react')>('react')
    .forwardRef(() => <div data-testid="perps-expanded-chart" />),
}));

jest.mock('../../components/app/perps/perps-candle-period-selector', () => ({
  PerpsCandlePeriodSelector: () => (
    <div data-testid="perps-candle-period-selector" />
  ),
}));

jest.mock('../../components/app/perps/perps-order-book', () => ({
  PerpsOrderBook: ({
    onPriceClick,
  }: {
    onPriceClick: (arg: unknown) => void;
  }) => (
    <button
      type="button"
      data-testid="mock-order-book-price"
      onClick={() => onPriceClick({ price: '44900', side: 'bid' })}
    >
      order book
    </button>
  ),
}));

jest.mock('../../components/app/perps/order-entry', () => ({
  formStateToOrderParams: (
    formState: {
      asset: string;
      direction: 'long' | 'short';
      amount: string;
      leverage: number;
      type: 'market' | 'limit';
      limitPrice?: string;
    },
    currentPrice: number,
  ) => {
    const cleanAmount = formState.amount.replaceAll(',', '');
    const marginAmount = Number.parseFloat(cleanAmount) || 0;

    return {
      symbol: formState.asset,
      isBuy: formState.direction === 'long',
      size:
        currentPrice > 0
          ? ((marginAmount * formState.leverage) / currentPrice).toString()
          : '0',
      orderType: formState.type,
      leverage: formState.leverage,
      currentPrice,
      usdAmount: cleanAmount,
      ...(formState.type === 'limit' && formState.limitPrice
        ? { price: formState.limitPrice.replaceAll(',', '') }
        : {}),
    };
  },
  DirectionTabs: ({
    direction,
    onDirectionChange,
  }: {
    direction: 'long' | 'short';
    onDirectionChange: (direction: 'long' | 'short') => void;
  }) => (
    <div data-testid="direction-tabs">
      <button type="button" onClick={() => onDirectionChange('long')}>
        Long {direction === 'long' ? 'selected' : ''}
      </button>
      <button type="button" onClick={() => onDirectionChange('short')}>
        Short {direction === 'short' ? 'selected' : ''}
      </button>
    </div>
  ),
  OrderEntry: ({
    initialDirection,
    mode,
    existingPosition,
    orderType,
    prefillLimitPrice,
    onSubmit,
  }: {
    initialDirection: 'long' | 'short';
    mode: 'new' | 'modify' | 'close';
    existingPosition?: { size: string };
    orderType: 'market' | 'limit';
    prefillLimitPrice?: { price: string };
    onSubmit: (formState: Record<string, unknown>) => void;
  }) => (
    <div
      data-testid="mock-order-entry"
      data-direction={initialDirection}
      data-mode={mode}
      data-existing-size={existingPosition?.size ?? ''}
      data-order-type={orderType}
      data-prefill={prefillLimitPrice?.price ?? ''}
    >
      <button
        type="button"
        data-testid="mock-submit-order"
        onClick={() =>
          onSubmit({
            asset: 'BTC',
            direction: initialDirection,
            amount: '1000',
            leverage: 3,
            type: orderType,
            limitPrice: prefillLimitPrice?.price ?? '',
            autoCloseEnabled: false,
            takeProfitPrice: '',
            stopLossPrice: '',
          })
        }
      >
        submit
      </button>
    </div>
  ),
}));

jest.mock('../../components/app/perps', () => ({
  usePerpsToast: () => ({ replacePerpsToastByKey: mockReplacePerpsToastByKey }),
}));

jest.mock('../../components/app/perps/edit-margin', () => ({
  EditMarginModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="perps-add-margin-modal" /> : null,
}));

jest.mock('../../components/app/perps/reverse-position', () => ({
  ReversePositionModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="perps-reverse-position-modal" /> : null,
}));

jest.mock('../../components/app/perps/update-tpsl', () => ({
  UpdateTPSLModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="perps-update-tpsl-modal" /> : null,
}));

jest.mock('../../components/app/perps/close-position', () => ({
  ClosePositionModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="perps-close-position-modal" /> : null,
}));

jest.mock('../../components/app/perps/cancel-order', () => ({
  CancelOrderModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="perps-cancel-order-modal" /> : null,
}));

jest.mock('../../components/app/perps/perps-toast', () => ({
  PERPS_TOAST_KEYS: {
    SUBMIT_IN_PROGRESS: 'SUBMIT_IN_PROGRESS',
    ORDER_PLACED: 'ORDER_PLACED',
    ORDER_SUBMITTED: 'ORDER_SUBMITTED',
    ORDER_FAILED: 'ORDER_FAILED',
  },
}));

jest.mock('../../components/app/perps/perps-geo-block-modal', () => ({
  PerpsGeoBlockModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="perps-geo-block-modal" /> : null,
}));

// eslint-disable-next-line import-x/first
import PerpsMarketExpandedPage from './perps-market-expanded-page';

const mockStore = configureMockStore([thunk]);

const renderPage = () =>
  renderWithProvider(
    <PerpsMarketExpandedPage />,
    mockStore({ metamask: { ...mockState.metamask } }),
  );

describe('PerpsMarketExpandedPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePerpsEligibility.mockReturnValue({ isEligible: true });
    mockPositions = [];
    mockOrders = [];
  });

  it('renders the expanded trading surface with long/short tabs', () => {
    renderPage();

    expect(screen.getByTestId('perps-expanded-header')).toBeInTheDocument();
    expect(screen.getByTestId('perps-expanded-chart')).toBeInTheDocument();
    expect(screen.getByTestId('direction-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('mock-order-entry')).toHaveAttribute(
      'data-direction',
      'long',
    );
  });

  it('submits short orders with isBuy false', async () => {
    renderPage();

    fireEvent.click(screen.getByText(/Short/u));
    fireEvent.click(screen.getByTestId('mock-submit-order'));

    await waitFor(() =>
      expect(submitRequestToBackground).toHaveBeenCalledWith(
        'perpsPlaceOrder',
        [
          expect.objectContaining({
            isBuy: false,
          }),
        ],
      ),
    );
  });

  it('auto-hides the market order submitted toast after replacing progress', async () => {
    renderPage();

    fireEvent.click(screen.getByTestId('mock-submit-order'));

    await waitFor(() =>
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
        key: 'ORDER_SUBMITTED',
        autoHideTime: 3000,
      }),
    );
    expect(mockReplacePerpsToastByKey.mock.calls[0][0]).toStrictEqual({
      key: 'SUBMIT_IN_PROGRESS',
    });
    expect(mockReplacePerpsToastByKey.mock.calls.at(-1)?.[0]).toStrictEqual({
      key: 'ORDER_SUBMITTED',
      autoHideTime: 3000,
    });
  });

  it('keeps limit order placed toast behavior unchanged', async () => {
    renderPage();

    fireEvent.click(screen.getByTestId('mock-order-book-price'));
    fireEvent.click(screen.getByTestId('mock-submit-order'));

    await waitFor(() =>
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
        key: 'ORDER_PLACED',
      }),
    );
  });

  it('replaces progress toast with failure toast when order submission fails', async () => {
    (submitRequestToBackground as jest.Mock).mockImplementation((method) => {
      if (method === 'perpsPlaceOrder') {
        return Promise.resolve({ success: false, error: 'Order failed' });
      }

      return Promise.resolve({ success: true });
    });

    renderPage();

    fireEvent.click(screen.getByTestId('mock-submit-order'));

    await waitFor(() =>
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'ORDER_FAILED',
        }),
      ),
    );
    expect(mockReplacePerpsToastByKey.mock.calls[0][0]).toStrictEqual({
      key: 'SUBMIT_IN_PROGRESS',
    });
  });

  it('prefills a limit price from the order book without changing direction', () => {
    renderPage();

    fireEvent.click(screen.getByText(/Short/u));
    fireEvent.click(screen.getByTestId('mock-order-book-price'));

    expect(screen.getByTestId('mock-order-entry')).toHaveAttribute(
      'data-direction',
      'short',
    );
    expect(screen.getByTestId('mock-order-entry')).toHaveAttribute(
      'data-order-type',
      'limit',
    );
    expect(screen.getByTestId('mock-order-entry')).toHaveAttribute(
      'data-prefill',
      '44900',
    );
  });

  it('uses manage-position ticket behavior when the active market has a position', () => {
    mockPositions = [
      {
        symbol: 'BTC',
        size: '-0.5',
        leverage: { type: 'isolated', value: 3 },
        entryPrice: '$44,000.00',
        positionValue: '$22,500.00',
        marginUsed: '$7,500.00',
        unrealizedPnl: '125.50',
        returnOnEquity: '1.5',
      },
    ];
    renderPage();

    expect(screen.queryByTestId('direction-tabs')).not.toBeInTheDocument();
    expect(screen.getByTestId('mock-order-entry')).toHaveAttribute(
      'data-mode',
      'modify',
    );
    expect(screen.getByTestId('mock-order-entry')).toHaveAttribute(
      'data-direction',
      'short',
    );
    expect(screen.getByTestId('mock-order-entry')).toHaveAttribute(
      'data-existing-size',
      '-0.5',
    );

    fireEvent.click(screen.getByTestId('mock-order-book-price'));
    expect(screen.getByTestId('mock-order-entry')).toHaveAttribute(
      'data-order-type',
      'limit',
    );
    expect(screen.getByTestId('mock-order-entry')).toHaveAttribute(
      'data-prefill',
      '44900',
    );
  });

  it('geo-blocks trade submission and order-book trade prep', () => {
    mockUsePerpsEligibility.mockReturnValue({ isEligible: false });
    renderPage();

    fireEvent.click(screen.getByTestId('mock-submit-order'));
    expect(screen.getByTestId('perps-geo-block-modal')).toBeInTheDocument();
    expect(submitRequestToBackground).not.toHaveBeenCalledWith(
      'perpsPlaceOrder',
      expect.anything(),
    );

    fireEvent.click(screen.getByTestId('mock-order-book-price'));
    expect(screen.getByTestId('perps-geo-block-modal')).toBeInTheDocument();
  });

  it('renders actionable position rows without duplicate section titles', () => {
    mockPositions = [
      {
        symbol: 'BTC',
        size: '0.5',
        leverage: { type: 'isolated', value: 3 },
        entryPrice: '$44,000.00',
        positionValue: '$22,500.00',
        marginUsed: '$7,500.00',
        unrealizedPnl: '125.50',
        returnOnEquity: '1.5',
      },
    ];
    renderPage();

    expect(
      screen.getByTestId('perps-expanded-position-row-BTC'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('perps-expanded-position-pnl-BTC'),
    ).toHaveTextContent('+$125.50');
    expect(screen.getAllByText('Positions')).toHaveLength(1);

    fireEvent.click(
      screen.getByTestId('perps-expanded-position-tpsl-edit-BTC'),
    );
    expect(screen.getByTestId('perps-update-tpsl-modal')).toBeInTheDocument();

    fireEvent.click(
      screen.getByTestId('perps-expanded-position-margin-edit-BTC'),
    );
    expect(screen.getByTestId('perps-add-margin-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('perps-expanded-position-reverse-BTC'));
    expect(
      screen.getByTestId('perps-reverse-position-modal'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('perps-expanded-position-close-BTC'));
    expect(
      screen.getByTestId('perps-close-position-modal'),
    ).toBeInTheDocument();
  });

  it('geo-blocks expanded position actions', () => {
    mockUsePerpsEligibility.mockReturnValue({ isEligible: false });
    mockPositions = [
      {
        symbol: 'BTC',
        size: '0.5',
        leverage: { type: 'isolated', value: 3 },
        entryPrice: '$44,000.00',
        positionValue: '$22,500.00',
        marginUsed: '$7,500.00',
        unrealizedPnl: '125.50',
        returnOnEquity: '1.5',
      },
    ];
    renderPage();

    fireEvent.click(screen.getByTestId('perps-expanded-position-close-BTC'));

    expect(screen.getByTestId('perps-geo-block-modal')).toBeInTheDocument();
    expect(
      screen.queryByTestId('perps-close-position-modal'),
    ).not.toBeInTheDocument();
  });

  it('geo-blocks positioned ticket close and reverse actions', () => {
    mockUsePerpsEligibility.mockReturnValue({ isEligible: false });
    mockPositions = [
      {
        symbol: 'BTC',
        size: '0.5',
        leverage: { type: 'isolated', value: 3 },
        entryPrice: '$44,000.00',
        positionValue: '$22,500.00',
        marginUsed: '$7,500.00',
        unrealizedPnl: '125.50',
        returnOnEquity: '1.5',
      },
    ];
    renderPage();

    fireEvent.click(
      screen.getByTestId('perps-expanded-ticket-reverse-position'),
    );
    fireEvent.click(screen.getByTestId('perps-expanded-ticket-close-position'));

    expect(screen.getByTestId('perps-geo-block-modal')).toBeInTheDocument();
    expect(
      screen.queryByTestId('perps-reverse-position-modal'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('perps-close-position-modal'),
    ).not.toBeInTheDocument();
  });
});
