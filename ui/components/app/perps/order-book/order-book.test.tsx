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
      price: '73774',
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
      price: '73778',
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
  onClose?: () => void;
}) {
  return renderWithProvider(
    <PerpsOrderBook
      symbol="BTC"
      isOpen={props?.isOpen ?? true}
      onClose={props?.onClose ?? jest.fn()}
    />,
    mockStore,
  );
}

describe('PerpsOrderBook', () => {
  beforeEach(() => {
    mockUsePerpsLiveOrderBook.mockReturnValue({
      orderBook: mockOrderBook,
      isInitialLoading: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loading and empty states', () => {
    it('renders the loading state while waiting for the first update', () => {
      mockUsePerpsLiveOrderBook.mockReturnValue({
        orderBook: null,
        isInitialLoading: true,
      });

      renderOrderBook();

      expect(
        screen.getByText(messages.perpsOrderBookLoading.message),
      ).toBeInTheDocument();
    });

    it('renders the empty state when there is no data', () => {
      mockUsePerpsLiveOrderBook.mockReturnValue({
        orderBook: null,
        isInitialLoading: false,
      });

      renderOrderBook();

      expect(
        screen.getByText(messages.perpsOrderBookNoData.message),
      ).toBeInTheDocument();
    });
  });

  describe('rendering', () => {
    it('renders the title and column headers', () => {
      renderOrderBook();

      expect(
        screen.getByText(messages.perpsOrderBook.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsOrderBookPrice.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(`${messages.perpsOrderBookTotal.message} (USD)`),
      ).toBeInTheDocument();
    });

    it('renders ask, bid and spread rows', () => {
      renderOrderBook();

      expect(screen.getByTestId('perps-order-book-ask-0')).toBeInTheDocument();
      expect(screen.getByTestId('perps-order-book-ask-1')).toBeInTheDocument();
      expect(screen.getByTestId('perps-order-book-bid-0')).toBeInTheDocument();
      expect(screen.getByTestId('perps-order-book-bid-1')).toBeInTheDocument();
      expect(screen.getByTestId('perps-order-book-spread')).toBeInTheDocument();
    });
  });

  describe('unit toggle', () => {
    it('switches the total column unit label to the base asset', () => {
      renderOrderBook();

      expect(
        screen.getByText(`${messages.perpsOrderBookTotal.message} (USD)`),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('perps-order-book-unit-base'));

      expect(
        screen.getByText(`${messages.perpsOrderBookTotal.message} (BTC)`),
      ).toBeInTheDocument();
    });
  });

  describe('closing', () => {
    it('calls onClose when the close button is clicked', () => {
      const onClose = jest.fn();
      renderOrderBook({ onClose });

      fireEvent.click(screen.getByTestId('perps-order-book-close'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('stream lifecycle', () => {
    it('reads from the shared channel without managing the stream', () => {
      renderOrderBook({ isOpen: true });

      expect(mockUsePerpsLiveOrderBook).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol: 'BTC',
          manageStream: false,
          enabled: true,
        }),
      );
    });
  });
});
