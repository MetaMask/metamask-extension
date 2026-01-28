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
      perpsOrderAmount: 'Order Amount',
      perpsLeverage: 'Leverage',
      perpsMargin: 'Margin',
      perpsFees: 'Fees',
      perpsLiquidationPriceEst: 'Liquidation Price Est.',
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
      expect(screen.getByText('Available to Trade')).toBeInTheDocument();
      expect(screen.getByText('Order Amount')).toBeInTheDocument();
      expect(screen.getByTestId('amount-input-field')).toBeInTheDocument();
      expect(screen.getByTestId('leverage-slider')).toBeInTheDocument();
      expect(screen.getByText('Margin')).toBeInTheDocument();
      expect(screen.getByText('Fees')).toBeInTheDocument();
      expect(screen.getByText('Liquidation Price Est.')).toBeInTheDocument();
      expect(screen.getByText('Auto Close')).toBeInTheDocument();
      expect(screen.getByTestId('order-entry-submit-button')).toBeInTheDocument();
    });

    it('displays available balance', () => {
      render(<OrderEntry {...defaultProps} />);

      expect(screen.getByText('$10,000.00')).toBeInTheDocument();
    });

    it('displays correct submit button text for long direction', () => {
      render(<OrderEntry {...defaultProps} />);

      expect(screen.getByTestId('order-entry-submit-button')).toHaveTextContent('Open Long BTC');
    });

    it('respects initialDirection prop for short', () => {
      render(<OrderEntry {...defaultProps} initialDirection="short" />);

      expect(screen.getByTestId('order-entry-submit-button')).toHaveTextContent('Open Short BTC');
    });
  });

  describe('amount input', () => {
    it('allows entering amount', () => {
      render(<OrderEntry {...defaultProps} />);

      const amountInput = screen.getByTestId('amount-input-field');
      fireEvent.change(amountInput, { target: { value: '1000' } });

      expect(amountInput).toHaveValue('1000');
    });

    it('shows token conversion when amount is entered', () => {
      render(<OrderEntry {...defaultProps} />);

      const amountInput = screen.getByTestId('amount-input-field');
      fireEvent.change(amountInput, { target: { value: '45250' } });

      // $45250 / $45250 = 1 BTC
      expect(screen.getByText('≈ 1.000000 BTC')).toBeInTheDocument();
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
    it('shows dash when no amount entered', () => {
      render(<OrderEntry {...defaultProps} />);

      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThanOrEqual(3);
    });

    it('calculates values when amount is entered', () => {
      render(<OrderEntry {...defaultProps} />);

      const amountInput = screen.getByTestId('amount-input-field');
      fireEvent.change(amountInput, { target: { value: '1000' } });

      // Should show calculated margin (1000 / 1 leverage = $1000)
      expect(screen.getByText('$1000.00')).toBeInTheDocument();
      // Should show calculated fees (0.05% of 1000 = $0.50)
      expect(screen.getByText('$0.50')).toBeInTheDocument();
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
});
