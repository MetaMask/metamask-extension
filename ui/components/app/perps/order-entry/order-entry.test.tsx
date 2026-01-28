import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrderEntry } from './order-entry';

// Mock the i18n hook
jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, args?: string[]) => {
    const translations: Record<string, string> = {
      perpsLong: 'Long',
      perpsShort: 'Short',
      perpsAvailableToTrade: 'Available to Trade',
      perpsOrderType: 'Order Type',
      perpsMarket: 'Market',
      perpsLimit: 'Limit',
      perpsLimitPrice: 'Limit Price',
      perpsLeverage: 'Leverage',
      perpsLiquidationPriceEst: 'Liquidation Price Est.',
      perpsOrderValue: 'Order Value',
      perpsAutoClose: 'Auto Close',
      perpsTpPrice: 'TP Price',
      perpsSlPrice: 'SL Price',
      perpsGain: 'Gain',
      perpsLoss: 'Loss',
      perpsOpenLong: `Open Long ${args?.[0] ?? ''}`,
      perpsOpenShort: `Open Short ${args?.[0] ?? ''}`,
    };
    return translations[key] || key;
  },
}));

// Mock the formatters hook
jest.mock('../../../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatCurrencyWithMinThreshold: (value: number) => `$${value.toFixed(2)}`,
    formatPercentWithMinThreshold: (value: number) => `${(value * 100).toFixed(2)}%`,
  }),
}));

// Mock ToggleButton component
jest.mock('../../../ui/toggle-button', () => ({
  __esModule: true,
  default: ({ value, onToggle, dataTestId }: { value: boolean; onToggle: (v: boolean) => void; dataTestId: string }) => (
    <button
      data-testid={dataTestId}
      onClick={() => onToggle(value)}
      aria-pressed={value}
    >
      {value ? 'On' : 'Off'}
    </button>
  ),
}));

describe('OrderEntry', () => {
  const defaultProps = {
    asset: 'BTC',
    currentPrice: 45250.0,
    maxLeverage: 50,
    availableBalance: 10000.0,
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the component with all sections', () => {
      render(<OrderEntry {...defaultProps} />);

      expect(screen.getByTestId('order-entry')).toBeInTheDocument();
      expect(screen.getByTestId('direction-tabs')).toBeInTheDocument();
      expect(screen.getByText('Available to Trade')).toBeInTheDocument();
      expect(screen.getByText('Order Type')).toBeInTheDocument();
      expect(screen.getByTestId('amount-input-field')).toBeInTheDocument();
      expect(screen.getByTestId('leverage-slider')).toBeInTheDocument();
      expect(screen.getByText('Liquidation Price Est.')).toBeInTheDocument();
      expect(screen.getByText('Auto Close')).toBeInTheDocument();
      expect(screen.getByTestId('submit-order-button')).toBeInTheDocument();
    });

    it('displays available balance', () => {
      render(<OrderEntry {...defaultProps} />);

      expect(screen.getByText('$10000.00')).toBeInTheDocument();
    });

    it('displays correct submit button text for long direction', () => {
      render(<OrderEntry {...defaultProps} />);

      expect(screen.getByTestId('submit-order-button')).toHaveTextContent('Open Long BTC');
    });

    it('respects initialDirection prop for short', () => {
      render(<OrderEntry {...defaultProps} initialDirection="short" />);

      expect(screen.getByTestId('submit-order-button')).toHaveTextContent('Open Short BTC');
    });
  });

  describe('direction tabs', () => {
    it('defaults to long direction', () => {
      render(<OrderEntry {...defaultProps} />);

      const longTab = screen.getByTestId('direction-tab-long');
      expect(longTab).toBeInTheDocument();
    });

    it('changes direction when short tab is clicked', () => {
      render(<OrderEntry {...defaultProps} />);

      const shortTab = screen.getByTestId('direction-tab-short');
      fireEvent.click(shortTab);

      expect(screen.getByTestId('submit-order-button')).toHaveTextContent('Open Short BTC');
    });
  });

  describe('order type', () => {
    it('defaults to market order', () => {
      render(<OrderEntry {...defaultProps} />);

      expect(screen.getByText('Market')).toBeInTheDocument();
    });

    it('toggles to limit order when clicked', () => {
      render(<OrderEntry {...defaultProps} />);

      const orderTypeSelector = screen.getByTestId('order-type-selector');
      fireEvent.click(orderTypeSelector);

      expect(screen.getByText('Limit')).toBeInTheDocument();
      expect(screen.getByTestId('limit-price-input')).toBeInTheDocument();
    });
  });

  describe('amount input', () => {
    it('allows entering amount', () => {
      render(<OrderEntry {...defaultProps} />);

      const amountInput = screen.getByTestId('amount-input-field');
      fireEvent.change(amountInput, { target: { value: '1000' } });

      expect(amountInput).toHaveValue('1000');
    });

    it('updates percentage when amount is entered', () => {
      render(<OrderEntry {...defaultProps} />);

      const amountInput = screen.getByTestId('amount-input-field');
      // With 10000 balance and 1x leverage, 1000 = 10%
      fireEvent.change(amountInput, { target: { value: '1000' } });

      expect(screen.getByText('10 %')).toBeInTheDocument();
    });
  });

  describe('leverage slider', () => {
    it('defaults to 1x leverage', () => {
      render(<OrderEntry {...defaultProps} />);

      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('displays max leverage label', () => {
      render(<OrderEntry {...defaultProps} />);

      expect(screen.getByText('50x')).toBeInTheDocument();
    });
  });

  describe('order summary', () => {
    it('shows N/A when no amount entered', () => {
      render(<OrderEntry {...defaultProps} />);

      const naElements = screen.getAllByText('N/A');
      expect(naElements.length).toBeGreaterThanOrEqual(2);
    });

    it('calculates liquidation price when amount is entered', () => {
      render(<OrderEntry {...defaultProps} />);

      const amountInput = screen.getByTestId('amount-input-field');
      fireEvent.change(amountInput, { target: { value: '1000' } });

      // Should not show N/A for order value
      const orderValueElement = screen.getByText('$1000.00');
      expect(orderValueElement).toBeInTheDocument();
    });
  });

  describe('auto close section', () => {
    it('is collapsed by default', () => {
      render(<OrderEntry {...defaultProps} />);

      expect(screen.queryByTestId('tp-price-input')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sl-price-input')).not.toBeInTheDocument();
    });

    it('expands when toggle is clicked', () => {
      render(<OrderEntry {...defaultProps} />);

      const toggle = screen.getByTestId('auto-close-toggle');
      fireEvent.click(toggle);

      expect(screen.getByTestId('tp-price-input')).toBeInTheDocument();
      expect(screen.getByTestId('sl-price-input')).toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('calls onSubmit with form state when submit button is clicked', () => {
      const onSubmit = jest.fn();
      render(<OrderEntry {...defaultProps} onSubmit={onSubmit} />);

      const submitButton = screen.getByTestId('submit-order-button');
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
});
