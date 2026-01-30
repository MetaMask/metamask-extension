import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { OrderEntry } from './order-entry';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('OrderEntry', () => {
  const defaultProps = {
    asset: 'BTC',
    currentPrice: 45250.0,
    maxLeverage: 20,
    availableBalance: 10000.0,
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the component with all sections', () => {
      renderWithProvider(<OrderEntry {...defaultProps} />, mockStore);

      expect(screen.getByTestId('order-entry')).toBeInTheDocument();
      expect(screen.getByText('Order Amount')).toBeInTheDocument();
      expect(screen.getByTestId('amount-input-field')).toBeInTheDocument();
      expect(screen.getByTestId('leverage-slider')).toBeInTheDocument();
      expect(screen.getByText('Margin')).toBeInTheDocument();
      expect(screen.getByText('Fees')).toBeInTheDocument();
      expect(screen.getByText('Liquidation Price Est.')).toBeInTheDocument();
      expect(screen.getByTestId('auto-close-toggle')).toBeInTheDocument();
      expect(
        screen.getByTestId('order-entry-submit-button'),
      ).toBeInTheDocument();
    });

    it('displays available balance', () => {
      renderWithProvider(<OrderEntry {...defaultProps} />, mockStore);

      expect(screen.getByText('$10,000.00')).toBeInTheDocument();
    });

    it('displays correct submit button text for long direction', () => {
      renderWithProvider(<OrderEntry {...defaultProps} />, mockStore);

      expect(screen.getByTestId('order-entry-submit-button')).toHaveTextContent(
        'Open Long BTC',
      );
    });

    it('respects initialDirection prop for short', () => {
      renderWithProvider(
        <OrderEntry {...defaultProps} initialDirection="short" />,
        mockStore,
      );

      expect(screen.getByTestId('order-entry-submit-button')).toHaveTextContent(
        'Open Short BTC',
      );
    });
  });

  describe('amount input', () => {
    it('allows entering amount', () => {
      renderWithProvider(<OrderEntry {...defaultProps} />, mockStore);

      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '1000' },
      });

      expect(input).toHaveValue('1000');
    });

    it('shows token conversion when amount is entered', () => {
      renderWithProvider(<OrderEntry {...defaultProps} />, mockStore);

      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '45250' },
      });

      // $45250 / $45250 = 1 BTC - real formatter uses compact format
      expect(screen.getByText(/≈.*1.*BTC/u)).toBeInTheDocument();
    });
  });

  describe('leverage slider', () => {
    it('defaults to 1x leverage', () => {
      renderWithProvider(<OrderEntry {...defaultProps} />, mockStore);

      expect(screen.getByText('1x')).toBeInTheDocument();
    });
  });

  describe('order summary', () => {
    it('shows dash when no amount entered', () => {
      renderWithProvider(<OrderEntry {...defaultProps} />, mockStore);

      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThanOrEqual(3);
    });

    it('calculates values when amount is entered', () => {
      renderWithProvider(<OrderEntry {...defaultProps} />, mockStore);

      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '1000' },
      });

      // Should show calculated margin (1000 / 1 leverage = $1000)
      expect(screen.getByText('$1,000.00')).toBeInTheDocument();
      // Should show calculated fees (0.05% of 1000 = $0.50)
      expect(screen.getByText('$0.50')).toBeInTheDocument();
    });
  });

  describe('auto close section', () => {
    it('is collapsed by default', () => {
      renderWithProvider(<OrderEntry {...defaultProps} />, mockStore);

      expect(screen.queryByTestId('tp-price-input')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sl-price-input')).not.toBeInTheDocument();
    });

    it('renders the toggle button', () => {
      renderWithProvider(<OrderEntry {...defaultProps} />, mockStore);

      expect(screen.getByTestId('auto-close-toggle')).toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('calls onSubmit with form state when submit button is clicked', () => {
      const onSubmit = jest.fn();
      renderWithProvider(
        <OrderEntry {...defaultProps} onSubmit={onSubmit} />,
        mockStore,
      );

      const submitButton = screen.getByTestId('order-entry-submit-button');
      fireEvent.click(submitButton);

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          asset: 'BTC',
          direction: 'long',
          type: 'market',
        }),
      );
    });
  });

  describe('modify mode', () => {
    const existingPosition = {
      size: '2.5',
      leverage: 3,
      entryPrice: '2850.00',
      takeProfitPrice: '3200.00',
      stopLossPrice: '2600.00',
    };

    it('displays modify button text', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="modify"
          existingPosition={existingPosition}
        />,
        mockStore,
      );

      expect(screen.getByTestId('order-entry-submit-button')).toHaveTextContent(
        'Modify Position',
      );
    });

    it('pre-populates leverage from existing position', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="modify"
          existingPosition={existingPosition}
        />,
        mockStore,
      );

      // Should show 3x leverage (pre-populated from existing position)
      expect(screen.getByText('3x')).toBeInTheDocument();
    });

    it('shows amount input in modify mode', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="modify"
          existingPosition={existingPosition}
        />,
        mockStore,
      );

      expect(screen.getByTestId('amount-input-field')).toBeInTheDocument();
    });

    it('shows leverage slider in modify mode', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="modify"
          existingPosition={existingPosition}
        />,
        mockStore,
      );

      expect(screen.getByTestId('leverage-slider')).toBeInTheDocument();
    });

    it('auto-expands auto-close section when TP/SL exists', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="modify"
          existingPosition={existingPosition}
        />,
        mockStore,
      );

      // Should show TP/SL inputs because existing position has TP/SL
      expect(screen.getByTestId('tp-price-input')).toBeInTheDocument();
      expect(screen.getByTestId('sl-price-input')).toBeInTheDocument();
    });
  });

  describe('close mode', () => {
    const existingPosition = {
      size: '2.5',
      leverage: 3,
      entryPrice: '2850.00',
    };

    it('displays close button text for long position', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="close"
          initialDirection="long"
          existingPosition={existingPosition}
        />,
        mockStore,
      );

      expect(screen.getByTestId('order-entry-submit-button')).toHaveTextContent(
        'Close Long',
      );
    });

    it('displays close button text for short position', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="close"
          initialDirection="short"
          existingPosition={{ ...existingPosition, size: '-2.5' }}
        />,
        mockStore,
      );

      expect(screen.getByTestId('order-entry-submit-button')).toHaveTextContent(
        'Close Short',
      );
    });

    it('shows CloseAmountSection in close mode', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="close"
          existingPosition={existingPosition}
        />,
        mockStore,
      );

      expect(screen.getByText('Position Size')).toBeInTheDocument();
      expect(screen.getByText('Close Amount')).toBeInTheDocument();
      expect(screen.getByTestId('close-amount-slider')).toBeInTheDocument();
    });

    it('hides amount input in close mode', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="close"
          existingPosition={existingPosition}
        />,
        mockStore,
      );

      expect(
        screen.queryByTestId('amount-input-field'),
      ).not.toBeInTheDocument();
    });

    it('hides leverage slider in close mode', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="close"
          existingPosition={existingPosition}
        />,
        mockStore,
      );

      expect(screen.queryByTestId('leverage-slider')).not.toBeInTheDocument();
    });

    it('hides auto-close section in close mode', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="close"
          existingPosition={existingPosition}
        />,
        mockStore,
      );

      expect(screen.queryByTestId('auto-close-toggle')).not.toBeInTheDocument();
    });

    it('defaults to 100% close', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="close"
          existingPosition={existingPosition}
        />,
        mockStore,
      );

      // Both the close amount display and the 100% preset button show "100%"
      const percentElements = screen.getAllByText(/100.*%/u);
      expect(percentElements.length).toBeGreaterThanOrEqual(1);
    });

    it('shows close percentage preset buttons', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="close"
          existingPosition={existingPosition}
        />,
        mockStore,
      );

      expect(screen.getByTestId('close-percent-preset-25')).toBeInTheDocument();
      expect(screen.getByTestId('close-percent-preset-50')).toBeInTheDocument();
      expect(screen.getByTestId('close-percent-preset-75')).toBeInTheDocument();
      expect(
        screen.getByTestId('close-percent-preset-100'),
      ).toBeInTheDocument();
    });
  });
});
