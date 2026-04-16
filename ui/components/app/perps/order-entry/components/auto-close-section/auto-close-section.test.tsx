import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../../store/store';
import mockState from '../../../../../../../test/data/mock-state.json';
import { AutoCloseSection } from './auto-close-section';

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
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the auto close label', () => {
      renderWithProvider(<AutoCloseSection {...defaultProps} />, mockStore);

      // Text is lowercase 'c' in "Auto close"
      expect(screen.getByText('Auto close')).toBeInTheDocument();
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

    it('shows preset buttons when enabled', () => {
      renderWithProvider(
        <AutoCloseSection {...defaultProps} enabled={true} />,
        mockStore,
      );

      // TP presets: +10%, +25%, +50%, +100%
      expect(screen.getByTestId('tp-preset-10')).toBeInTheDocument();
      expect(screen.getByTestId('tp-preset-25')).toBeInTheDocument();
      expect(screen.getByTestId('tp-preset-50')).toBeInTheDocument();
      expect(screen.getByTestId('tp-preset-100')).toBeInTheDocument();

      // SL presets: -10%, -25%, -50%, -75%
      expect(screen.getByTestId('sl-preset-10')).toBeInTheDocument();
      expect(screen.getByTestId('sl-preset-25')).toBeInTheDocument();
      expect(screen.getByTestId('sl-preset-50')).toBeInTheDocument();
      expect(screen.getByTestId('sl-preset-75')).toBeInTheDocument();
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
  });

  describe('percentage calculation', () => {
    it('calculates percent for long TP position', () => {
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          direction="long"
          currentPrice={45000}
          takeProfitPrice="49500"
        />,
        mockStore,
      );

      const container = screen.getByTestId('tp-percent-input');
      const percentInput = container.querySelector('input');
      // (49500 - 45000) / 45000 * 100 = 10%
      expect(percentInput).toHaveValue('10.0');
    });

    it('calculates percent for long SL position', () => {
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          direction="long"
          currentPrice={45000}
          stopLossPrice="40500"
        />,
        mockStore,
      );

      const container = screen.getByTestId('sl-percent-input');
      const percentInput = container.querySelector('input');
      // (40500 - 45000) / 45000 * 100 = -10%, shown as positive 10%
      expect(percentInput).toHaveValue('10.0');
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
  });

  describe('preset buttons', () => {
    it('sets TP price when preset is clicked for long position', () => {
      const onTakeProfitPriceChange = jest.fn();
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          direction="long"
          currentPrice={45000}
          onTakeProfitPriceChange={onTakeProfitPriceChange}
        />,
        mockStore,
      );

      const preset10 = screen.getByTestId('tp-preset-10');
      fireEvent.click(preset10);

      // For long +10%: 45000 * 1.10 = 49500
      expect(onTakeProfitPriceChange).toHaveBeenCalledWith('49,500.00');
    });

    it('sets SL price when preset is clicked for long position', () => {
      const onStopLossPriceChange = jest.fn();
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          direction="long"
          currentPrice={45000}
          onStopLossPriceChange={onStopLossPriceChange}
        />,
        mockStore,
      );

      const preset10 = screen.getByTestId('sl-preset-10');
      fireEvent.click(preset10);

      // For long -10%: 45000 * 0.90 = 40500
      expect(onStopLossPriceChange).toHaveBeenCalledWith('40,500.00');
    });

    it('sets TP price when preset is clicked for short position', () => {
      const onTakeProfitPriceChange = jest.fn();
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          direction="short"
          currentPrice={45000}
          onTakeProfitPriceChange={onTakeProfitPriceChange}
        />,
        mockStore,
      );

      const preset10 = screen.getByTestId('tp-preset-10');
      fireEvent.click(preset10);

      // For short +10% profit: 45000 * 0.90 = 40500
      expect(onTakeProfitPriceChange).toHaveBeenCalledWith('40,500.00');
    });

    it('sets SL price when preset is clicked for short position', () => {
      const onStopLossPriceChange = jest.fn();
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          direction="short"
          currentPrice={45000}
          onStopLossPriceChange={onStopLossPriceChange}
        />,
        mockStore,
      );

      const preset10 = screen.getByTestId('sl-preset-10');
      fireEvent.click(preset10);

      // For short -10% loss: 45000 * 1.10 = 49500
      expect(onStopLossPriceChange).toHaveBeenCalledWith('49,500.00');
    });
  });

  describe('bidirectional input', () => {
    it('updates price when percent is entered for TP', () => {
      const onTakeProfitPriceChange = jest.fn();
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          direction="long"
          currentPrice={45000}
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

      // For long +10%: 45000 * 1.10 = 49500
      expect(onTakeProfitPriceChange).toHaveBeenCalledWith('49,500.00');
    });

    it('updates price when percent is entered for SL', () => {
      const onStopLossPriceChange = jest.fn();
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          direction="long"
          currentPrice={45000}
          onStopLossPriceChange={onStopLossPriceChange}
        />,
        mockStore,
      );

      const container = screen.getByTestId('sl-percent-input');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '10' },
      });

      // For long -10%: 45000 * 0.90 = 40500
      expect(onStopLossPriceChange).toHaveBeenCalledWith('40,500.00');
    });
  });
});
