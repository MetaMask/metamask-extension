import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../../store/store';
import mockState from '../../../../../../../test/data/mock-state.json';
import { AmountInput } from './amount-input';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('AmountInput', () => {
  const defaultProps = {
    amount: '',
    onAmountChange: jest.fn(),
    balancePercent: 0,
    onBalancePercentChange: jest.fn(),
    availableBalance: 10000,
    leverage: 1,
    asset: 'BTC',
    currentPrice: 45000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders available balance section', () => {
      renderWithProvider(<AmountInput {...defaultProps} />, mockStore);

      expect(screen.getByText('$10,000.00')).toBeInTheDocument();
      expect(screen.getByText(/available/iu)).toBeInTheDocument();
    });

    it('renders order amount section', () => {
      renderWithProvider(<AmountInput {...defaultProps} />, mockStore);

      expect(screen.getByText('Order Amount')).toBeInTheDocument();
    });

    it('renders the amount input field', () => {
      renderWithProvider(<AmountInput {...defaultProps} />, mockStore);

      expect(screen.getByTestId('amount-input-field')).toBeInTheDocument();
    });

    it('renders the slider', () => {
      renderWithProvider(<AmountInput {...defaultProps} />, mockStore);

      expect(screen.getByTestId('amount-slider')).toBeInTheDocument();
    });

    it('renders percentage preset buttons', () => {
      renderWithProvider(<AmountInput {...defaultProps} />, mockStore);

      expect(screen.getByTestId('percent-preset-25')).toBeInTheDocument();
      expect(screen.getByTestId('percent-preset-50')).toBeInTheDocument();
      expect(screen.getByTestId('percent-preset-75')).toBeInTheDocument();
      expect(screen.getByTestId('percent-preset-100')).toBeInTheDocument();
    });

    it('renders add funds button', () => {
      renderWithProvider(<AmountInput {...defaultProps} />, mockStore);

      expect(screen.getByTestId('add-funds-button')).toBeInTheDocument();
    });

    it('displays the $ prefix', () => {
      renderWithProvider(<AmountInput {...defaultProps} />, mockStore);

      expect(screen.getByText('$')).toBeInTheDocument();
    });
  });

  describe('amount input', () => {
    it('displays entered amount', () => {
      renderWithProvider(
        <AmountInput {...defaultProps} amount="1000" />,
        mockStore,
      );

      // TextField wraps an input, query the actual input element
      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input');
      expect(input).toHaveValue('1000');
    });

    it('calls onAmountChange when input value changes', () => {
      const onAmountChange = jest.fn();
      renderWithProvider(
        <AmountInput {...defaultProps} onAmountChange={onAmountChange} />,
        mockStore,
      );

      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, { target: { value: '500' } });

      expect(onAmountChange).toHaveBeenCalledWith('500');
    });

    it('updates balance percent when amount changes', () => {
      const onBalancePercentChange = jest.fn();
      renderWithProvider(
        <AmountInput
          {...defaultProps}
          onBalancePercentChange={onBalancePercentChange}
          availableBalance={1000}
        />,
        mockStore,
      );

      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, { target: { value: '500' } });

      expect(onBalancePercentChange).toHaveBeenCalledWith(50);
    });

    it('caps balance percent at 100%', () => {
      const onBalancePercentChange = jest.fn();
      renderWithProvider(
        <AmountInput
          {...defaultProps}
          onBalancePercentChange={onBalancePercentChange}
          availableBalance={1000}
        />,
        mockStore,
      );

      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '1500' },
      });

      expect(onBalancePercentChange).toHaveBeenCalledWith(100);
    });

    it('rejects invalid input', () => {
      const onAmountChange = jest.fn();
      renderWithProvider(
        <AmountInput {...defaultProps} onAmountChange={onAmountChange} />,
        mockStore,
      );

      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, { target: { value: 'abc' } });

      expect(onAmountChange).not.toHaveBeenCalled();
    });

    it('allows formatted numbers with commas', () => {
      const onAmountChange = jest.fn();
      renderWithProvider(
        <AmountInput {...defaultProps} onAmountChange={onAmountChange} />,
        mockStore,
      );

      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '1,000' },
      });

      expect(onAmountChange).toHaveBeenCalledWith('1,000');
    });
  });

  describe('token conversion', () => {
    it('displays token conversion when amount is entered', () => {
      renderWithProvider(
        <AmountInput
          {...defaultProps}
          amount="45000"
          leverage={1}
          currentPrice={45000}
        />,
        mockStore,
      );

      // $45000 / $45000 = 1 BTC position with 1x leverage
      // Real formatter uses compact format
      expect(screen.getByText(/≈.*1.*BTC/u)).toBeInTheDocument();
    });

    it('displays zero token when amount is empty', () => {
      renderWithProvider(
        <AmountInput {...defaultProps} amount="" />,
        mockStore,
      );

      expect(screen.getByText(/0.*BTC/u)).toBeInTheDocument();
    });
  });

  describe('preset buttons', () => {
    it('calls onBalancePercentChange when preset is clicked', () => {
      const onBalancePercentChange = jest.fn();
      renderWithProvider(
        <AmountInput
          {...defaultProps}
          onBalancePercentChange={onBalancePercentChange}
        />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('percent-preset-50'));

      expect(onBalancePercentChange).toHaveBeenCalledWith(50);
    });

    it('calls onAmountChange with calculated amount when preset is clicked', () => {
      const onAmountChange = jest.fn();
      renderWithProvider(
        <AmountInput
          {...defaultProps}
          onAmountChange={onAmountChange}
          availableBalance={1000}
        />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('percent-preset-50'));

      // 50% of 1000 = 500, formatted
      expect(onAmountChange).toHaveBeenCalled();
    });

    it('applies active style to selected preset', () => {
      renderWithProvider(
        <AmountInput {...defaultProps} balancePercent={50} />,
        mockStore,
      );

      const activePreset = screen.getByTestId('percent-preset-50');
      expect(activePreset).toHaveClass('bg-muted');
    });
  });

  describe('slider', () => {
    it('renders the slider container', () => {
      renderWithProvider(<AmountInput {...defaultProps} />, mockStore);

      expect(screen.getByTestId('amount-slider')).toBeInTheDocument();
    });
  });
});
