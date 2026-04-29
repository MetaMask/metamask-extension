import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../../../test/lib/i18n-helpers';
import configureStore from '../../../../../../store/store';
import mockState from '../../../../../../../test/data/mock-state.json';
import { AutoCloseSection } from './auto-close-section';

jest.mock('../../../../../../hooks/perps/usePerpsOrderFees', () => ({
  usePerpsOrderFees: () => ({
    feeRate: 0.00145,
    isLoading: false,
    hasError: false,
  }),
}));

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('AutoCloseSection', () => {
  const defaultProps = {
    enabled: false,
    onEnabledChange: jest.fn(),
    takeProfitPrice: '',
    onTakeProfitPriceChange: jest.fn(),
    stopLossPrice: '',
    onStopLossPriceChange: jest.fn(),
    direction: 'long' as const,
    currentPrice: 45000,
    leverage: 10,
    asset: 'BTC',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the auto close label', () => {
      renderWithProvider(<AutoCloseSection {...defaultProps} />, mockStore);

      // Text is lowercase 'c' in "Auto close"
      expect(
        screen.getByText(messages.perpsAutoClose.message),
      ).toBeInTheDocument();
    });

    it('renders the toggle button', () => {
      renderWithProvider(<AutoCloseSection {...defaultProps} />, mockStore);

      expect(screen.getByTestId('auto-close-toggle')).toBeInTheDocument();
    });

    it('hides TP/SL inputs when disabled', () => {
      renderWithProvider(
        <AutoCloseSection {...defaultProps} enabled={false} />,
        mockStore,
      );

      expect(screen.queryByTestId('tp-price-input')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sl-price-input')).not.toBeInTheDocument();
    });

    it('shows TP/SL inputs when enabled', () => {
      renderWithProvider(
        <AutoCloseSection {...defaultProps} enabled={true} />,
        mockStore,
      );

      expect(screen.getByTestId('tp-price-input')).toBeInTheDocument();
      expect(screen.getByTestId('sl-price-input')).toBeInTheDocument();
    });

    it('shows percent inputs when enabled', () => {
      renderWithProvider(
        <AutoCloseSection {...defaultProps} enabled={true} />,
        mockStore,
      );

      expect(screen.getByTestId('tp-percent-input')).toBeInTheDocument();
      expect(screen.getByTestId('sl-percent-input')).toBeInTheDocument();
    });
  });

  describe('toggle', () => {
    it('calls onEnabledChange when toggle is clicked', () => {
      const onEnabledChange = jest.fn();
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          onEnabledChange={onEnabledChange}
        />,
        mockStore,
      );

      const toggleInput = screen.getByTestId('auto-close-toggle');
      fireEvent.click(toggleInput);

      expect(onEnabledChange).toHaveBeenCalledWith(true);
    });
  });

  describe('take profit input', () => {
    it('displays take profit price', () => {
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          takeProfitPrice="50000"
        />,
        mockStore,
      );

      // TextField wraps an input, query the actual input element
      const container = screen.getByTestId('tp-price-input');
      const input = container.querySelector('input');
      expect(input).toHaveValue('50000');
    });

    it('calls onTakeProfitPriceChange when input changes', () => {
      const onTakeProfitPriceChange = jest.fn();
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          onTakeProfitPriceChange={onTakeProfitPriceChange}
        />,
        mockStore,
      );

      const container = screen.getByTestId('tp-price-input');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '50000' },
      });

      expect(onTakeProfitPriceChange).toHaveBeenCalledWith('50000');
    });

    it('rejects invalid input', () => {
      const onTakeProfitPriceChange = jest.fn();
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          onTakeProfitPriceChange={onTakeProfitPriceChange}
        />,
        mockStore,
      );

      const container = screen.getByTestId('tp-price-input');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, { target: { value: 'abc' } });

      expect(onTakeProfitPriceChange).not.toHaveBeenCalled();
    });

    it('normalizes take profit price on blur', () => {
      const onTakeProfitPriceChange = jest.fn();
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          takeProfitPrice="50000.1"
          onTakeProfitPriceChange={onTakeProfitPriceChange}
        />,
        mockStore,
      );

      const container = screen.getByTestId('tp-price-input');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.blur(input as HTMLInputElement);

      expect(onTakeProfitPriceChange).toHaveBeenCalledWith('50000.1');
    });

    it('clears take profit price on blur when value is non-positive', () => {
      const onTakeProfitPriceChange = jest.fn();
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          takeProfitPrice="0"
          onTakeProfitPriceChange={onTakeProfitPriceChange}
        />,
        mockStore,
      );

      const container = screen.getByTestId('tp-price-input');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.blur(input as HTMLInputElement);

      expect(onTakeProfitPriceChange).toHaveBeenCalledWith('');
    });
  });

  describe('stop loss input', () => {
    it('displays stop loss price', () => {
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          stopLossPrice="40000"
        />,
        mockStore,
      );

      const container = screen.getByTestId('sl-price-input');
      const input = container.querySelector('input');
      expect(input).toHaveValue('40000');
    });

    it('calls onStopLossPriceChange when input changes', () => {
      const onStopLossPriceChange = jest.fn();
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          onStopLossPriceChange={onStopLossPriceChange}
        />,
        mockStore,
      );

      const container = screen.getByTestId('sl-price-input');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '40000' },
      });

      expect(onStopLossPriceChange).toHaveBeenCalledWith('40000');
    });

    it('normalizes stop loss price on blur', () => {
      const onStopLossPriceChange = jest.fn();
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          stopLossPrice="40000.1"
          onStopLossPriceChange={onStopLossPriceChange}
        />,
        mockStore,
      );

      const container = screen.getByTestId('sl-price-input');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.blur(input as HTMLInputElement);

      expect(onStopLossPriceChange).toHaveBeenCalledWith('40000.1');
    });

    it('clears stop loss price on blur when value is non-positive', () => {
      const onStopLossPriceChange = jest.fn();
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          stopLossPrice="0"
          onStopLossPriceChange={onStopLossPriceChange}
        />,
        mockStore,
      );

      const container = screen.getByTestId('sl-price-input');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.blur(input as HTMLInputElement);

      expect(onStopLossPriceChange).toHaveBeenCalledWith('');
    });
  });

  describe('clear buttons', () => {
    it('shows TP clear button when takeProfitPrice is set', () => {
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          takeProfitPrice="50000"
        />,
        mockStore,
      );

      expect(screen.getByTestId('tp-clear-button')).toBeInTheDocument();
    });

    it('does not show TP clear button when takeProfitPrice is empty', () => {
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          takeProfitPrice=""
        />,
        mockStore,
      );

      expect(screen.queryByTestId('tp-clear-button')).not.toBeInTheDocument();
    });

    it('calls onTakeProfitPriceChange with empty string when TP clear is clicked', () => {
      const onTakeProfitPriceChange = jest.fn();
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          takeProfitPrice="50000"
          onTakeProfitPriceChange={onTakeProfitPriceChange}
        />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('tp-clear-button'));

      expect(onTakeProfitPriceChange).toHaveBeenCalledWith('');
    });

    it('shows SL clear button when stopLossPrice is set', () => {
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          stopLossPrice="40000"
        />,
        mockStore,
      );

      expect(screen.getByTestId('sl-clear-button')).toBeInTheDocument();
    });

    it('does not show SL clear button when stopLossPrice is empty', () => {
      renderWithProvider(
        <AutoCloseSection {...defaultProps} enabled={true} stopLossPrice="" />,
        mockStore,
      );

      expect(screen.queryByTestId('sl-clear-button')).not.toBeInTheDocument();
    });

    it('calls onStopLossPriceChange with empty string when SL clear is clicked', () => {
      const onStopLossPriceChange = jest.fn();
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          stopLossPrice="40000"
          onStopLossPriceChange={onStopLossPriceChange}
        />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('sl-clear-button'));

      expect(onStopLossPriceChange).toHaveBeenCalledWith('');
    });

    it('shows TP pnl row when takeProfitPrice has whitespace-only value (no clear button)', () => {
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          takeProfitPrice="   "
        />,
        mockStore,
      );

      expect(screen.queryByTestId('tp-clear-button')).not.toBeInTheDocument();
    });

    it('shows SL pnl row when stopLossPrice has whitespace-only value (no clear button)', () => {
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          stopLossPrice="   "
        />,
        mockStore,
      );

      expect(screen.queryByTestId('sl-clear-button')).not.toBeInTheDocument();
    });
  });

  describe('percentage calculation (RoE: priceChange% * leverage)', () => {
    it('calculates RoE% for long TP position', () => {
      // (49500 - 45000) / 45000 * 10 * 100 = 100%
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          direction="long"
          currentPrice={45000}
          leverage={10}
          takeProfitPrice="49500"
        />,
        mockStore,
      );

      const container = screen.getByTestId('tp-percent-input');
      const percentInput = container.querySelector('input');
      expect(percentInput).toHaveValue('100');
    });

    it('calculates RoE% for long SL position', () => {
      // SL below entry: (40500 - 45000) / 45000 * 10 * 100 = -100% (loss = negative RoE)
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          direction="long"
          currentPrice={45000}
          leverage={10}
          stopLossPrice="40500"
        />,
        mockStore,
      );

      const container = screen.getByTestId('sl-percent-input');
      const percentInput = container.querySelector('input');
      expect(percentInput).toHaveValue('-100');
    });

    it('shows empty percent when TP price is empty', () => {
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          takeProfitPrice=""
        />,
        mockStore,
      );

      const container = screen.getByTestId('tp-percent-input');
      const percentInput = container.querySelector('input');
      expect(percentInput).toHaveValue('');
    });

    it('shows non-integer RoE% with 2 decimal places', () => {
      // (45225 - 45000) / 45000 * 10 * 100 = 50%  (exact)
      // (45112.5 - 45000) / 45000 * 10 * 100 = 25% (exact)
      // Test a non-integer: leverage=3, entry=45000, tp=45500
      // (500/45000)*3*100 = 3.33
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          direction="long"
          currentPrice={45000}
          leverage={3}
          takeProfitPrice="45500"
        />,
        mockStore,
      );

      const container = screen.getByTestId('tp-percent-input');
      const percentInput = container.querySelector('input');
      // (500/45000)*3*100 = 3.333... -> toFixed(2) = "3.33"
      expect(percentInput).toHaveValue('3.33');
    });
  });

  describe('bidirectional input', () => {
    it('updates price when RoE% is entered for TP (long)', () => {
      // 10% RoE at leverage=10: priceChange = 10/(10*100) = 1% -> 45000 * 1.01 = 45450
      const onTakeProfitPriceChange = jest.fn();
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          direction="long"
          currentPrice={45000}
          leverage={10}
          onTakeProfitPriceChange={onTakeProfitPriceChange}
        />,
        mockStore,
      );

      const container = screen.getByTestId('tp-percent-input');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '10' },
      });

      expect(onTakeProfitPriceChange).toHaveBeenCalledWith('45450');
    });

    it('updates price when RoE% is entered for SL (long)', () => {
      // -10% RoE at leverage=10: priceChange = -10/(10*100) = -1% -> 45000 * 0.99 = 44550
      // Negative RoE = loss direction = SL below entry for long
      const onStopLossPriceChange = jest.fn();
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          direction="long"
          currentPrice={45000}
          leverage={10}
          onStopLossPriceChange={onStopLossPriceChange}
        />,
        mockStore,
      );

      const container = screen.getByTestId('sl-percent-input');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '-10' },
      });

      expect(onStopLossPriceChange).toHaveBeenCalledWith('44550');
    });

    it('uses limit price as baseline when typing SL % on a limit order', () => {
      // currentPrice=$3,000 but limitPrice=$2,000 (below-market limit buy).
      // -10% RoE at leverage=10: priceChange = -1% -> $2,000 * 0.99 = $1,980 (not $2,970)
      // Negative RoE = loss direction = SL below entry
      const onStopLossPriceChange = jest.fn();
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          direction="long"
          currentPrice={3000}
          orderType="limit"
          limitPrice="2000"
          leverage={10}
          onStopLossPriceChange={onStopLossPriceChange}
        />,
        mockStore,
      );

      const container = screen.getByTestId('sl-percent-input');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, { target: { value: '-10' } });

      expect(onStopLossPriceChange).toHaveBeenCalledWith('1980');
    });

    it('uses limit price as baseline when typing TP % on a limit order', () => {
      // currentPrice=$3,000 but limitPrice=$2,000.
      // 10% RoE at leverage=10: priceChange = 1% -> $2,000 * 1.01 = $2,020 (not $3,030)
      const onTakeProfitPriceChange = jest.fn();
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          direction="long"
          currentPrice={3000}
          orderType="limit"
          limitPrice="2000"
          leverage={10}
          onTakeProfitPriceChange={onTakeProfitPriceChange}
        />,
        mockStore,
      );

      const container = screen.getByTestId('tp-percent-input');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, { target: { value: '10' } });

      expect(onTakeProfitPriceChange).toHaveBeenCalledWith('2020');
    });

    it('displays SL % relative to limit price when a price is pre-set on a limit order', () => {
      // SL at $1,980 with limit entry $2,000 at 10x leverage:
      // RoE% = (1980 - 2000) / 2000 * 10 * 100 = -10% (loss = negative RoE for long below entry)
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          direction="long"
          currentPrice={3000}
          orderType="limit"
          limitPrice="2000"
          leverage={10}
          stopLossPrice="1980"
        />,
        mockStore,
      );

      const container = screen.getByTestId('sl-percent-input');
      const percentInput = container.querySelector('input');
      expect(percentInput).toHaveValue('-10');
    });

    it('falls back to current price for % calculation when limit price is empty', () => {
      // Same as regular market order when limitPrice is empty
      // -10% RoE at 10x from $3,000: SL = $3,000 * 0.99 = $2,970
      // Negative RoE = loss direction = SL below entry for long
      const onStopLossPriceChange = jest.fn();
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          direction="long"
          currentPrice={3000}
          orderType="limit"
          limitPrice=""
          leverage={10}
          onStopLossPriceChange={onStopLossPriceChange}
        />,
        mockStore,
      );

      const container = screen.getByTestId('sl-percent-input');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, { target: { value: '-10' } });

      expect(onStopLossPriceChange).toHaveBeenCalledWith('2970');
    });
  });

  describe('percent input focus/blur behavior (no decimal insertion)', () => {
    it('shows raw user input while percent field is focused', () => {
      const onTakeProfitPriceChange = jest.fn();
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          direction="long"
          currentPrice={45000}
          leverage={10}
          onTakeProfitPriceChange={onTakeProfitPriceChange}
        />,
        mockStore,
      );

      const container = screen.getByTestId('tp-percent-input');
      const input = container.querySelector('input') as HTMLInputElement;

      fireEvent.focus(input);
      // Type "1" first
      fireEvent.change(input, { target: { value: '1' } });
      // The raw value "1" should be visible, NOT reformatted to "1.0" or similar
      expect(input.value).toBe('1');

      // Type "5" to form "15"
      fireEvent.change(input, { target: { value: '15' } });
      expect(input.value).toBe('15');
    });

    it('does not insert a decimal point when typing whole numbers', () => {
      const onTakeProfitPriceChange = jest.fn();
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          direction="long"
          currentPrice={45000}
          leverage={10}
          onTakeProfitPriceChange={onTakeProfitPriceChange}
        />,
        mockStore,
      );

      const container = screen.getByTestId('tp-percent-input');
      const input = container.querySelector('input') as HTMLInputElement;

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '15' } });

      // Should display "15", not "1.5" or "1.05"
      expect(input.value).toBe('15');

      // Should have called price change with the correct RoE-derived price
      // 15% RoE at 10x: 45000 * (1 + 15/1000) = 45000 * 1.015 = 45675
      expect(onTakeProfitPriceChange).toHaveBeenLastCalledWith('45675');
    });

    it('reverts to derived formatted value when percent field is blurred', () => {
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          direction="long"
          currentPrice={45000}
          leverage={10}
          takeProfitPrice="45450"
        />,
        mockStore,
      );

      const container = screen.getByTestId('tp-percent-input');
      const input = container.querySelector('input') as HTMLInputElement;

      // While focused: raw value
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '10' } });
      expect(input.value).toBe('10');

      // After blur: derived formatted value shown
      fireEvent.blur(input);
      // (45450 - 45000) / 45000 * 10 * 100 = 10 -> formats to "10"
      expect(input.value).toBe('10');
    });
  });

  describe('validation errors', () => {
    it('shows TP error when long TP is below current price (market order)', () => {
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          direction="long"
          currentPrice={50000}
          takeProfitPrice="48000"
        />,
        mockStore,
      );

      expect(screen.getByTestId('tp-validation-error')).toHaveTextContent(
        /above.*current/iu,
      );
    });

    it('does not show TP error when long TP is above current price', () => {
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          direction="long"
          currentPrice={50000}
          takeProfitPrice="55000"
        />,
        mockStore,
      );

      expect(
        screen.queryByTestId('tp-validation-error'),
      ).not.toBeInTheDocument();
    });

    it('shows SL error when long SL is above current price (market order)', () => {
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          direction="long"
          currentPrice={50000}
          stopLossPrice="55000"
        />,
        mockStore,
      );

      expect(screen.getByTestId('sl-validation-error')).toHaveTextContent(
        /below.*current/iu,
      );
    });

    it('uses limit price as reference for limit orders', () => {
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          direction="long"
          currentPrice={50000}
          takeProfitPrice="48000"
          orderType="limit"
          limitPrice="45000"
        />,
        mockStore,
      );

      // TP $48k > limit $45k → valid for limit order, no error
      expect(
        screen.queryByTestId('tp-validation-error'),
      ).not.toBeInTheDocument();
    });

    it('shows error referencing entry price for limit orders', () => {
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          direction="long"
          currentPrice={50000}
          takeProfitPrice="44000"
          orderType="limit"
          limitPrice="45000"
        />,
        mockStore,
      );

      // TP $44k < limit $45k → invalid
      expect(screen.getByTestId('tp-validation-error')).toHaveTextContent(
        /above.*entry/iu,
      );
    });

    it('falls back to currentPrice when limit price is empty', () => {
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          direction="long"
          currentPrice={50000}
          takeProfitPrice="48000"
          orderType="limit"
          limitPrice=""
        />,
        mockStore,
      );

      // No limit price → falls back to currentPrice ($50k), TP $48k < $50k → invalid
      expect(screen.getByTestId('tp-validation-error')).toHaveTextContent(
        /above.*current/iu,
      );
    });
  });

  describe('locale handling', () => {
    it('keeps raw dot-decimal TP value in de locale', () => {
      const onTakeProfitPriceChange = jest.fn();
      const deStore = configureStore({
        localeMessages: {
          ...(mockState.localeMessages ?? {}),
          currentLocale: 'de',
        },
      });

      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          takeProfitPrice="45050.00"
          onTakeProfitPriceChange={onTakeProfitPriceChange}
        />,
        deStore,
      );

      const container = screen.getByTestId('tp-price-input');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      expect(input).toHaveValue('45050.00');
      fireEvent.blur(input as HTMLInputElement);

      expect(onTakeProfitPriceChange).toHaveBeenCalledWith('45050');
    });

    it('rejects non-en-US locale-formatted TP input while typing', () => {
      const onTakeProfitPriceChange = jest.fn();
      const deStore = configureStore({
        localeMessages: {
          ...(mockState.localeMessages ?? {}),
          currentLocale: 'de',
        },
      });

      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          takeProfitPrice=""
          onTakeProfitPriceChange={onTakeProfitPriceChange}
        />,
        deStore,
      );

      const container = screen.getByTestId('tp-price-input');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();

      fireEvent.focus(input as HTMLInputElement);
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '45.050,00' },
      });

      expect(onTakeProfitPriceChange).not.toHaveBeenCalled();
    });
  });
});
