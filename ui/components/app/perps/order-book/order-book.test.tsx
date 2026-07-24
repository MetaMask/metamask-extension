import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { usePerpsLiveOrderBook } from '../../../../hooks/perps/stream';
import { PerpsOrderBook } from './order-book';

jest.mock('../../../../hooks/perps/stream', () => ({
  usePerpsLiveOrderBook: jest.fn(),
}));

const mockUsePerpsLiveOrderBook = jest.mocked(usePerpsLiveOrderBook);

const mockOrderBook = {
  bids: [
    {
      price: '73775',
      size: '0.04',
      total: '0.04',
      notional: '2967',
      totalNotional: '2967',
    },
    {
      price: '73765',
      size: '0.28',
      total: '0.32',
      notional: '20584',
      totalNotional: '23551',
    },
  ],
  asks: [
    {
      price: '73777',
      size: '0.5',
      total: '0.5',
      notional: '43393',
      totalNotional: '43393',
    },
    {
      price: '73788',
      size: '0.12',
      total: '0.62',
      notional: '9321',
      totalNotional: '52714',
    },
  ],
  spread: '2',
  spreadPercentage: '0.0027',
  midPrice: '73776',
  lastUpdated: 123,
  maxTotal: '0.62',
};

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

function renderOrderBook(props?: {
  isOpen?: boolean;
  marketPrice?: number;
  onSelectPrice?: (price: string) => void;
}) {
  return renderWithProvider(
    <PerpsOrderBook
      symbol="BTC"
      isOpen={props?.isOpen ?? true}
      marketPrice={props?.marketPrice ?? 73776}
      onSelectPrice={props?.onSelectPrice}
    />,
    mockStore,
  );
}

