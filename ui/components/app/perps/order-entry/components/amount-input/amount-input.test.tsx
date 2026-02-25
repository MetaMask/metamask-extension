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
    it('renders Size label and available to trade text', () => {
      renderWithProvider(<AmountInput {...defaultProps} />, mockStore);

      expect(screen.getByText('Size')).toBeInTheDocument();
      expect(screen.getByText('Available to trade')).toBeInTheDocument();
      expect(screen.getByText(/USDC/u)).toBeInTheDocument();
    });

    it('renders the amount input field', () => {
      renderWithProvider(<AmountInput {...defaultProps} />, mockStore);

      expect(screen.getByTestId('amount-input-field')).toBeInTheDocument();
    });

    it('renders the token amount input field', () => {
      renderWithProvider(<AmountInput {...defaultProps} />, mockStore);

      expect(
        screen.getByTestId('amount-input-token-field'),
      ).toBeInTheDocument();
    });

    it('renders the slider', () => {
      renderWithProvider(<AmountInput {...defaultProps} />, mockStore);

      expect(screen.getByTestId('amount-slider')).toBeInTheDocument();
    });

    it('displays the $ prefix', () => {
      renderWithProvider(<AmountInput {...defaultProps} />, mockStore);

      expect(screen.getByText('$')).toBeInTheDocument();
    });

    it('displays percentage pill', () => {
      renderWithProvider(
        <AmountInput {...defaultProps} balancePercent={25} />,
        mockStore,
      );

      const container = screen.getByTestId('balance-percent-input');
      const input = container.querySelector('input');
      expect(input).toHaveValue('25');
      expect(screen.getByText('%')).toBeInTheDocument();
    });
  });

  describe('amount input', () => {
    it('displays entered amount', () => {
      renderWithProvider(
        <AmountInput {...defaultProps} amount="1000" />,
        mockStore,
      );

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

  describe('slider', () => {
    it('renders the slider container', () => {
      renderWithProvider(<AmountInput {...defaultProps} />, mockStore);

      expect(screen.getByTestId('amount-slider')).toBeInTheDocument();
    });
  });
});
