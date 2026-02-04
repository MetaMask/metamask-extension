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

    it('shows gain/loss inputs when enabled', () => {
      renderWithProvider(
        <AutoCloseSection {...defaultProps} enabled={true} />,
        mockStore,
      );

      expect(screen.getByTestId('tp-gain-input')).toBeInTheDocument();
      expect(screen.getByTestId('sl-loss-input')).toBeInTheDocument();
    });

    it('shows unit toggle buttons when enabled', () => {
      renderWithProvider(
        <AutoCloseSection {...defaultProps} enabled={true} />,
        mockStore,
      );

      expect(screen.getByTestId('tp-unit-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('sl-unit-toggle')).toBeInTheDocument();
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

  describe('gain/loss calculation', () => {
    it('calculates gain for long position', () => {
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

      const container = screen.getByTestId('tp-gain-input');
      const gainInput = container.querySelector('input');
      // (49500 - 45000) / 45000 * 100 = 10%
      expect(gainInput).toHaveValue('10.00');
    });

    it('calculates loss for long position', () => {
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

      const container = screen.getByTestId('sl-loss-input');
      const lossInput = container.querySelector('input');
      // (40500 - 45000) / 45000 * 100 = -10%, absolute = 10%
      expect(lossInput).toHaveValue('10.00');
    });

    it('shows empty gain when TP price is empty', () => {
      renderWithProvider(
        <AutoCloseSection
          {...defaultProps}
          enabled={true}
          takeProfitPrice=""
        />,
        mockStore,
      );

      const container = screen.getByTestId('tp-gain-input');
      const gainInput = container.querySelector('input');
      expect(gainInput).toHaveValue('');
    });
  });

  describe('unit toggle', () => {
    it('displays % symbol by default for TP', () => {
      renderWithProvider(
        <AutoCloseSection {...defaultProps} enabled={true} />,
        mockStore,
      );

      const tpToggle = screen.getByTestId('tp-unit-toggle');
      expect(tpToggle).toHaveTextContent('%');
    });

    it('toggles to $ when clicked for TP', () => {
      renderWithProvider(
        <AutoCloseSection {...defaultProps} enabled={true} />,
        mockStore,
      );

      const tpToggle = screen.getByTestId('tp-unit-toggle');
      fireEvent.click(tpToggle);

      expect(tpToggle).toHaveTextContent('$');
    });

    it('toggles back to % when clicked again for TP', () => {
      renderWithProvider(
        <AutoCloseSection {...defaultProps} enabled={true} />,
        mockStore,
      );

      const tpToggle = screen.getByTestId('tp-unit-toggle');
      fireEvent.click(tpToggle);
      fireEvent.click(tpToggle);

      expect(tpToggle).toHaveTextContent('%');
    });
  });
});