describe('PerpsOrderBook', () => {
  beforeEach(() => {
    mockUsePerpsLiveOrderBook.mockReturnValue({
      orderBook: mockOrderBook,
      isInitialLoading: false,
      connectionStatus: 'connected',
      reconnect: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loading and empty states', () => {
    it('renders a ladder skeleton while waiting for the first update', () => {
      mockUsePerpsLiveOrderBook.mockReturnValue({
        orderBook: null,
        isInitialLoading: true,
        connectionStatus: 'connecting',
        reconnect: jest.fn(),
      });

      renderOrderBook();

      expect(
        screen.getByTestId('perps-order-book-skeleton'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsOrderBookLoading.message),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(messages.perpsOrderBookNoData.message),
      ).not.toBeInTheDocument();
    });

    it('renders the empty state when there is no data', () => {
      mockUsePerpsLiveOrderBook.mockReturnValue({
        orderBook: null,
        isInitialLoading: false,
        connectionStatus: 'connected',
        reconnect: jest.fn(),
      });

      renderOrderBook();

      expect(
        screen.getByText(messages.perpsOrderBookNoData.message),
      ).toBeInTheDocument();
    });
  });

  describe('connection error state', () => {
    it('renders the connection-lost message and a reconnect button on error', () => {
      mockUsePerpsLiveOrderBook.mockReturnValue({
        orderBook: null,
        isInitialLoading: false,
        connectionStatus: 'error',
        reconnect: jest.fn(),
      });

      renderOrderBook();

      expect(
        screen.getByText(messages.perpsOrderBookConnectionError.message),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('perps-order-book-reconnect'),
      ).toBeInTheDocument();
    });

    it('calls reconnect when the reconnect button is clicked', () => {
      const reconnect = jest.fn();
      mockUsePerpsLiveOrderBook.mockReturnValue({
        orderBook: null,
        isInitialLoading: false,
        connectionStatus: 'error',
        reconnect,
      });

      renderOrderBook();

      fireEvent.click(screen.getByTestId('perps-order-book-reconnect'));

      expect(reconnect).toHaveBeenCalledTimes(1);
    });

    it('prioritizes the error state over available ladder data', () => {
      mockUsePerpsLiveOrderBook.mockReturnValue({
        orderBook: mockOrderBook,
        isInitialLoading: false,
        connectionStatus: 'error',
        reconnect: jest.fn(),
      });

      renderOrderBook();

      expect(
        screen.getByTestId('perps-order-book-connection-error'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('perps-order-book-ask-row-0'),
      ).not.toBeInTheDocument();
    });

    it('hides a cached ladder and blocks price selection while reconnecting', () => {
      // Automatic SDK reconnect emits `connecting` without clearing the book.
      // Stale pre-disconnect rows must not stay visible or clickable.
      const onSelectPrice = jest.fn();
      mockUsePerpsLiveOrderBook.mockReturnValue({
        orderBook: mockOrderBook,
        isInitialLoading: false,
        connectionStatus: 'connecting',
        reconnect: jest.fn(),
      });

      renderOrderBook({ marketPrice: 73776, onSelectPrice });

      expect(
        screen.getByTestId('perps-order-book-reconnecting'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsOrderBookReconnecting.message),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('perps-order-book-ask-row-0'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('perps-order-book-bid-row-0'),
      ).not.toBeInTheDocument();
      expect(onSelectPrice).not.toHaveBeenCalled();
    });
  });

  describe('rendering', () => {
    it('renders the column headers with the default metric and currency', () => {
      renderOrderBook();

      expect(
        screen.getByText(messages.perpsOrderBookPrice.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(`${messages.perpsOrderBookTotal.message} (USD)`),
      ).toBeInTheDocument();
    });

    it('renders the server-aggregated bid/ask prices with the default USD total metric', () => {
      renderOrderBook({ marketPrice: 73776 });

      // The stream is aggregated server-side, so rows render the book's own
      // prices verbatim (no client-side bucketing). The highest ask (73788)
      // renders at the top of the ladder (row 0).
      const topAsk = screen.getByTestId('perps-order-book-ask-row-0');
      expect(topAsk).toHaveTextContent('73,788');
      // Value column shows the cumulative USD notional (43,393 + 9,321 =
      // 52,714) in compact form.
      expect(
        screen.getByTestId('perps-order-book-ask-row-0-value'),
      ).toHaveTextContent('$53K');

      const topBid = screen.getByTestId('perps-order-book-bid-row-0');
      expect(topBid).toHaveTextContent('73,775');
      // Best bid cumulative notional is 2,967 (below the compact threshold) so
      // it renders as a full fiat amount.
      expect(
        screen.getByTestId('perps-order-book-bid-row-0-value'),
      ).toHaveTextContent('$2,967');
    });

    it('renders the compact spread row with a percentage', () => {
      renderOrderBook({ marketPrice: 73776 });

      const spread = screen.getByTestId('perps-order-book-spread');
      expect(spread).toHaveTextContent(messages.perpsOrderBookSpread.message);
      // spread 2, spreadPercentage 0.0027 → "$2.00 (0.003%)".
      expect(spread).toHaveTextContent('0.003%');
      // The prominent mid price is no longer shown in the spread row.
      expect(spread).not.toHaveTextContent('73,776');
    });

    it('renders the buy/sell depth ratio summing to 100%', () => {
      renderOrderBook({ marketPrice: 73776 });

      const ratio = screen.getByTestId('perps-order-book-ratio');
      // bid depth 0.32 / (0.32 + 0.62) => 34% buy, 66% sell.
      expect(ratio).toHaveTextContent('34%');
      expect(ratio).toHaveTextContent('66%');
    });

    it('does not render the removed order book title', () => {
      renderOrderBook();

      expect(
        screen.queryByText(messages.perpsOrderBook.message),
      ).not.toBeInTheDocument();
    });
  });

  describe('config modal', () => {
    it('opens the config modal from the grouping trigger', () => {
      renderOrderBook();

      fireEvent.click(screen.getByTestId('perps-order-book-grouping-trigger'));

      expect(
        screen.getByText(messages.perpsOrderBookConfigTitle.message),
      ).toBeInTheDocument();
    });

    it('closes the config modal from the close button', () => {
      renderOrderBook();

      fireEvent.click(screen.getByTestId('perps-order-book-grouping-trigger'));
      expect(
        screen.getByText(messages.perpsOrderBookConfigTitle.message),
      ).toBeInTheDocument();

      fireEvent.click(
        screen.getByTestId('perps-order-book-config-modal-close'),
      );

      expect(
        screen.queryByText(messages.perpsOrderBookConfigTitle.message),
      ).not.toBeInTheDocument();
    });

    it('applies a new currency to the metric column header', () => {
      renderOrderBook();

      expect(
        screen.getByText(`${messages.perpsOrderBookTotal.message} (USD)`),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('perps-order-book-grouping-trigger'));
      fireEvent.click(
        screen.getByTestId('perps-order-book-config-modal-currency-base'),
      );
      fireEvent.click(
        screen.getByTestId('perps-order-book-config-modal-apply'),
      );

      expect(
        screen.getByText(`${messages.perpsOrderBookTotal.message} (BTC)`),
      ).toBeInTheDocument();
    });

    it('keeps the applied grouping selected when the modal is reopened', () => {
      renderOrderBook();

      fireEvent.click(screen.getByTestId('perps-order-book-grouping-trigger'));
      fireEvent.click(
        screen.getByTestId('perps-order-book-config-modal-grouping-1'),
      );
      fireEvent.click(
        screen.getByTestId('perps-order-book-config-modal-apply'),
      );

      fireEvent.click(screen.getByTestId('perps-order-book-grouping-trigger'));
      expect(
        screen.getByTestId('perps-order-book-config-modal-grouping-1'),
      ).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('view toggle', () => {
    it('cycles both sides -> buy only -> sell only -> both', () => {
      renderOrderBook({ marketPrice: 73776 });

      // Default: both sides render.
      expect(
        screen.getByTestId('perps-order-book-ask-row-0'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('perps-order-book-bid-row-0'),
      ).toBeInTheDocument();

      const toggle = screen.getByTestId('perps-order-book-view-toggle');
      expect(toggle).toHaveAccessibleName(
        messages.perpsOrderBookViewModeBoth.message,
      );

      // First click: buy side only (bids, no asks).
      fireEvent.click(toggle);
      expect(
        screen.queryByTestId('perps-order-book-ask-row-0'),
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId('perps-order-book-bid-row-0'),
      ).toBeInTheDocument();
      expect(toggle).toHaveAccessibleName(
        messages.perpsOrderBookViewModeBuy.message,
      );

      // Second click: sell side only (asks, no bids).
      fireEvent.click(toggle);
      expect(
        screen.getByTestId('perps-order-book-ask-row-0'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('perps-order-book-bid-row-0'),
      ).not.toBeInTheDocument();
      expect(toggle).toHaveAccessibleName(
        messages.perpsOrderBookViewModeSell.message,
      );

      // Third click: back to both sides.
      fireEvent.click(toggle);
      expect(
        screen.getByTestId('perps-order-book-ask-row-0'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('perps-order-book-bid-row-0'),
      ).toBeInTheDocument();
      expect(toggle).toHaveAccessibleName(
        messages.perpsOrderBookViewModeBoth.message,
      );
    });
  });

  describe('price selection', () => {
    it('calls onSelectPrice with the ask row price when clicked', () => {
      const onSelectPrice = jest.fn();
      renderOrderBook({ marketPrice: 73776, onSelectPrice });

      // Top ask row is the highest ask (73788).
      fireEvent.click(screen.getByTestId('perps-order-book-ask-row-0'));

      expect(onSelectPrice).toHaveBeenCalledWith('73788');
    });

    it('calls onSelectPrice with the bid row price when clicked', () => {
      const onSelectPrice = jest.fn();
      renderOrderBook({ marketPrice: 73776, onSelectPrice });

      // Best bid row is the highest bid (73775).
      fireEvent.click(screen.getByTestId('perps-order-book-bid-row-0'));

      expect(onSelectPrice).toHaveBeenCalledWith('73775');
    });

    it('selects a price via keyboard (Enter)', () => {
      const onSelectPrice = jest.fn();
      renderOrderBook({ marketPrice: 73776, onSelectPrice });

      const row = screen.getByTestId('perps-order-book-ask-row-0');
      expect(row).toHaveAttribute('role', 'button');
      fireEvent.keyDown(row, { key: 'Enter' });

      expect(onSelectPrice).toHaveBeenCalledWith('73788');
    });

    it('renders non-interactive rows when onSelectPrice is not provided', () => {
      renderOrderBook({ marketPrice: 73776 });

      const row = screen.getByTestId('perps-order-book-ask-row-0');
      expect(row).not.toHaveAttribute('role', 'button');
      expect(row).not.toHaveAttribute('tabindex');
    });
  });

  describe('stream lifecycle', () => {
    it('reads the raw shared channel without managing the stream', () => {
      renderOrderBook({ isOpen: true });

      // The raw channel (for precise mid/spread) is read-only here.
      expect(mockUsePerpsLiveOrderBook).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol: 'BTC',
          manageStream: false,
          enabled: true,
        }),
      );
    });

    it('owns a dedicated server-aggregated stream with grouping-derived params', () => {
      // BTC ~$73,776 with default grouping (10) → nSigFigs 4 (~$10 steps).
      renderOrderBook({ isOpen: true, marketPrice: 73776 });

      expect(mockUsePerpsLiveOrderBook).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol: 'BTC',
          channel: 'orderBookAggregated',
          enabled: true,
          levels: 5,
          nSigFigs: 4,
        }),
      );
    });

    it('re-derives aggregation params when the grouping changes', () => {
      renderOrderBook({ isOpen: true, marketPrice: 73776 });

      // Switch to the finest grouping (1) → full precision nSigFigs 5.
      fireEvent.click(screen.getByTestId('perps-order-book-grouping-trigger'));
      fireEvent.click(
        screen.getByTestId('perps-order-book-config-modal-grouping-1'),
      );
      fireEvent.click(
        screen.getByTestId('perps-order-book-config-modal-apply'),
      );

      expect(mockUsePerpsLiveOrderBook).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'orderBookAggregated',
          nSigFigs: 5,
        }),
      );
    });
  });
});
